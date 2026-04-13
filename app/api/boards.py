from fastapi import APIRouter, Depends, HTTPException

from app.repositories import supabase_client
from app.dependencies import get_api_key

router = APIRouter()


@router.get("/", dependencies=[Depends(get_api_key)])
async def list_boards():
    try:
        boards = supabase_client.select("boards", "*")
        return {"boards": boards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{board_id}/columns", dependencies=[Depends(get_api_key)])
async def list_columns(board_id: str):
    try:
        cols = supabase_client.select("board_columns", "*", {"board_id": board_id})
        return {"columns": cols}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{board_id}/issues", dependencies=[Depends(get_api_key)])
async def list_issues(board_id: str):
    try:
        issues = supabase_client.select("issues", "*", {"board_id": board_id})
        return {"issues": issues}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
