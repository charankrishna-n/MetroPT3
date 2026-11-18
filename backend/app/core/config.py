"""
Central configuration.
All model constants are derived from the MetroPT-3 Dense AE architecture
and the checkpoint Dense_AE_fold09_E3_cal_E4.pt.
"""
import os
from pathlib import Path

# config.py lives at: MetroPT3/backend/app/core/config.py
# .parent = core, .parent.parent = app, .parent.parent.parent = backend, .parent x4 = MetroPT3
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # e:/projects/MetroPT3

# Paths — model artifacts and data live at the project root, not inside backend/
MODEL_PATH = BASE_DIR / "model_artifacts" / "Dense_AE_fold09_E3_cal_E4.pt"
DATASET_PATH = BASE_DIR / "data" / "MetroPT3(AirCompressor).csv"
SCALER_PATH = BASE_DIR / "model_artifacts" / "scaler.joblib"

# Feature configuration — exact order from dataset columns
FEATURE_NAMES = [
    "TP2", "TP3", "H1", "DV_pressure", "Reservoirs",
    "Oil_temperature", "Motor_current", "COMP", "DV_eletric",
    "Towers", "MPG", "LPS", "Pressure_switch", "Oil_level",
    "Caudal_impulses",
]
N_FEATURES = len(FEATURE_NAMES)  # 15

# Dense AE is point-wise (seq_len=1); alarm policy uses a rolling window
SEQ_LEN = 1

# Dense AE architecture: 15->32->16->8->16->32->15
ENCODER_DIMS = [N_FEATURES, 32, 16, 8]
DECODER_DIMS = [8, 16, 32, N_FEATURES]

# Anomaly threshold — calibrated on Event 4 (fold09).
# This value is computed at startup from the dataset if no saved threshold exists.
# It will be overridden by the value stored inside the checkpoint if present.
DEFAULT_THRESHOLD = 0.05  # fallback; real value loaded from checkpoint

# 3-of-5 alarm policy
ALARM_WINDOW = 5
ALARM_MIN_POSITIVES = 3

# Simulation speeds — seconds of delay between each row
# 1x=1 row/s, 2x=2 rows/s, 5x=5 rows/s, 10x=10 rows/s,
# 50x=50 rows/s, 100x=100 rows/s, 500x=500 rows/s
SIMULATION_SPEEDS = {
    1:   1.0,
    2:   0.5,
    5:   0.2,
    10:  0.1,
    50:  0.02,
    100: 0.01,
    500: 0.002,
}
DEFAULT_SPEED = 1

# API
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
