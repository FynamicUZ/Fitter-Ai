"""Model loading and single-image inference for the FastAPI backend."""

from __future__ import annotations

import io
import os

import albumentations as A
import cv2
import numpy as np
import torch
from albumentations.pytorch import ToTensorV2
from huggingface_hub import hf_hub_download
from PIL import Image

from model import NutritionNet

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)
TARGET_NAMES = ["calories", "mass", "fat", "carb", "protein"]
UNITS = {"calories": "kcal", "mass": "g", "fat": "g", "carb": "g", "protein": "g"}

_model = None
_normalizer = None
_transform = None
_device = None


class TargetNormalizer:
    def __init__(self, mean, std):
        self.mean = np.array(mean, dtype=np.float32)
        self.std = np.array(std, dtype=np.float32)

    def decode(self, normed: np.ndarray) -> np.ndarray:
        return np.clip(np.expm1(normed * self.std + self.mean), 0, None)


def _load():
    global _model, _normalizer, _transform, _device
    if _model is not None:
        return

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    repo_id = os.getenv("HF_MODEL_REPO", "FynamicUZ/fitter-b3")
    ckpt_path = hf_hub_download(repo_id=repo_id, filename="best.pt")

    state = torch.load(ckpt_path, map_location=_device)
    cfg = state["config"]

    _normalizer = TargetNormalizer(**state["normalizer"])

    _model = NutritionNet(
        backbone=cfg["model"]["backbone"],
        pretrained=False,
        n_targets=len(TARGET_NAMES),
        hidden_dim=cfg["model"]["hidden_dim"],
        dropout=cfg["model"]["dropout"],
    ).to(_device)
    _model.load_state_dict(state["model"])
    _model.eval()

    size = cfg["data"]["image_size"]
    _transform = A.Compose([
        A.SmallestMaxSize(max_size=size),
        A.CenterCrop(size, size),
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ToTensorV2(),
    ])


def predict_image(image_bytes: bytes) -> dict:
    _load()

    pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    x = _transform(image=img)["image"].unsqueeze(0).to(_device)
    with torch.no_grad():
        pred_norm = _model(x).float().cpu().numpy()
    pred = _normalizer.decode(pred_norm)[0]

    return {f"{n}_{UNITS[n]}": round(float(pred[i]), 1) for i, n in enumerate(TARGET_NAMES)}
