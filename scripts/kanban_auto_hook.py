#!/usr/bin/env python3
"""
Hook dispatcher:
- start: create kanban issue at task start
- progress: update issue while tools succeed
- fail: mark issue on tool failure
- done: mark issue complete at session stop
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = ROOT / ".claude" / "kanban-auto-map.json"
MAX_TEXT = 200


def _load_payload() -> dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _load_map() -> dict[str, Any]:
    if not MAP_PATH.exists():
        return {"sessions": {}, "active_task_key": ""}
    try:
        data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"sessions": {}, "active_task_key": ""}
    if not isinstance(data, dict):
        return {"sessions": {}, "active_task_key": ""}
    data.setdefault("sessions", {})
    data.setdefault("active_task_key", "")
    return data


def _save_map(data: dict[str, Any]) -> None:
    MAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    MAP_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _first_non_empty(payload: dict[str, Any], *keys: str) -> str:
    for key in keys:
        val = payload.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def _extract_session_id(payload: dict[str, Any]) -> str:
    sid = _first_non_empty(payload, "session_id", "sessionId")
    if sid:
        return sid
    sid = _first_non_empty(payload, "conversation_id", "conversationId", "thread_id")
    if sid:
        return sid
    return ""


def _extract_tool_name(payload: dict[str, Any]) -> str:
    return _first_non_empty(payload, "tool_name", "toolName", "tool")


def _extract_user_text(payload: dict[str, Any]) -> str:
    txt = _first_non_empty(payload, "message", "prompt", "user_message", "input", "text")
    if txt:
        return txt
    tool_input = payload.get("tool_input") or payload.get("toolInput")
    if isinstance(tool_input, dict):
        for key in ("cmd", "command", "q", "query"):
            val = tool_input.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
    return ""


def _extract_error_text(payload: dict[str, Any]) -> str:
    err = payload.get("tool_response") or payload.get("toolResponse") or payload.get("error") or payload.get("tool_error")
    if isinstance(err, str):
        return err.strip()
    if err is None:
        return ""
    try:
        return json.dumps(err, ensure_ascii=False)
    except Exception:
        return str(err)


def _short(text: str, limit: int = MAX_TEXT) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[:limit] + "..."


def _resolve_task_key(payload: dict[str, Any], mode: str, mapping: dict[str, Any]) -> tuple[str, str]:
    sessions = mapping.setdefault("sessions", {})
    session_id = _extract_session_id(payload)

    if session_id and session_id in sessions:
        return sessions[session_id], session_id

    active = mapping.get("active_task_key", "")
    if mode != "start":
        if session_id and session_id in sessions:
            return sessions[session_id], session_id
        if active:
            return active, session_id
        return "", session_id

    # start mode
    if session_id:
        task_key = f"codex:{session_id}"
    else:
        task_key = f"codex:auto:{int(time.time())}"
    return task_key, session_id


def _task_title(payload: dict[str, Any], task_key: str) -> str:
    env_title = os.getenv("KANBAN_TASK_TITLE", "").strip()
    if env_title:
        return env_title
    text = _extract_user_text(payload)
    if text:
        return f"Codex: {_short(text, 80)}"
    return f"Codex task {task_key[-12:]}"


def _run_script(script_name: str, args: list[str]) -> tuple[int, str, str]:
    cmd = [str(ROOT / "scripts" / script_name), *args]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _ok(result: dict[str, Any]) -> None:
    print(json.dumps({"ok": True, **result}, ensure_ascii=False))


def _skip(reason: str) -> None:
    print(json.dumps({"ok": True, "skipped": True, "reason": reason}, ensure_ascii=False))


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode not in {"start", "progress", "fail", "done"}:
        print(json.dumps({"ok": False, "error": "mode must be one of start/progress/fail/done"}))
        raise SystemExit(2)

    payload = _load_payload()
    mapping = _load_map()
    task_key, session_id = _resolve_task_key(payload, mode, mapping)
    if not task_key:
        _skip("no active task key")
        return

    if mode == "start":
        title = _task_title(payload, task_key)
        body = _extract_user_text(payload) or "자동 등록된 Codex 작업"
        code, out, err = _run_script(
            "kanban_task_start.sh",
            ["--task-key", task_key, "--title", title, "--body", _short(body, 300)],
        )
        if code != 0:
            _skip(f"start failed: {err or out}")
            return
        issue_id = out.splitlines()[-1].strip() if out else ""
        if session_id:
            mapping["sessions"][session_id] = task_key
        mapping["active_task_key"] = task_key
        _save_map(mapping)
        _ok({"mode": mode, "task_key": task_key, "issue_id": issue_id})
        return

    if mode == "progress":
        tool = _extract_tool_name(payload) or "-"
        body = f"{datetime.now(timezone.utc).isoformat()} progress tool={tool}"
        code, out, err = _run_script(
            "kanban_task_update.sh",
            ["--task-key", task_key, "--status", "open", "--body", body],
        )
        if code != 0:
            _skip(f"progress failed: {err or out}")
            return
        _ok({"mode": mode, "task_key": task_key})
        return

    if mode == "fail":
        reason = _extract_error_text(payload) or "tool failure"
        code, out, err = _run_script(
            "kanban_task_fail.sh",
            ["--task-key", task_key, "--reason", _short(reason, 600)],
        )
        if code != 0:
            _skip(f"fail update failed: {err or out}")
            return
        _ok({"mode": mode, "task_key": task_key})
        return

    # done
    summary = os.getenv("KANBAN_TASK_DONE_SUMMARY", "").strip() or "Codex session completed"
    code, out, err = _run_script(
        "kanban_task_done.sh",
        ["--task-key", task_key, "--summary", _short(summary, 600)],
    )
    if code != 0:
        _skip(f"done update failed: {err or out}")
        return
    _ok({"mode": mode, "task_key": task_key})


if __name__ == "__main__":
    main()
