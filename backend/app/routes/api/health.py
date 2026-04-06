from fastapi import APIRouter, Request
from sqlalchemy import text

router = APIRouter()


@router.get("/health")
async def health(request: Request):
    maker = getattr(request.app.state, "async_session_maker", None)
    if maker is None:
        return {"ok": True, "db": "not_configured"}
    try:
        async with maker() as session:
            await session.execute(text("SELECT 1"))
        return {"ok": True, "db": "connected"}
    except Exception:
        return {"ok": True, "db": "error"}
