from pydantic import BaseModel
from typing import Any


class Board(BaseModel):
    board_id: str
    name: str
    github_project_url: str | None = None


class Column(BaseModel):
    column_id: str
    board_id: str
    name: str
    position: int


class Issue(BaseModel):
    issue_id: str
    board_id: str
    column_id: str | None
    user_id: str | None
    status: str | None
    title: str | None
    body: Any | None


class WebhookPayload(BaseModel):
    delivery_id: str
    event: str
    payload: Any
