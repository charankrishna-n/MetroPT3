from fastapi import APIRouter, HTTPException
from app.simulation.engine import engine

router = APIRouter(prefix="/alerts")


@router.get("")
def get_alerts():
    return {"alerts": engine.get_alerts(), "count": len(engine.get_alerts())}


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    if not engine.acknowledge_alert(alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "acknowledged", "alert_id": alert_id}


@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    if not engine.resolve_alert(alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "resolved", "alert_id": alert_id}
