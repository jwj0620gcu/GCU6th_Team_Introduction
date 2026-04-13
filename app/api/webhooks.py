from fastapi import APIRouter, Header, Request, HTTPException

from app.repositories import supabase_client

router = APIRouter()


@router.post("/github")
async def github_webhook(request: Request, x_github_delivery: str | None = Header(None), x_github_event: str | None = Header(None)):
    payload = await request.json()
    delivery_id = x_github_delivery or payload.get("delivery_id") or None
    event = x_github_event or payload.get("event") or None

    if not delivery_id or not event:
        raise HTTPException(status_code=400, detail="missing delivery id or event header")

    try:
        # Try RPC first
        try:
            # Supabase function signature is: process_github_webhook(p_delivery_id, p_event, p_payload)
            res = supabase_client.rpc(
                "process_github_webhook",
                {"p_delivery_id": delivery_id, "p_event": event, "p_payload": payload},
            )
            return {"ok": True, "result": res}
        except Exception:
            # Fallback: insert into github_webhook_deliveries
            rec = {"delivery_id": delivery_id, "event": event, "payload": payload, "status": "processed"}
            res = supabase_client.insert("github_webhook_deliveries", rec)
            return {"ok": True, "inserted": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
