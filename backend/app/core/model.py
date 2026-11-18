"""
Dense Autoencoder architecture for MetroPT-3.
Architecture: 15 -> 32 -> 16 -> 8 -> 16 -> 32 -> 15
This must exactly match the architecture used during training.
"""
import torch
import torch.nn as nn


class DenseAutoencoder(nn.Module):
    def __init__(self, n_features: int = 15):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(n_features, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.Linear(32, n_features),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.decoder(self.encoder(x))
