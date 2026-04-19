"""Single-image inference: image path -> nutrition JSON."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import torch

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.data import TargetNormalizer, build_transforms
from src.model import NutritionNet


UNITS = {"calories": "kcal", "mass": "g", "fat": "g", "carb": "g", "protein": "g"}


def load_image(path: str) -> np.ndarray:
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(path)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True)
    ap.add_argument("--ckpt", required=True)
    args = ap.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    state = torch.load(args.ckpt, map_location=device)
    cfg = state["config"]
    target_names = cfg["targets"]["names"]

    model = NutritionNet(
        backbone=cfg["model"]["backbone"],
        pretrained=False,
        n_targets=len(target_names),
        hidden_dim=cfg["model"]["hidden_dim"],
        dropout=cfg["model"]["dropout"],
    ).to(device)
    model.load_state_dict(state["model"])
    model.eval()

    normalizer = TargetNormalizer.from_state_dict(state["normalizer"])
    tfm = build_transforms(cfg["data"]["image_size"], train=False)

    img = load_image(args.image)
    x = tfm(image=img)["image"].unsqueeze(0).to(device)
    with torch.no_grad():
        pred_norm = model(x).float().cpu().numpy()
    pred = normalizer.decode(pred_norm)[0]

    out = {}
    for i, name in enumerate(target_names):
        key = f"{name}_{UNITS[name]}"
        out[key] = round(float(pred[i]), 1)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
