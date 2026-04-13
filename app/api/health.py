from fastapi import APIRouter
from app.repositories.supabase_client import ping

router = APIRouter()

@router.get("/health")
async def health():
    db_ok = ping()
    return {"ok": db_ok, "db": "connected" if db_ok else "error"}
