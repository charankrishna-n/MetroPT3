from pydantic import BaseModel
from typing import Optional


class SensorDetail(BaseModel):
    name: str
    actual: float
    reconstructed: float
    error: float
    contribution_pct: float


class InferenceResult(BaseModel):
    anomaly_score: float
    threshold: float
    is_anomaly: bool
    sensor_details: list[SensorDetail]
    top5_sensors: list[SensorDetail]
    explanation: str


class SimStatusResponse(BaseModel):
    status: str
    speed: int
    current_index: int
    total_rows: int
    readings_processed: int
    progress_pct: float
    alert_count: int


class AlertResponse(BaseModel):
    id: str
    alert_number: int
    timestamp: str
    anomaly_score: float
    threshold: float
    severity: str
    top_sensors: list[str]
    description: str
    acknowledged: bool
    resolved: bool


class OverviewResponse(BaseModel):
    total_readings: int
    current_anomaly_score: Optional[float]
    current_status: str
    total_alerts: int
    threshold: float
    simulation_status: str
    last_timestamp: Optional[str]
    model_name: str
