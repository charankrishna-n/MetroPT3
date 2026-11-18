"""
MetroPT-3 Predictive Maintenance — FastAPI Backend
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.core.loader import load_model_and_scaler
from app.api import health, dashboard, sensors, anomaly, explainability, alerts, simulation, models, websocket

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MetroPT-3 Predictive Maintenance API",
    description="Deep Learning-Based Early Failure Detection for Metro Train APU",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    logger.info("Loading model and scaler...")
    load_model_and_scaler()
    logger.info("Startup complete.")


# Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(sensors.router, prefix="/api", tags=["Sensors"])
app.include_router(anomaly.router, prefix="/api", tags=["Anomaly"])
app.include_router(explainability.router, prefix="/api", tags=["Explainability"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(simulation.router, prefix="/api", tags=["Simulation"])
app.include_router(models.router, prefix="/api", tags=["Models"])
app.include_router(websocket.router, tags=["WebSocket"])
