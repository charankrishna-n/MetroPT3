"""
Historical data simulation engine.
Replays the MetroPT-3 dataset chronologically, one timestep at a time.
Applies preprocessing → Dense AE inference → 3-of-5 alarm policy.
Never uses future readings for current prediction.
"""
import asyncio
import logging
import uuid
from datetime import datetime
from enum import Enum
from typing import Callable, Awaitable

import numpy as np
import pandas as pd

from app.core.config import (
    ALARM_MIN_POSITIVES,
    ALARM_WINDOW,
    DATASET_PATH,
    FEATURE_NAMES,
    SIMULATION_SPEEDS,
    DEFAULT_SPEED,
)
from app.services.inference import AlarmPolicy, run_inference

logger = logging.getLogger(__name__)


class SimStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    COMPLETED = "completed"


class SimulationEngine:
    def __init__(self):
        self._df: pd.DataFrame | None = None
        self._index: int = 0
        self._status: SimStatus = SimStatus.IDLE
        self._speed: int = DEFAULT_SPEED
        self._alarm: AlarmPolicy = AlarmPolicy(ALARM_WINDOW, ALARM_MIN_POSITIVES)
        self._task: asyncio.Task | None = None
        self._pause_event: asyncio.Event | None = None  # created lazily inside event loop
        self._callbacks: list[Callable[[dict], Awaitable[None]]] = []
        self._history: list[dict] = []
        self._alerts: list[dict] = []
        self._alert_counter: int = 0
        self._readings_processed: int = 0
        self._total_rows: int = 0
        self._load_dataset()  # pre-load so total_rows is known immediately

    def _get_pause_event(self) -> asyncio.Event:
        """Lazily create the asyncio.Event inside the running event loop."""
        if self._pause_event is None:
            self._pause_event = asyncio.Event()
            self._pause_event.set()
        return self._pause_event

    # ── Public control API ────────────────────────────────────────────────────

    def register_callback(self, cb: Callable[[dict], Awaitable[None]]):
        self._callbacks.append(cb)

    def unregister_callback(self, cb: Callable[[dict], Awaitable[None]]):
        self._callbacks = [c for c in self._callbacks if c is not cb]

    def start(self, speed: int = DEFAULT_SPEED) -> bool:
        if self._status == SimStatus.RUNNING:
            return False
        self._speed = speed
        if self._status in (SimStatus.IDLE, SimStatus.STOPPED, SimStatus.COMPLETED):
            self._reset_state()
        self._status = SimStatus.RUNNING
        self._get_pause_event().set()
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Simulation started at speed %dx", speed)
        return True

    def pause(self) -> bool:
        if self._status != SimStatus.RUNNING:
            return False
        self._status = SimStatus.PAUSED
        self._get_pause_event().clear()
        logger.info("Simulation paused at index %d", self._index)
        return True

    def resume(self) -> bool:
        if self._status != SimStatus.PAUSED:
            return False
        self._status = SimStatus.RUNNING
        self._get_pause_event().set()
        logger.info("Simulation resumed")
        return True

    def stop(self) -> bool:
        if self._status in (SimStatus.IDLE, SimStatus.STOPPED):
            return False
        self._status = SimStatus.STOPPED
        self._get_pause_event().set()  # unblock loop so it can exit
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("Simulation stopped")
        return True

    def reset(self):
        if self._status not in (SimStatus.IDLE, SimStatus.STOPPED):
            self.stop()
        self._reset_state()
        self._pause_event = None  # force fresh Event on next start
        self._status = SimStatus.IDLE
        logger.info("Simulation reset")

    def set_speed(self, speed: int):
        if speed in SIMULATION_SPEEDS:
            self._speed = speed

    def get_status(self) -> dict:
        return {
            "status": self._status.value,
            "speed": self._speed,
            "current_index": self._index,
            "total_rows": self._total_rows,
            "readings_processed": self._readings_processed,
            "progress_pct": round(self._index / self._total_rows * 100, 2) if self._total_rows else 0,
            "alert_count": len(self._alerts),
        }

    def get_alerts(self) -> list[dict]:
        return list(self._alerts)

    def acknowledge_alert(self, alert_id: str) -> bool:
        for a in self._alerts:
            if a["id"] == alert_id:
                a["acknowledged"] = True
                return True
        return False

    def resolve_alert(self, alert_id: str) -> bool:
        for a in self._alerts:
            if a["id"] == alert_id:
                a["resolved"] = True
                return True
        return False

    def get_history(self, last_n: int = 200) -> list[dict]:
        return self._history[-last_n:]

    def get_latest(self) -> dict | None:
        return self._history[-1] if self._history else None

    # ── Internal ──────────────────────────────────────────────────────────────

    def _reset_state(self):
        self._index = 0
        self._readings_processed = 0
        self._alarm.reset()
        self._history.clear()
        self._alerts.clear()
        self._alert_counter = 0
        # Force dataset reload on next start so index resets properly
        self._df = None
        self._total_rows = 0
        self._load_dataset()

    def _load_dataset(self):
        if self._df is None:
            logger.info("Loading dataset from %s", DATASET_PATH)
            df = pd.read_csv(DATASET_PATH, index_col=0)
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df = df.sort_values("timestamp").reset_index(drop=True)
            self._df = df
            self._total_rows = len(df)
            logger.info("Dataset loaded: %d rows", self._total_rows)

    async def _run_loop(self):
        self._load_dataset()
        delay = SIMULATION_SPEEDS.get(self._speed, 1.0)
        pause_event = self._get_pause_event()

        try:
            while self._index < self._total_rows:
                if self._status == SimStatus.STOPPED:
                    break

                await pause_event.wait()

                if self._status == SimStatus.STOPPED:
                    break

                row = self._df.iloc[self._index]
                result = self._process_row(row)
                self._history.append(result)
                self._readings_processed += 1
                self._index += 1

                await self._broadcast(result)
                await asyncio.sleep(delay)

            if self._status != SimStatus.STOPPED and self._index >= self._total_rows:
                self._status = SimStatus.COMPLETED
                logger.info("Simulation completed — %d rows processed", self._readings_processed)
        except asyncio.CancelledError:
            logger.info("Simulation task cancelled")
        except Exception as e:
            logger.exception("Simulation error at index %d: %s", self._index, e)
            self._status = SimStatus.STOPPED

    def _process_row(self, row: pd.Series) -> dict:
        raw_values = [float(row[f]) for f in FEATURE_NAMES]
        result = run_inference(raw_values)

        alarm_triggered = self._alarm.update(result["is_anomaly"])

        status = "NORMAL"
        if alarm_triggered:
            status = "ANOMALY"
        elif result["is_anomaly"]:
            status = "WARNING"

        if alarm_triggered:
            self._alert_counter += 1
            alert = {
                "id": str(uuid.uuid4()),
                "alert_number": self._alert_counter,
                "timestamp": str(row["timestamp"]),
                "anomaly_score": result["anomaly_score"],
                "threshold": result["threshold"],
                "severity": "HIGH" if result["anomaly_score"] > result["threshold"] * 2 else "MEDIUM",
                "top_sensors": [s["name"] for s in result["top5_sensors"][:3]],
                "description": result["explanation"],
                "acknowledged": False,
                "resolved": False,
            }
            self._alerts.append(alert)

        return {
            "timestamp": str(row["timestamp"]),
            "index": self._index,
            "anomaly_score": result["anomaly_score"],
            "threshold": result["threshold"],
            "is_anomaly": result["is_anomaly"],
            "alarm_triggered": alarm_triggered,
            "status": status,
            "sensor_values": result["raw_values"],
            "sensor_details": result["sensor_details"],
            "top5_sensors": result["top5_sensors"],
            "explanation": result["explanation"],
        }

    async def _broadcast(self, data: dict):
        dead = []
        for cb in self._callbacks:
            try:
                await cb(data)
            except Exception:
                dead.append(cb)
        for cb in dead:
            self.unregister_callback(cb)


# Global singleton
engine = SimulationEngine()
