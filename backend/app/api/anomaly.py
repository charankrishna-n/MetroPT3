from fastapi import APIRouter, Query
from app.simulation.engine import engine
from app.core.loader import get_threshold

router = APIRouter(prefix="/anomaly")


@router.get("/current")
def current_anomaly():
    latest = engine.get_latest()
    if not latest:
        return {"anomaly_score": 0.0, "threshold": get_threshold(), "is_anomaly": False, "status": "NORMAL"}
    return {
        "anomaly_score": latest["anomaly_score"],
        "threshold": latest["threshold"],
        "is_anomaly": latest["is_anomaly"],
        "alarm_triggered": latest["alarm_triggered"],
        "status": latest["status"],
        "timestamp": latest["timestamp"],
    }


@router.get("/history")
def anomaly_history(last_n: int = Query(default=200, le=1000)):
    history = engine.get_history(last_n)
    return {
        "count": len(history),
        "threshold": get_threshold(),
        "data": [
            {
                "timestamp": h["timestamp"],
                "anomaly_score": h["anomaly_score"],
                "is_anomaly": h["is_anomaly"],
                "alarm_triggered": h["alarm_triggered"],
                "status": h["status"],
            }
            for h in history
        ],
    }
