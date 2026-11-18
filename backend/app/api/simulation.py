from fastapi import APIRouter, Query
from app.simulation.engine import engine

router = APIRouter(prefix="/simulation")


@router.post("/start")
async def start(speed: int = Query(default=1, description="1, 2, 5, 10, 50, 100, or 500")):
    if speed not in (1, 2, 5, 10, 50, 100, 500):
        speed = 1
    ok = engine.start(speed)
    return {"started": ok, **engine.get_status()}


@router.post("/pause")
async def pause():
    ok = engine.pause()
    return {"paused": ok, **engine.get_status()}


@router.post("/resume")
async def resume():
    ok = engine.resume()
    return {"resumed": ok, **engine.get_status()}


@router.post("/stop")
async def stop():
    ok = engine.stop()
    return {"stopped": ok, **engine.get_status()}


@router.post("/reset")
async def reset():
    engine.reset()
    return {"reset": True, **engine.get_status()}


@router.get("/status")
async def status():
    return engine.get_status()
