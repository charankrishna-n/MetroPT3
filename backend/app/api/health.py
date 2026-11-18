from fastapi import APIRouter
from app.core.loader import get_threshold, get_model_meta

router = APIRouter()


@router.get("/health")
def health():
    try:
        get_threshold()
        model_ok = True
    except Exception:
        model_ok = False
    return {"status": "ok", "model_loaded": model_ok, "meta": get_model_meta()}
