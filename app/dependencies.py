import hmac
import os
import hashlib
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from app.repositories import supabase_client

api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
    description="API key for protected board endpoints.",
)

SWAGGER_X_API_KEY = os.environ.get("SWAGGER_X_API_KEY", "")


def hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


async def get_api_key(x_api_key: str | None = Security(api_key_header)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="missing X-API-Key header")

    # Local POC fallback: if env key matches, skip DB lookup.
    if SWAGGER_X_API_KEY and hmac.compare_digest(x_api_key, SWAGGER_X_API_KEY):
        return True

    h = hash_key(x_api_key)
    try:
        rows = supabase_client.select("api_keys", "*", {"hashed_key": h})
    except Exception:
        # If no DB-backed key table is configured yet, keep behavior predictable.
        if SWAGGER_X_API_KEY:
            raise HTTPException(status_code=401, detail="invalid API key")
        raise HTTPException(status_code=500, detail="failed to query api_keys")
    if not rows:
        raise HTTPException(status_code=401, detail="invalid API key")
    row = rows[0]
    if row.get("revoked"):
        raise HTTPException(status_code=401, detail="revoked API key")
    return True
