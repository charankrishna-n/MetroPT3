from fastapi import APIRouter
from app.simulation.engine import engine

router = APIRouter(prefix="/explainability")


@router.get("/current")
def current_explainability():
    latest = engine.get_latest()
    if not latest:
        return {"explanation": "No data yet.", "top5_sensors": [], "sensor_details": []}
    return {
        "timestamp": latest["timestamp"],
        "explanation": latest["explanation"],
        "top5_sensors": latest["top5_sensors"],
        "sensor_details": latest["sensor_details"],
        "anomaly_score": latest["anomaly_score"],
        "threshold": latest["threshold"],
        "is_anomaly": latest["is_anomaly"],
    }


@router.get("/sensor-contributions")
def sensor_contributions():
    latest = engine.get_latest()
    if not latest:
        return {"contributions": []}
    return {
        "timestamp": latest["timestamp"],
        "contributions": [
            {
                "name": s["name"],
                "contribution_pct": s["contribution_pct"],
                "error": s["error"],
            }
            for s in latest["sensor_details"]
        ],
    }
