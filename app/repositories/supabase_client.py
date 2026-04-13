import os
import json
import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

_client: httpx.Client | None = None


def _auth_headers():
    if not SUPABASE_SERVICE_ROLE_KEY:
        return {}
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def get_client():
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env")
        _client = httpx.Client(base_url=SUPABASE_URL, headers=_auth_headers(), timeout=10.0)
    return _client


def select(table: str, columns: str = "*", eq: dict | None = None):
    client = get_client()
    params = {"select": columns}
    if eq:
        for k, v in eq.items():
            params[k] = f"eq.{v}"
    resp = client.get(f"/rest/v1/{table}", params=params)
    if resp.status_code >= 400:
        raise RuntimeError(f"Supabase select failed: {resp.status_code} {resp.text}")
    try:
        return resp.json()
    except Exception:
        return []


def insert(table: str, payload: dict):
    client = get_client()
    headers = dict(client.headers)
    headers["Prefer"] = "return=representation"
    resp = client.post(f"/rest/v1/{table}", json=payload, headers=headers)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Supabase insert failed: {resp.status_code} {resp.text}")
    try:
        return resp.json()
    except Exception:
        return []


def update(table: str, payload: dict, eq: dict):
    client = get_client()
    params: dict[str, str] = {}
    for k, v in eq.items():
        params[k] = f"eq.{v}"
    headers = dict(client.headers)
    headers["Prefer"] = "return=representation"
    resp = client.patch(f"/rest/v1/{table}", params=params, json=payload, headers=headers)
    if resp.status_code >= 400:
        raise RuntimeError(f"Supabase update failed: {resp.status_code} {resp.text}")
    try:
        return resp.json()
    except Exception:
        return []


def delete(table: str, eq: dict):
    client = get_client()
    params: dict[str, str] = {}
    for k, v in eq.items():
        params[k] = f"eq.{v}"
    headers = dict(client.headers)
    headers["Prefer"] = "return=representation"
    resp = client.delete(f"/rest/v1/{table}", params=params, headers=headers)
    if resp.status_code >= 400:
        raise RuntimeError(f"Supabase delete failed: {resp.status_code} {resp.text}")
    try:
        return resp.json()
    except Exception:
        return []


def ping() -> bool:
    try:
        client = get_client()
        resp = client.get("/rest/v1/boards", params={"select": "board_id", "limit": "0"})
        return resp.status_code < 400
    except Exception:
        return False


def rpc(fn_name: str, params: dict):
    client = get_client()
    # Try REST RPC path first
    resp = client.post(f"/rest/v1/rpc/{fn_name}", json=params)
    if resp.status_code == 404:
        # Fallback to /rpc/{fn}
        resp = client.post(f"/rpc/{fn_name}", json=params)
    if resp.status_code >= 400:
        raise RuntimeError(f"Supabase rpc failed: {resp.status_code} {resp.text}")
    try:
        return resp.json()
    except Exception:
        return None
