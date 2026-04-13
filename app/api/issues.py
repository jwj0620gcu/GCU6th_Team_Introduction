from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies import get_api_key
from app.repositories import supabase_client

router = APIRouter()
_SUPABASE_ERROR_RE = re.compile(r"Supabase [a-z]+ failed: (\d{3})\s*(.*)")


class IssueCreateRequest(BaseModel):
    board_id: str = Field(..., description="Board ID")
    title: str = Field(..., description="Issue title")
    status: str | None = Field(None, description="Issue status")
    column_id: str | None = Field(None, description="Board column ID")
    user_id: str | None = Field(None, description="Assignee user ID")
    milestone: str | None = Field(None, description="Milestone")
    labels: list[str] | None = Field(None, description="Label names")
    body: str | None = Field(None, description="Issue body")
    github_issue_id: int | None = Field(None, description="GitHub issue ID")
    github_issue_number: int | None = Field(None, description="GitHub issue number")
    github_url: str | None = Field(None, description="GitHub issue URL")


class IssueUpdateRequest(BaseModel):
    title: str | None = Field(None, description="Issue title")
    status: str | None = Field(None, description="Issue status")
    column_id: str | None = Field(None, description="Board column ID")
    user_id: str | None = Field(None, description="Assignee user ID")
    milestone: str | None = Field(None, description="Milestone")
    labels: list[str] | None = Field(None, description="Label names")
    body: str | None = Field(None, description="Issue body")
    github_url: str | None = Field(None, description="GitHub issue URL")


def _raise_from_supabase_error(exc: Exception) -> None:
    message = str(exc)
    matched = _SUPABASE_ERROR_RE.match(message)
    if not matched:
        raise HTTPException(status_code=500, detail=message)

    status_code = int(matched.group(1))
    detail = matched.group(2).strip() or message
    raise HTTPException(status_code=status_code, detail=detail)


@router.post("/issues", dependencies=[Depends(get_api_key)], status_code=status.HTTP_201_CREATED)
async def create_issue(payload: IssueCreateRequest) -> dict[str, Any]:
    try:
        row = payload.model_dump(exclude_none=True)
        inserted = supabase_client.insert("issues", row)
        if not inserted:
            raise HTTPException(status_code=500, detail="failed to create issue")
        return {"issue": inserted[0]}
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        _raise_from_supabase_error(e)


@router.patch("/issues/{issue_id}", dependencies=[Depends(get_api_key)])
async def update_issue(issue_id: str, payload: IssueUpdateRequest) -> dict[str, Any]:
    row = payload.model_dump(exclude_none=True)
    if not row:
        raise HTTPException(status_code=400, detail="at least one field is required")

    try:
        updated = supabase_client.update("issues", row, {"issue_id": issue_id})
        if not updated:
            raise HTTPException(status_code=404, detail="issue not found")
        return {"issue": updated[0]}
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        _raise_from_supabase_error(e)


@router.delete("/issues/{issue_id}", dependencies=[Depends(get_api_key)])
async def delete_issue(issue_id: str) -> dict[str, Any]:
    try:
        deleted = supabase_client.delete("issues", {"issue_id": issue_id})
        if not deleted:
            raise HTTPException(status_code=404, detail="issue not found")
        return {"ok": True, "deleted_issue_id": issue_id}
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        _raise_from_supabase_error(e)
