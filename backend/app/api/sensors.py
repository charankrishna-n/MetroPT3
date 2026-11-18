from fastapi import APIRouter, Query
from app.simulation.engine import engine
from app.core.config import FEATURE_NAMES

router = APIRouter(prefix="/sensors")


@router.get("")
def list_sensors():
    return {"sensors": FEATURE_NAMES}


@router.get("/latest")
def latest_sensors():
    latest = engine.get_latest()
    if not latest:
        return {"timestamp": None, "values": {}}
    return {"timestamp": latest["timestamp"], "values": latest["sensor_values"]}


@router.get("/history")
def sensor_history(last_n: int = Query(default=200, le=1000)):
    history = engine.get_history(last_n)
    return {
        "count": len(history),
        "data": [
            {"timestamp": h["timestamp"], "values": h["sensor_values"], "status": h["status"]}
            for h in history
        ],
    }
