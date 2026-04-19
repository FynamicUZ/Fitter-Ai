"""Training loop with AMP + resumable Drive checkpoints."""

from __future__ import annotations

import argparse
import csv
import math
import os
import random
import sys
import time
from pathlib import Path

import numpy as np
import torch
import yaml
from torch.utils.data import DataLoader
from tqdm.auto import tqdm

# Allow `python src/train.py` or `python -m src.train`.
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.data import (
    Nutrition5kDataset,
    TargetNormalizer,
    build_splits,
    stack_targets,
)
from src.model import NutritionNet


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def load_config(path: str, overrides: list[str]) -> dict:
    with open(path) as f:
        cfg = yaml.safe_load(f)
    for kv in overrides:
        k, v = kv.split("=", 1)
        cur = cfg
        keys = k.split(".")
        for part in keys[:-1]:
            cur = cur[part]
        cur[keys[-1]] = yaml.safe_load(v)
    return cfg


def build_scheduler(optimizer, warmup_epochs: int, total_epochs: int, steps_per_epoch: int):
    warmup_steps = warmup_epochs * steps_per_epoch
    total_steps = total_epochs * steps_per_epoch

    def lr_lambda(step: int) -> float:
        if step < warmup_steps:
            return (step + 1) / max(1, warmup_steps)
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1.0 + math.cos(math.pi * progress))

    return torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)


@torch.no_grad()
def evaluate(model, loader, device, normalizer, target_names):
    model.eval()
    sum_abs = np.zeros(len(target_names), dtype=np.float64)
    sum_raw = np.zeros(len(target_names), dtype=np.float64)
    n = 0
    for batch in loader:
        images = batch["image"].to(device, non_blocking=True)
        raw = batch["target_raw"].numpy()
        pred_norm = model(images).float().cpu().numpy()
        pred = normalizer.decode(pred_norm)
        sum_abs += np.abs(pred - raw).sum(axis=0)
        sum_raw += raw.sum(axis=0)
        n += raw.shape[0]
    mae = sum_abs / max(1, n)
    mean_raw = sum_raw / max(1, n)
    pct = mae / np.clip(mean_raw, 1e-6, None) * 100.0
    return {name: (float(mae[i]), float(pct[i])) for i, name in enumerate(target_names)}


def save_ckpt(path: Path, *, model, optimizer, scheduler, scaler, normalizer, epoch, best_val, cfg):
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        "model": model.state_dict(),
        "optimizer": optimizer.state_dict(),
        "scheduler": scheduler.state_dict(),
        "scaler": scaler.state_dict() if scaler is not None else None,
        "normalizer": normalizer.state_dict(),
        "epoch": epoch,
        "best_val": best_val,
        "config": cfg,
    }, path)


def load_ckpt(path: Path, model, optimizer, scheduler, scaler, device):
    state = torch.load(path, map_location=device)
    model.load_state_dict(state["model"])
    optimizer.load_state_dict(state["optimizer"])
    scheduler.load_state_dict(state["scheduler"])
    if scaler is not None and state.get("scaler") is not None:
        scaler.load_state_dict(state["scaler"])
    return state["epoch"], state["best_val"], TargetNormalizer.from_state_dict(state["normalizer"])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--set", action="append", default=[], help="key.path=value override")
    ap.add_argument("--subset", type=int, default=0, help="Use only N train records (sanity runs).")
    ap.add_argument("--max_steps", type=int, default=0, help="Stop after N optim steps (sanity runs).")
    args = ap.parse_args()

    cfg = load_config(args.config, args.set)
    set_seed(cfg["train"]["seed"])
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    data_root = Path(cfg["data"]["root"])
    target_names = cfg["targets"]["names"]

    print(f"[train] device={device}, data_root={data_root}")

    train_recs, val_recs, test_recs = build_splits(
        data_root=data_root,
        metadata_files=cfg["data"]["metadata_files"],
        splits_dir=cfg["data"]["splits_dir"],
        train_split=cfg["data"]["train_split"],
        test_split=cfg["data"]["test_split"],
        val_fraction=cfg["data"]["val_fraction"],
        seed=cfg["train"]["seed"],
    )
    if args.subset > 0:
        train_recs = train_recs[: args.subset]
        val_recs = val_recs[: max(16, args.subset // 5)]
    print(f"[train] splits: train={len(train_recs)} val={len(val_recs)} test={len(test_recs)}")

    normalizer = TargetNormalizer().fit(stack_targets(train_recs, target_names))

    def make_loader(records, train: bool, batch_size: int):
        ds = Nutrition5kDataset(
            records=records,
            data_root=data_root,
            images_subdir=cfg["data"]["images_subdir"],
            target_order=target_names,
            normalizer=normalizer,
            image_size=cfg["data"]["image_size"],
            train=train,
        )
        return DataLoader(
            ds,
            batch_size=batch_size,
            shuffle=train,
            num_workers=cfg["data"]["num_workers"],
            pin_memory=True,
            drop_last=train,
            persistent_workers=cfg["data"]["num_workers"] > 0,
        )

    train_loader = make_loader(train_recs, train=True, batch_size=cfg["train"]["batch_size"])
    val_loader = make_loader(val_recs, train=False, batch_size=cfg["train"]["eval_batch_size"])

    model = NutritionNet(
        backbone=cfg["model"]["backbone"],
        pretrained=cfg["model"]["pretrained"],
        n_targets=len(target_names),
        hidden_dim=cfg["model"]["hidden_dim"],
        dropout=cfg["model"]["dropout"],
    ).to(device)

    optimizer = torch.optim.AdamW(
        model.param_groups(
            lr_backbone=cfg["train"]["lr_backbone"],
            lr_head=cfg["train"]["lr_head"],
            weight_decay=cfg["train"]["weight_decay"],
        )
    )
    scheduler = build_scheduler(
        optimizer,
        warmup_epochs=cfg["train"]["warmup_epochs"],
        total_epochs=cfg["train"]["epochs"],
        steps_per_epoch=max(1, len(train_loader)),
    )
    scaler = torch.amp.GradScaler("cuda", enabled=cfg["train"]["amp"] and device.type == "cuda")
    loss_fn = torch.nn.SmoothL1Loss(beta=1.0)

    ckpt_dir = Path(cfg["paths"]["ckpt_dir"])
    log_dir = Path(cfg["paths"]["log_dir"])
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    log_dir.mkdir(parents=True, exist_ok=True)
    last_ckpt = ckpt_dir / "last.pt"
    best_ckpt = ckpt_dir / "best.pt"
    log_csv = log_dir / "train.csv"

    start_epoch = 0
    best_val = float("inf")
    if last_ckpt.exists():
        print(f"[train] resuming from {last_ckpt}")
        start_epoch, best_val, normalizer = load_ckpt(last_ckpt, model, optimizer, scheduler, scaler, device)
        start_epoch += 1

    if not log_csv.exists():
        with open(log_csv, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["epoch", "train_loss", *[f"val_mae_{n}" for n in target_names],
                        *[f"val_pct_{n}" for n in target_names]])

    global_step = start_epoch * len(train_loader)
    for epoch in range(start_epoch, cfg["train"]["epochs"]):
        freeze = epoch < cfg["train"]["freeze_backbone_epochs"]
        model.set_backbone_requires_grad(not freeze)
        model.train()

        epoch_loss = 0.0
        pbar = tqdm(train_loader, desc=f"epoch {epoch} {'[head]' if freeze else ''}")
        for step, batch in enumerate(pbar):
            images = batch["image"].to(device, non_blocking=True)
            targets = batch["target"].to(device, non_blocking=True)

            optimizer.zero_grad(set_to_none=True)
            with torch.amp.autocast("cuda", enabled=scaler.is_enabled()):
                preds = model(images)
                loss = loss_fn(preds, targets)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()

            epoch_loss += loss.item()
            global_step += 1
            if step % cfg["train"]["log_every"] == 0:
                pbar.set_postfix(loss=f"{loss.item():.4f}",
                                 lr=f"{scheduler.get_last_lr()[0]:.2e}")
            if args.max_steps and global_step >= args.max_steps:
                break

        avg_loss = epoch_loss / max(1, len(train_loader))
        val_metrics = evaluate(model, val_loader, device, normalizer, target_names)
        mae_line = "  ".join(f"{n}={val_metrics[n][0]:.2f} ({val_metrics[n][1]:.1f}%)" for n in target_names)
        print(f"[epoch {epoch}] train_loss={avg_loss:.4f}  val:  {mae_line}")

        with open(log_csv, "a", newline="") as f:
            w = csv.writer(f)
            w.writerow([epoch, f"{avg_loss:.6f}",
                        *[f"{val_metrics[n][0]:.4f}" for n in target_names],
                        *[f"{val_metrics[n][1]:.4f}" for n in target_names]])

        save_ckpt(last_ckpt, model=model, optimizer=optimizer, scheduler=scheduler,
                  scaler=scaler, normalizer=normalizer, epoch=epoch, best_val=best_val, cfg=cfg)

        cal_mae = val_metrics["calories"][0]
        if cal_mae < best_val:
            best_val = cal_mae
            save_ckpt(best_ckpt, model=model, optimizer=optimizer, scheduler=scheduler,
                      scaler=scaler, normalizer=normalizer, epoch=epoch, best_val=best_val, cfg=cfg)
            print(f"[epoch {epoch}] new best val calorie MAE: {best_val:.2f} -> {best_ckpt}")

        if args.max_steps and global_step >= args.max_steps:
            print("[train] max_steps reached; stopping.")
            break

    print(f"[train] done. best val calorie MAE: {best_val:.2f}")


if __name__ == "__main__":
    main()
