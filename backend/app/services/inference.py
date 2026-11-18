"""
Inference service.
Handles preprocessing, model forward pass, per-sensor reconstruction errors,
anomaly score, and the 3-of-5 alarm policy.
"""
from collections import deque

import numpy as np
import torch

from app.core.config import (
    ALARM_MIN_POSITIVES,
    ALARM_WINDOW,
    FEATURE_NAMES,
    N_FEATURES,
)
from app.core.loader import get_model, get_scaler, get_threshold


class AlarmPolicy:
    """Causal 3-of-5 sliding window alarm policy."""

    def __init__(self, window: int = ALARM_WINDOW, min_pos: int = ALARM_MIN_POSITIVES):
        self.window = window
        self.min_pos = min_pos
        self._buffer: deque[int] = deque(maxlen=window)

    def update(self, is_anomaly: bool) -> bool:
        self._buffer.append(int(is_anomaly))
        if len(self._buffer) < self.window:
            return False
        return sum(self._buffer) >= self.min_pos

    def reset(self):
        self._buffer.clear()


def preprocess(raw_values: list[float]) -> np.ndarray:
    """Scale a single 15-feature row. Returns shape (1, 15)."""
    scaler = get_scaler()
    x = np.array(raw_values, dtype=np.float32).reshape(1, N_FEATURES)
    return scaler.transform(x)


def run_inference(raw_values: list[float]) -> dict:
    """
    Run the Dense AE on one timestep.
    Returns reconstruction, per-sensor errors, anomaly score, and threshold flag.
    """
    model = get_model()
    threshold = get_threshold()

    x_scaled = preprocess(raw_values)  # (1, 15)
    x_tensor = torch.tensor(x_scaled, dtype=torch.float32)

    model.eval()
    with torch.no_grad():
        recon_scaled = model(x_tensor).numpy()  # (1, 15)

    # Per-sensor squared error in scaled space
    per_sensor_error = ((x_scaled - recon_scaled) ** 2)[0]  # (15,)

    # Anomaly score = mean squared error across all sensors
    anomaly_score = float(np.mean(per_sensor_error))

    # Inverse-transform to original space for display
    scaler = get_scaler()
    x_orig = scaler.inverse_transform(x_scaled)[0]
    recon_orig = scaler.inverse_transform(recon_scaled)[0]

    total_error = float(np.sum(per_sensor_error))
    contributions = (
        (per_sensor_error / total_error * 100).tolist()
        if total_error > 0
        else [0.0] * N_FEATURES
    )

    sensor_details = []
    for i, name in enumerate(FEATURE_NAMES):
        sensor_details.append({
            "name": name,
            "actual": float(x_orig[i]),
            "reconstructed": float(recon_orig[i]),
            "error": float(per_sensor_error[i]),
            "contribution_pct": float(contributions[i]),
        })

    # Rank by contribution
    sensor_details_sorted = sorted(sensor_details, key=lambda d: d["error"], reverse=True)
    top5 = sensor_details_sorted[:5]

    is_anomaly = anomaly_score > threshold

    # Human-readable explanation
    top_names = [s["name"] for s in top5[:3]]
    if is_anomaly:
        explanation = (
            f"Anomaly detected primarily due to abnormal "
            f"{', '.join(top_names)} reconstruction errors. "
            f"Score {anomaly_score:.4f} exceeds threshold {threshold:.4f}."
        )
    else:
        explanation = (
            f"Normal operation. Reconstruction score {anomaly_score:.4f} "
            f"is within threshold {threshold:.4f}."
        )

    return {
        "anomaly_score": anomaly_score,
        "threshold": threshold,
        "is_anomaly": is_anomaly,
        "sensor_details": sensor_details,
        "top5_sensors": top5,
        "explanation": explanation,
        "raw_values": {FEATURE_NAMES[i]: float(raw_values[i]) for i in range(N_FEATURES)},
    }
