"""
WebSocket endpoint — streams simulation results to connected clients.
Each connected client receives every processed timestep as JSON.
"""
import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.simulation.engine import engine

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/simulation")
async def ws_simulation(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket client connected")

    queue: asyncio.Queue = asyncio.Queue(maxsize=500)

    async def enqueue(data: dict):
        try:
            queue.put_nowait(data)
        except asyncio.QueueFull:
            pass  # drop oldest — client is too slow

    engine.register_callback(enqueue)

    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=1.0)
                await websocket.send_text(json.dumps(data))
            except asyncio.TimeoutError:
                # Send heartbeat so client knows connection is alive
                try:
                    await websocket.send_text(json.dumps({"type": "heartbeat", **engine.get_status()}))
                except Exception:
                    break
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.warning("WebSocket error: %s", e)
    finally:
        engine.unregister_callback(enqueue)
