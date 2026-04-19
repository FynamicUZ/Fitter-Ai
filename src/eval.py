"""Evaluate a checkpoint on the Nutrition5k test split."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import torch
from torch.utils.data import DataLoader

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.data import Nutrition5kDataset, TargetNormalizer, build_splits
from src.model import NutritionNet
from src.train import evaluate


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", required=True)
    ap.add_argument("--batch_size", type=int, default=64)
    args = ap.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    state = torch.load(args.ckpt, map_location=device)
    cfg = state["config"]
    target_names = cfg["targets"]["names"]
    data_root = Path(cfg["data"]["root"])

    _, _, test_recs = build_splits(
        data_root=data_root,
        metadata_files=cfg["data"]["metadata_files"],
        splits_dir=cfg["data"]["splits_dir"],
        train_split=cfg["data"]["train_split"],
        test_split=cfg["data"]["test_split"],
        val_fraction=cfg["data"]["val_fraction"],
        seed=cfg["train"]["seed"],
    )
    print(f"[eval] test records: {len(test_recs)}")

    normalizer = TargetNormalizer.from_state_dict(state["normalizer"])
    ds = Nutrition5kDataset(
        records=test_recs,
        data_root=data_root,
        images_subdir=cfg["data"]["images_subdir"],
        target_order=target_names,
        normalizer=normalizer,
        image_size=cfg["data"]["image_size"],
        train=False,
    )
    loader = DataLoader(ds, batch_size=args.batch_size, shuffle=False,
                        num_workers=cfg["data"]["num_workers"], pin_memory=True)

    model = NutritionNet(
        backbone=cfg["model"]["backbone"],
        pretrained=False,
        n_targets=len(target_names),
        hidden_dim=cfg["model"]["hidden_dim"],
        dropout=cfg["model"]["dropout"],
    ).to(device)
    model.load_state_dict(state["model"])

    metrics = evaluate(model, loader, device, normalizer, target_names)
    print("\n=== Test metrics ===")
    print(f"{'target':<10} {'MAE':>10} {'%MAE':>8}")
    units = {"calories": "kcal", "mass": "g", "fat": "g", "carb": "g", "protein": "g"}
    for n in target_names:
        mae, pct = metrics[n]
        print(f"{n:<10} {mae:>8.2f} {units.get(n, ''):<3} {pct:>6.1f}%")


if __name__ == "__main__":
    main()
