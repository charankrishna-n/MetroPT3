from fastapi import APIRouter
from app.simulation.engine import engine
from app.core.loader import get_threshold
from app.schemas.responses import OverviewResponse

router = APIRouter(prefix="/dashboard")


@router.get("/overview", response_model=OverviewResponse)
def overview():
    latest = engine.get_latest()
    sim_status = engine.get_status()
    return OverviewResponse(
        total_readings=sim_status["readings_processed"],
        current_anomaly_score=latest["anomaly_score"] if latest else None,
        current_status=latest["status"] if latest else "NORMAL",
        total_alerts=sim_status["alert_count"],
        threshold=get_threshold(),
        simulation_status=sim_status["status"],
        last_timestamp=latest["timestamp"] if latest else None,
        model_name="Dense Autoencoder (fold09, cal_E4)",
    )
