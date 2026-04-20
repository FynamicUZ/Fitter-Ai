"""Nutrition5k dataset + target normalization.

Nutrition5k metadata CSVs have a variable-length format:
    dish_id, total_calories, total_mass, total_fat, total_carb, total_protein,
    ingr_1_id, ingr_1_name, ingr_1_grams, ingr_1_calories, ingr_1_fat,
    ingr_1_carb, ingr_1_protein, ingr_2_id, ...

Only the first 6 fields (dish-level totals) are used here.
"""

from __future__ import annotations

import csv
import os
import random
from dataclasses import dataclass
from pathlib import Path

import albumentations as A
import cv2
import numpy as np
import torch
from albumentations.pytorch import ToTensorV2
from torch.utils.data import Dataset


IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


@dataclass
class DishRecord:
    dish_id: str
    calories: float
    mass: float
    fat: float
    carb: float
    protein: float

    def target_vector(self, order: list[str]) -> np.ndarray:
        return np.array([getattr(self, k) for k in order], dtype=np.float32)


def parse_metadata(csv_paths: list[Path]) -> dict[str, DishRecord]:
    records: dict[str, DishRecord] = {}
    for p in csv_paths:
        with open(p, newline="") as f:
            for row in csv.reader(f):
                if len(row) < 6 or not row[0]:
                    continue
                try:
                    rec = DishRecord(
                        dish_id=row[0].strip(),
                        calories=float(row[1]),
                        mass=float(row[2]),
                        fat=float(row[3]),
                        carb=float(row[4]),
                        protein=float(row[5]),
                    )
                except ValueError:
                    continue
                records[rec.dish_id] = rec
    return records


def read_split(path: Path) -> list[str]:
    with open(path) as f:
        return [line.strip() for line in f if line.strip()]


def build_splits(
    data_root: Path,
    metadata_files: list[str],
    splits_dir: str,
    train_split: str,
    test_split: str,
    val_fraction: float,
    seed: int,
) -> tuple[list[DishRecord], list[DishRecord], list[DishRecord]]:
    """Return (train, val, test) lists of DishRecord."""
    records = parse_metadata([data_root / p for p in metadata_files])

    train_ids = read_split(data_root / splits_dir / train_split)
    test_ids = read_split(data_root / splits_dir / test_split)

    # Keep only ids that have both metadata and an image directory.
    def keep(ids):
        out = []
        for i in ids:
            if i in records and (data_root / "realsense_overhead" / i / "rgb.png").exists():
                out.append(records[i])
        return out

    train_all = keep(train_ids)
    test = keep(test_ids)

    rng = random.Random(seed)
    rng.shuffle(train_all)
    n_val = max(1, int(len(train_all) * val_fraction))
    val = train_all[:n_val]
    train = train_all[n_val:]
    return train, val, test


class TargetNormalizer:
    """log1p + z-score. Stateless after fit; stats stored for checkpointing."""

    def __init__(self, mean: np.ndarray | None = None, std: np.ndarray | None = None):
        self.mean = mean
        self.std = std

    def fit(self, values: np.ndarray) -> "TargetNormalizer":
        log_vals = np.log1p(np.clip(values, a_min=0.0, a_max=None))
        self.mean = log_vals.mean(axis=0).astype(np.float32)
        self.std = (log_vals.std(axis=0) + 1e-6).astype(np.float32)
        return self

    def encode(self, values: np.ndarray) -> np.ndarray:
        return ((np.log1p(np.clip(values, 0, None)) - self.mean) / self.std).astype(np.float32)

    def decode(self, normed: np.ndarray) -> np.ndarray:
        log_vals = normed * self.std + self.mean
        return np.clip(np.expm1(log_vals), 0, None)

    def state_dict(self) -> dict:
        return {"mean": self.mean.tolist(), "std": self.std.tolist()}

    @classmethod
    def from_state_dict(cls, state: dict) -> "TargetNormalizer":
        return cls(mean=np.array(state["mean"], dtype=np.float32),
                   std=np.array(state["std"], dtype=np.float32))


def build_transforms(image_size: int, train: bool):
    if train:
        return A.Compose([
            A.SmallestMaxSize(max_size=int(image_size * 1.15)),
            A.RandomCrop(image_size, image_size),
            A.HorizontalFlip(p=0.5),
            A.Rotate(limit=25, border_mode=cv2.BORDER_REFLECT_101, p=0.5),
            A.Perspective(scale=(0.05, 0.10), p=0.3),
            A.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.25, hue=0.06, p=0.5),
            A.GaussianBlur(blur_limit=(3, 5), p=0.15),
            A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ToTensorV2(),
        ])
    return A.Compose([
        A.SmallestMaxSize(max_size=image_size),
        A.CenterCrop(image_size, image_size),
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ToTensorV2(),
    ])


class Nutrition5kDataset(Dataset):
    def __init__(
        self,
        records: list[DishRecord],
        data_root: Path,
        images_subdir: str,
        target_order: list[str],
        normalizer: TargetNormalizer,
        image_size: int,
        train: bool,
    ):
        self.records = records
        self.data_root = Path(data_root)
        self.images_subdir = images_subdir
        self.target_order = target_order
        self.normalizer = normalizer
        self.transform = build_transforms(image_size, train=train)

    def __len__(self) -> int:
        return len(self.records)

    def _load_image(self, dish_id: str) -> np.ndarray:
        path = self.data_root / self.images_subdir / dish_id / "rgb.png"
        img = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if img is None:
            raise FileNotFoundError(f"Could not read {path}")
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def __getitem__(self, idx: int):
        rec = self.records[idx]
        img = self._load_image(rec.dish_id)
        img = self.transform(image=img)["image"]
        raw = rec.target_vector(self.target_order)
        y = torch.from_numpy(self.normalizer.encode(raw))
        return {
            "image": img,
            "target": y,
            "target_raw": torch.from_numpy(raw),
            "dish_id": rec.dish_id,
        }


def stack_targets(records: list[DishRecord], order: list[str]) -> np.ndarray:
    return np.stack([r.target_vector(order) for r in records], axis=0)
