import timm
import torch
import torch.nn as nn


class NutritionNet(nn.Module):
    def __init__(self, backbone="efficientnet_b3", pretrained=False, n_targets=5, hidden_dim=512, dropout=0.2):
        super().__init__()
        self.backbone = timm.create_model(backbone, pretrained=pretrained, num_classes=0, global_pool="avg")
        feat = self.backbone.num_features
        self.head = nn.Sequential(
            nn.Linear(feat, hidden_dim), nn.GELU(), nn.Dropout(dropout), nn.Linear(hidden_dim, n_targets),
        )

    def forward(self, x):
        return self.head(self.backbone(x))
