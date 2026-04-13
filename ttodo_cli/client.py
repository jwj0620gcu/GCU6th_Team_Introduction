from __future__ import annotations

from typing import Any

import httpx

from ttodo_cli.config import Settings


class APIClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = httpx.Client(
            base_url=settings.base_url,
            timeout=settings.timeout_seconds,
            headers={"Accept": "application/json"},
        )

    def close(self) -> None:
        self.client.close()

    def _headers(self, needs_api_key: bool) -> dict[str, str]:
        headers: dict[str, str] = {}
        if needs_api_key and self.settings.api_key:
            headers["X-API-Key"] = self.settings.api_key
        return headers

    def request(self, method: str, path: str, *, needs_api_key: bool, **kwargs: Any) -> Any:
        headers = kwargs.pop("headers", {})
        headers = {**self._headers(needs_api_key), **headers}
        response = self.client.request(method, path, headers=headers, **kwargs)
        response.raise_for_status()
        if response.content:
            return response.json()
        return None

    def get_health(self) -> Any:
        return self.request("GET", "/health", needs_api_key=False)

    def list_boards(self) -> Any:
        return self.request("GET", "/boards/", needs_api_key=True)

    def list_columns(self, board_id: str) -> Any:
        return self.request("GET", f"/boards/{board_id}/columns", needs_api_key=True)

    def list_issues(self, board_id: str) -> Any:
        return self.request("GET", f"/boards/{board_id}/issues", needs_api_key=True)

    def create_issue(self, payload: dict[str, Any]) -> Any:
        return self.request("POST", "/issues", needs_api_key=True, json=payload)

    def update_issue(self, issue_id: str, payload: dict[str, Any]) -> Any:
        return self.request("PATCH", f"/issues/{issue_id}", needs_api_key=True, json=payload)

    def delete_issue(self, issue_id: str) -> Any:
        return self.request("DELETE", f"/issues/{issue_id}", needs_api_key=True)

    def post_github_webhook(self, delivery_id: str, event: str, payload: dict[str, Any]) -> Any:
        return self.request(
            "POST",
            "/webhooks/github",
            needs_api_key=False,
            headers={
                "X-GitHub-Delivery": delivery_id,
                "X-GitHub-Event": event,
                "Content-Type": "application/json",
            },
            json=payload,
        )
