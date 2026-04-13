from __future__ import annotations

from pathlib import Path

import httpx
from typer.testing import CliRunner

from ttodo_cli.config import write_settings
from ttodo_cli.main import app


runner = CliRunner()


class DummyAPIClient:
    def __init__(self, settings):
        self.settings = settings

    def close(self) -> None:
        return None

    def get_health(self):
        return {"ok": True}

    def list_boards(self):
        return {
            "boards": [
                {
                    "board_id": "board-1",
                    "name": "Demo Board",
                }
            ]
        }

    def list_columns(self, board_id: str):
        return {
            "columns": [
                {"column_id": "col-1", "name": "Backlog", "position": 0, "board_id": board_id}
            ]
        }

    def list_issues(self, board_id: str):
        return {
            "issues": [
                {
                    "issue_id": "iss-1",
                    "github_issue_number": 1,
                    "title": "Test issue",
                    "status": "open",
                    "board_id": board_id,
                }
            ]
        }

    def post_github_webhook(self, delivery_id: str, event: str, payload: dict):
        return {"ok": True, "result": {"delivery_id": delivery_id, "event": event, "payload": payload}}


def _make_config(path: Path, *, api_key: str = "test-key", base_url: str = "http://127.0.0.1:8000") -> None:
    write_settings(path, base_url=base_url, api_key=api_key, timeout_seconds=10.0)


def test_health_json_success(monkeypatch, tmp_path: Path):
    config = tmp_path / "kanban.toml"
    _make_config(config)
    monkeypatch.setattr("ttodo_cli.main.APIClient", DummyAPIClient)

    result = runner.invoke(app, ["--config", str(config), "health", "--json"])

    assert result.exit_code == 0
    assert '"ok": true' in result.stdout


def test_boards_list_requires_api_key(tmp_path: Path):
    config = tmp_path / "kanban.toml"
    _make_config(config, api_key="")

    result = runner.invoke(app, ["--config", str(config), "board", "list"])

    assert result.exit_code != 0
    assert "API key is required" in result.stdout


def test_boards_list_network_error_is_handled(monkeypatch, tmp_path: Path):
    config = tmp_path / "kanban.toml"
    _make_config(config, api_key="test-key")

    class ErrorClient(DummyAPIClient):
        def list_boards(self):
            request = httpx.Request("GET", "http://127.0.0.1:8000/boards/")
            raise httpx.ConnectError("connection failed", request=request)

    monkeypatch.setattr("ttodo_cli.main.APIClient", ErrorClient)

    result = runner.invoke(app, ["--config", str(config), "board", "list"])

    assert result.exit_code == 1
    assert "Network error" in result.stdout


def test_webhook_missing_payload_file_is_user_friendly(monkeypatch, tmp_path: Path):
    config = tmp_path / "kanban.toml"
    _make_config(config)
    monkeypatch.setattr("ttodo_cli.main.APIClient", DummyAPIClient)

    missing_file = tmp_path / "missing.json"
    result = runner.invoke(
        app,
        [
            "--config",
            str(config),
            "webhook",
            "github",
            "--event",
            "issues",
            "--payload-file",
            str(missing_file),
        ],
    )

    assert result.exit_code == 1
    assert "Payload file not found" in result.stdout


def test_config_show_masks_api_key(tmp_path: Path):
    config = tmp_path / "kanban.toml"
    _make_config(config, api_key="abcdefghijklmnop")

    result = runner.invoke(app, ["--config", str(config), "config", "show", "--json"])

    assert result.exit_code == 0
    assert '"api_key_masked": "abcd...mnop"' in result.stdout
