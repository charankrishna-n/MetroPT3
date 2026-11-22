# MetroPT-3 Predictive Maintenance Dashboard

Deep Learning-Based Early Failure Detection for Metro Train Air Production Units (APU)





















## Project Structure

```
MetroPT3/
├── data/
│   └── MetroPT3(AirCompressor).csv       ← original dataset
├── model_artifacts/
│   └── Dense_AE_fold09_E3_cal_E4.pt      ← trained checkpoint
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py                        ← FastAPI entry point
│       ├── core/   (config, model, loader)
│       ├── services/ (inference)
│       ├── simulation/ (engine)
│       ├── api/    (all routers + websocket)
│       └── schemas/
└── frontend/
    ├── package.json
    └── src/
        ├── App.tsx
        ├── pages/   (7 pages)
        ├── components/
        ├── hooks/
        ├── services/
        └── types/
```

## Prerequisites

- Python 3.10+ with pip
- Node.js 18+ with npm

## Backend Setup

```powershell
cd e:\projects\MetroPT3\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (from backend/ directory)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:
1. Load `Dense_AE_fold09_E3_cal_E4.pt` and inspect its structure
2. Fit a StandardScaler on the dataset (first run only, saved to `model_artifacts/scaler.joblib`)
3. Calibrate the anomaly threshold from normal data (if not stored in checkpoint)
4. Start the FastAPI server at http://localhost:8000

API docs: http://localhost:8000/docs

## Frontend Setup

```powershell
cd e:\projects\MetroPT3\frontend

npm install
npm run dev
```

Dashboard: http://localhost:5173

## Usage

1. Open http://localhost:5173
2. Navigate to **Simulation** page
3. Select speed (1x / 2x / 5x / 10x)
4. Click **Start**
5. Watch all pages update in real time via WebSocket

## Architecture

- **Dense Autoencoder**: 15 → 32 → 16 → 8 → 16 → 32 → 15 (ReLU activations)
- **Anomaly Score**: Mean Squared Error across all 15 sensor features
- **Alarm Policy**: 3-of-5 causal sliding window
- **Explainability**: Per-sensor reconstruction error contribution (%)
- **Checkpoint**: fold09, evaluated on Event 3, threshold calibrated on Event 4

## Disclaimer

This is an experimental B.Tech final-year project evaluated on 4 historical failure events
from the MetroPT-3 dataset. It is NOT a certified railway safety system.
