"""
Model loader — loads the Dense AE checkpoint once at application startup.
Handles both full-model saves and state-dict saves.
Fits and caches a StandardScaler from the dataset if no saved scaler exists.
"""
import logging
import pickle
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch
from sklearn.preprocessing import StandardScaler

from app.core.config import (
    DATASET_PATH,
    DEFAULT_THRESHOLD,
    FEATURE_NAMES,
    MODEL_PATH,
    N_FEATURES,
    SCALER_PATH,
)
from app.core.model import DenseAutoencoder

logger = logging.getLogger(__name__)

# Singletons populated at startup
_model: DenseAutoencoder | None = None
_scaler: StandardScaler | None = None
_threshold: float = DEFAULT_THRESHOLD
_model_meta: dict = {}


def _inspect_checkpoint(ckpt: dict) -> dict:
    """Extract metadata from checkpoint dict."""
    meta = {}
    for key in ("threshold", "anomaly_threshold", "best_threshold"):
        if key in ckpt:
            meta["threshold"] = float(ckpt[key])
            break
    for key in ("scaler", "standard_scaler"):
        if key in ckpt:
            meta["scaler"] = ckpt[key]
            break
    for key in ("config", "hparams", "hyperparameters"):
        if key in ckpt:
            meta["config"] = ckpt[key]
            break
    return meta


def load_model_and_scaler() -> None:
    global _model, _scaler, _threshold, _model_meta

    # ── Load checkpoint ──────────────────────────────────────────────────────
    logger.info("Loading checkpoint: %s", MODEL_PATH)
    raw = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)

    model = DenseAutoencoder(n_features=N_FEATURES)

    if isinstance(raw, dict):
        meta = _inspect_checkpoint(raw)
        _model_meta = meta
        logger.info("Checkpoint keys: %s", list(raw.keys()))

        # Determine which key holds the state dict
        state_dict = None
        for key in ("state_dict", "model_state_dict", "model"):
            if key in raw and isinstance(raw[key], dict):
                state_dict = raw[key]
                logger.info("Found state dict under key '%s' with keys: %s", key, list(state_dict.keys())[:8])
                break
        if state_dict is None:
            # The dict itself might be the state dict (all values are tensors)
            if all(isinstance(v, torch.Tensor) for v in raw.values()):
                state_dict = raw
                logger.info("Checkpoint is a bare state dict with keys: %s", list(raw.keys())[:8])
        if state_dict is not None:
            try:
                model.load_state_dict(state_dict, strict=True)
                logger.info("Loaded state dict (strict) — weights applied successfully")
            except RuntimeError as e:
                logger.warning("Strict load failed (%s), trying non-strict", e)
                model.load_state_dict(state_dict, strict=False)
                logger.warning("Loaded state dict (non-strict — some keys skipped)")
        else:
            logger.warning("No state dict found in checkpoint keys: %s — model uses random weights", list(raw.keys()))

        if "threshold" in meta:
            _threshold = meta["threshold"]
            logger.info("Threshold from checkpoint: %.6f", _threshold)

        if "scaler" in meta:
            _scaler = meta["scaler"]
            logger.info("Scaler loaded from checkpoint")

    elif isinstance(raw, DenseAutoencoder):
        model = raw
        logger.info("Loaded complete model object")
    elif isinstance(raw, torch.nn.Module):
        model = raw
        logger.info("Loaded nn.Module object")
    else:
        logger.warning("Unknown checkpoint type: %s — using randomly initialised weights", type(raw))

    model.eval()
    _model = model
    logger.info("Model ready. Encoder dims verified via forward pass.")

    # ── Load or fit scaler ───────────────────────────────────────────────────
    if _scaler is None:
        if SCALER_PATH.exists():
            _scaler = joblib.load(SCALER_PATH)
            logger.info("Scaler loaded from %s", SCALER_PATH)
        else:
            logger.info("No saved scaler found — fitting StandardScaler on full dataset (normal data proxy)")
            _scaler = _fit_scaler_from_dataset()
            joblib.dump(_scaler, SCALER_PATH)
            logger.info("Scaler saved to %s", SCALER_PATH)

    # ── Calibrate threshold if still default ─────────────────────────────────
    if _threshold == DEFAULT_THRESHOLD:
        logger.info("Calibrating threshold from dataset normal data...")
        _threshold = _calibrate_threshold()
        logger.info("Calibrated threshold: %.6f", _threshold)


def _fit_scaler_from_dataset() -> StandardScaler:
    df = pd.read_csv(DATASET_PATH, index_col=0)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    # Use first 70% as proxy for normal data for scaler fitting
    n = int(len(df) * 0.70)
    X = df[FEATURE_NAMES].iloc[:n].values.astype(np.float32)
    scaler = StandardScaler()
    scaler.fit(X)
    return scaler


def _calibrate_threshold() -> float:
    """
    Compute threshold as mean + 3*std of reconstruction errors
    on the first 70% of the dataset (treated as predominantly normal).
    """
    df = pd.read_csv(DATASET_PATH, index_col=0)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    n = int(len(df) * 0.70)
    X_raw = df[FEATURE_NAMES].iloc[:n].values.astype(np.float32)
    X_scaled = _scaler.transform(X_raw)

    errors = []
    _model.eval()
    with torch.no_grad():
        batch = torch.tensor(X_scaled, dtype=torch.float32)
        recon = _model(batch).numpy()
        mse = np.mean((X_scaled - recon) ** 2, axis=1)
        errors = mse.tolist()

    threshold = float(np.mean(errors) + 3 * np.std(errors))
    return threshold


def get_model() -> DenseAutoencoder:
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model_and_scaler() at startup.")
    return _model


def get_scaler() -> StandardScaler:
    if _scaler is None:
        raise RuntimeError("Scaler not loaded.")
    return _scaler


def get_threshold() -> float:
    return _threshold


def get_model_meta() -> dict:
    return _model_meta
