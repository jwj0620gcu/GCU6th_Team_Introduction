from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
import typer

from ttodo_cli.client import APIClient
from ttodo_cli.config import DEFAULT_CONFIG_PATH, Settings, load_settings, masked_key, write_settings


@dataclass(slots=True)
class CLIContext:
    settings: Settings
    json_output: bool = False


app = typer.Typer(help="Kanban Backend CLI - 팀 간반보드 백엔드 도구", no_args_is_help=True)
board_app = typer.Typer(help="보드 조회", no_args_is_help=True)
issue_app = typer.Typer(help="이슈 조회/생성/수정/삭제", no_args_is_help=True)
webhook_app = typer.Typer(help="웹훅 처리", no_args_is_help=True)
config_app = typer.Typer(help="CLI 설정", no_args_is_help=True)

app.add_typer(board_app, name="board")
app.add_typer(issue_app, name="issue")
app.add_typer(webhook_app, name="webhook")
app.add_typer(config_app, name="config")
# Backward-compatible aliases (hidden from help)
app.add_typer(board_app, name="boards", hidden=True)
app.add_typer(webhook_app, name="webhooks", hidden=True)
app.add_typer(board_app, name="todo", hidden=True)


def _print_payload(payload: Any, as_json: bool) -> None:
    if as_json:
        typer.echo(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    if isinstance(payload, dict):
        for k, v in payload.items():
            typer.echo(f"{k}: {v}")
        return

    if isinstance(payload, list):
        for item in payload:
            typer.echo(f"- {item}")
        return

    typer.echo(str(payload))


def _format_boards_text(payload: dict[str, Any]) -> None:
    boards = payload.get("boards", []) if isinstance(payload, dict) else []
    if not boards:
        typer.echo("No boards found.")
        return
    typer.echo(f"Boards ({len(boards)}):")
    for row in boards:
        typer.echo(f"- {row.get('name', '-')}: {row.get('board_id', '-')}")


def _format_columns_text(payload: dict[str, Any]) -> None:
    columns = payload.get("columns", []) if isinstance(payload, dict) else []
    if not columns:
        typer.echo("No columns found.")
        return
    sorted_columns = sorted(columns, key=lambda x: (x.get("position") is None, x.get("position")))
    typer.echo(f"Columns ({len(sorted_columns)}):")
    for row in sorted_columns:
        typer.echo(f"- [{row.get('position', '-')}] {row.get('name', '-')}: {row.get('column_id', '-')}")


def _format_issues_text(payload: dict[str, Any]) -> None:
    issues = payload.get("issues", []) if isinstance(payload, dict) else []
    if not issues:
        typer.echo("No issues found.")
        return
    typer.echo(f"Issues ({len(issues)}):")
    for row in issues:
        number = row.get("github_issue_number", "-")
        title = row.get("title", "-")
        status = row.get("status", "-")
        issue_id = row.get("issue_id", "-")
        typer.echo(f"- #{number} [{status}] {title} ({issue_id})")


def _require_api_key(settings: Settings) -> None:
    if settings.api_key:
        return
    typer.secho(
        "API key is required for this command. Set api_key in config file or KANBAN_API_KEY.",
        fg=typer.colors.RED,
    )
    raise typer.Exit(code=1)


def _load_payload(payload_file: Path | None, payload_json: str | None) -> dict[str, Any]:
    if payload_file and payload_json:
        raise typer.BadParameter("Use only one of --payload-file or --payload-json.")
    if payload_file:
        return json.loads(payload_file.read_text(encoding="utf-8"))
    if payload_json:
        return json.loads(payload_json)
    return {}


def _drop_none_fields(payload: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in payload.items() if v is not None}


def _run_api_call(func, as_json: bool, formatter=None) -> None:
    try:
        payload = func()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text.strip()
        typer.secho(f"HTTP {exc.response.status_code}: {detail}", fg=typer.colors.RED)
        raise typer.Exit(code=1)
    except httpx.HTTPError as exc:
        typer.secho(f"Network error: {exc}", fg=typer.colors.RED)
        raise typer.Exit(code=1)

    if as_json:
        _print_payload(payload, as_json=True)
        return
    if formatter:
        formatter(payload)
        return
    _print_payload(payload, as_json=False)


def _effective_json(ctx: typer.Context, command_json: bool) -> bool:
    state: CLIContext = ctx.obj
    return command_json or state.json_output


@app.callback()
def main(
    ctx: typer.Context,
    config: Path | None = typer.Option(
        None,
        "--config",
        "--kanban-config",
        help="Config file path",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        help="JSON 형식으로 출력",
    ),
) -> None:
    env_config = os.getenv("KANBAN_CONFIG")
    config_path = config or (Path(env_config) if env_config else DEFAULT_CONFIG_PATH)
    ctx.obj = CLIContext(settings=load_settings(config_path), json_output=json_output)


@app.command("health")
def health(
    ctx: typer.Context,
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    client = APIClient(settings)
    try:
        _run_api_call(client.get_health, _effective_json(ctx, as_json))
    finally:
        client.close()


@board_app.command("list")
def board_list(
    ctx: typer.Context,
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    _require_api_key(settings)
    client = APIClient(settings)
    try:
        _run_api_call(
            client.list_boards,
            as_json=_effective_json(ctx, as_json),
            formatter=_format_boards_text,
        )
    finally:
        client.close()


@board_app.command("columns")
def board_columns(
    ctx: typer.Context,
    board_id: str = typer.Argument(..., help="Board ID"),
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    _require_api_key(settings)
    client = APIClient(settings)
    try:
        _run_api_call(
            lambda: client.list_columns(board_id),
            as_json=_effective_json(ctx, as_json),
            formatter=_format_columns_text,
        )
    finally:
        client.close()


@board_app.command("issues")
def board_issues(
    ctx: typer.Context,
    board_id: str = typer.Argument(..., help="Board ID"),
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    _require_api_key(settings)
    client = APIClient(settings)
    try:
        _run_api_call(
            lambda: client.list_issues(board_id),
            as_json=_effective_json(ctx, as_json),
            formatter=_format_issues_text,
        )
    finally:
        client.close()


@issue_app.command("list")
def issue_list(
    ctx: typer.Context,
    board_id: str = typer.Option(..., "--board-id", help="Board ID"),
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    _require_api_key(settings)
    client = APIClient(settings)
    try:
        _run_api_call(
            lambda: client.list_issues(board_id),
            as_json=_effective_json(ctx, as_json),
            formatter=_format_issues_text,
        )
    finally:
        client.close()


@issue_app.command("create")
def issue_create(
    ctx: typer.Context,
    board_id: str = typer.Option(..., "--board-id", help="Board ID"),
    title: str = typer.Option(..., "--title", help="Issue title"),
    status: str | None = typer.Option(None, "--status", help="Issue status"),
    column_id: str | None = typer.Option(None, "--column-id", help="Board column ID"),
    user_id: str | None = typer.Option(None, "--user-id", help="Assignee user ID"),
    milestone: str | None = typer.Option(None, "--milestone", help="Milestone"),
    body: str | None = typer.Option(None, "--body", help="Issue body"),
    github_issue_id: int | None = typer.Option(None, "--github-issue-id", help="GitHub issue ID"),
    github_issue_number: int | None = typer.Option(
        None,
        "--github-issue-number",
        help="GitHub issue number",
    ),
    github_url: str | None = typer.Option(None, "--github-url", help="GitHub issue URL"),
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    _require_api_key(settings)

    payload = _drop_none_fields(
        {
            "board_id": board_id,
            "title": title,
            "status": status,
            "column_id": column_id,
            "user_id": user_id,
            "milestone": milestone,
            "body": body,
            "github_issue_id": github_issue_id,
            "github_issue_number": github_issue_number,
            "github_url": github_url,
        }
    )

    client = APIClient(settings)
    try:
        _run_api_call(
            lambda: client.create_issue(payload),
            as_json=_effective_json(ctx, as_json),
        )
    finally:
        client.close()


@issue_app.command("update")
def issue_update(
    ctx: typer.Context,
    issue_id: str = typer.Argument(..., help="Issue ID"),
    title: str | None = typer.Option(None, "--title", help="Issue title"),
    status: str | None = typer.Option(None, "--status", help="Issue status"),
    column_id: str | None = typer.Option(None, "--column-id", help="Board column ID"),
    user_id: str | None = typer.Option(None, "--user-id", help="Assignee user ID"),
    milestone: str | None = typer.Option(None, "--milestone", help="Milestone"),
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    _require_api_key(settings)

    payload = _drop_none_fields(
        {
            "title": title,
            "status": status,
            "column_id": column_id,
            "user_id": user_id,
            "milestone": milestone,
        }
    )
    if not payload:
        typer.secho(
            "Nothing to update. Provide at least one field (e.g. --title/--status/--column-id).",
            fg=typer.colors.RED,
        )
        raise typer.Exit(code=1)

    client = APIClient(settings)
    try:
        _run_api_call(
            lambda: client.update_issue(issue_id, payload),
            as_json=_effective_json(ctx, as_json),
        )
    finally:
        client.close()


@issue_app.command("delete")
def issue_delete(
    ctx: typer.Context,
    issue_id: str = typer.Argument(..., help="Issue ID"),
    yes: bool = typer.Option(False, "--yes", help="Confirm delete"),
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    _require_api_key(settings)
    if not yes:
        typer.secho("Delete is blocked. Use --yes to confirm.", fg=typer.colors.YELLOW)
        raise typer.Exit(code=1)

    client = APIClient(settings)
    try:
        payload = client.delete_issue(issue_id)
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text.strip()
        typer.secho(f"HTTP {exc.response.status_code}: {detail}", fg=typer.colors.RED)
        raise typer.Exit(code=1)
    except httpx.HTTPError as exc:
        typer.secho(f"Network error: {exc}", fg=typer.colors.RED)
        raise typer.Exit(code=1)
    finally:
        client.close()

    if _effective_json(ctx, as_json):
        _print_payload(payload, as_json=True)
        return
    typer.echo(f"Deleted issue: {issue_id}")


@webhook_app.command("github")
def webhook_github(
    ctx: typer.Context,
    event: str = typer.Option(..., "--event", help="GitHub event type (e.g. issues)"),
    delivery_id: str = typer.Option(
        str(uuid.uuid4()),
        "--delivery-id",
        help="GitHub delivery id for idempotency",
    ),
    payload_file: Path | None = typer.Option(
        None,
        "--payload-file",
        help="Path to JSON payload file",
    ),
    payload_json: str | None = typer.Option(
        None,
        "--payload-json",
        help="Inline JSON payload string",
    ),
    as_json: bool = typer.Option(False, "--json", help="Print raw JSON response"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    try:
        payload = _load_payload(payload_file, payload_json)
    except typer.BadParameter as exc:
        typer.secho(str(exc), fg=typer.colors.RED)
        raise typer.Exit(code=1)
    except FileNotFoundError as exc:
        typer.secho(f"Payload file not found: {exc.filename}", fg=typer.colors.RED)
        raise typer.Exit(code=1)
    except json.JSONDecodeError as exc:
        typer.secho(f"Invalid JSON payload: {exc}", fg=typer.colors.RED)
        raise typer.Exit(code=1)

    client = APIClient(settings)
    try:
        _run_api_call(
            lambda: client.post_github_webhook(delivery_id, event, payload),
            _effective_json(ctx, as_json),
        )
    finally:
        client.close()


@config_app.command("init")
def config_init(
    ctx: typer.Context,
    base_url: str = typer.Option("http://127.0.0.1:8000", "--base-url", help="API base URL"),
    api_key: str = typer.Option("", "--api-key", help="X-API-Key for boards endpoints"),
    timeout_seconds: float = typer.Option(10.0, "--timeout-seconds", help="HTTP timeout seconds"),
    force: bool = typer.Option(False, "--force", help="Overwrite existing config file"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    config_path = settings.config_path
    if config_path.exists() and not force:
        typer.secho(
            f"Config already exists: {config_path}. Use --force to overwrite.",
            fg=typer.colors.YELLOW,
        )
        raise typer.Exit(code=1)
    write_settings(config_path, base_url, api_key, timeout_seconds)
    typer.echo(f"Created config: {config_path}")


@config_app.command("show")
def config_show(
    ctx: typer.Context,
    as_json: bool = typer.Option(False, "--json", help="Print as JSON"),
) -> None:
    state: CLIContext = ctx.obj
    settings = state.settings
    payload = {
        "base_url": settings.base_url,
        "api_key_masked": masked_key(settings.api_key),
        "timeout_seconds": settings.timeout_seconds,
        "config_path": str(settings.config_path),
    }
    if _effective_json(ctx, as_json):
        typer.echo(json.dumps(payload, ensure_ascii=False, indent=2))
        return
    typer.echo(f"config_path: {payload['config_path']}")
    typer.echo(f"base_url: {payload['base_url']}")
    typer.echo(f"api_key_masked: {payload['api_key_masked'] or '(empty)'}")
    typer.echo(f"timeout_seconds: {payload['timeout_seconds']}")


if __name__ == "__main__":
    app()
