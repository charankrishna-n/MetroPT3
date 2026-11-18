from fastapi import APIRouter
from app.core.loader import get_threshold, get_model_meta
from app.core.config import N_FEATURES, SEQ_LEN, ENCODER_DIMS, DECODER_DIMS, ALARM_WINDOW, ALARM_MIN_POSITIVES

router = APIRouter(prefix="/models")

_DENSE_AE_INFO = {
    "id": "dense_ae",
    "name": "Dense Autoencoder",
    "checkpoint": "Dense_AE_fold09_E3_cal_E4.pt",
    "description": (
        "Fully-connected autoencoder trained on MetroPT-3 APU sensor data. "
        "Evaluated on Event 3, threshold calibrated on Event 4. "
        "This is an experimental predictive maintenance system, "
        "NOT a certified railway safety system."
    ),
    "architecture": {
        "type": "Dense Autoencoder",
        "input_features": N_FEATURES,
        "seq_len": SEQ_LEN,
        "encoder_dims": ENCODER_DIMS,
        "decoder_dims": DECODER_DIMS,
        "activation": "ReLU",
        "output_activation": "Linear",
    },
    "training": {
        "fold": "fold09",
        "evaluation_event": "Event 3",
        "calibration_event": "Event 4",
        "loss": "MSE",
        "alarm_policy": f"{ALARM_MIN_POSITIVES}-of-{ALARM_WINDOW} sliding window",
    },
    "available": True,
    "default": True,
}

_LSTM_AE_INFO = {
    "id": "lstm_ae",
    "name": "LSTM Autoencoder",
    "checkpoint": "Not provided",
    "description": "Sequential LSTM-based autoencoder. Checkpoint not available in this deployment.",
    "available": False,
    "default": False,
}

_TCN_AE_INFO = {
    "id": "tcn_ae",
    "name": "TCN Autoencoder",
    "checkpoint": "Not provided",
    "description": "Temporal Convolutional Network autoencoder. Checkpoint not available in this deployment.",
    "available": False,
    "default": False,
}


@router.get("")
def list_models():
    dense = dict(_DENSE_AE_INFO)
    dense["threshold"] = get_threshold()
    dense["meta"] = get_model_meta()
    return {"models": [dense, _LSTM_AE_INFO, _TCN_AE_INFO], "active_model": "dense_ae"}


@router.get("/comparison")
def model_comparison():
    return {
        "note": (
            "Metrics below are from cross-event validation on the MetroPT-3 dataset "
            "(4 historical failure events). This system is experimental."
        ),
        "models": [
            {
                "name": "Dense Autoencoder",
                "fold": "fold09",
                "threshold_source": "cal_E4",
                "available": True,
                "notes": "Best-balanced candidate selected for deployment.",
            },
            {
                "name": "LSTM Autoencoder",
                "available": False,
                "notes": "Checkpoint not provided.",
            },
            {
                "name": "TCN Autoencoder",
                "available": False,
                "notes": "Checkpoint not provided.",
            },
        ],
    }
