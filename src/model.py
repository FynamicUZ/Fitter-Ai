"""NutritionNet: pretrained vision backbone + regression head."""

from __future__ import annotations

import timm
import torch
import torch.nn as nn


class NutritionNet(nn.Module):
    def __init__(
        self,
        backbone: str = "efficientnet_b3",
        pretrained: bool = True,
        n_targets: int = 5,
        hidden_dim: int = 512,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.backbone = timm.create_model(
            backbone, pretrained=pretrained, num_classes=0, global_pool="avg"
        )
        feat = self.backbone.num_features
        self.head = nn.Sequential(
            nn.Linear(feat, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, n_targets),
        )

    def set_backbone_requires_grad(self, requires_grad: bool) -> None:
        for p in self.backbone.parameters():
            p.requires_grad = requires_grad

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.backbone(x))

    def param_groups(self, lr_backbone: float, lr_head: float, weight_decay: float):
        return [
            {"params": self.backbone.parameters(), "lr": lr_backbone, "weight_decay": weight_decay},
            {"params": self.head.parameters(), "lr": lr_head, "weight_decay": weight_decay},
        ]
