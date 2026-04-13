#!/usr/bin/env python3
"""
Append structured failure records from Claude hooks into CLAUDE.md.

Supported inputs:
1) Hook mode: JSON payload via stdin.
2) Manual mode: freeform note via CLI args.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

MAX_DUMP_CHARS = 16_000
LOG_FILE_NAME = "CLAUDE.md"
LOG_SECTION_HEADER = "## Agent Mistake Log"


def safe_dump(obj: object, max_chars: int = MAX_DUMP_CHARS) -> str:
    try:
        text = json.dumps(obj, ensure_ascii=False, indent=2)
    except Exception:  # noqa: BLE001
        try:
            text = str(obj)
        except Exception:  # noqa: BLE001
            text = "<unserializable>"

    if len(text) > max_chars:
        return text[:max_chars] + "\n... (truncated)"
    return text


def get_log_path() -> str:
    return os.path.join(os.getcwd(), LOG_FILE_NAME)


def ensure_log_file_ready(path: str) -> None:
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as file:
            file.write("# Agent Guide\n\n")

    with open(path, "r", encoding="utf-8") as file:
        content = file.read()

    if LOG_SECTION_HEADER not in content:
        with open(path, "a", encoding="utf-8") as file:
            file.write(f"\n\n{LOG_SECTION_HEADER}\n\n")


def append_to_log(markdown_text: str) -> None:
    path = get_log_path()
    ensure_log_file_ready(path)
    with open(path, "a", encoding="utf-8") as file:
        file.write(markdown_text)


def extract_field(payload: dict, *keys: str) -> object | None:
    for key in keys:
        if key in payload:
            return payload[key]
    return None


def build_entry(payload: dict) -> str:
    timestamp = str(payload.get("timestamp") or datetime.now(timezone.utc).isoformat())
    manual_mark = bool(payload.get("manual_mark"))
    hook_event = str(payload.get("hook_event_name") or payload.get("hookEventName") or "PostToolUseFailure")
    session_id = extract_field(payload, "session_id", "sessionId")
    tool_name = extract_field(payload, "tool_name", "toolName", "tool")
    tool_input = extract_field(payload, "tool_input", "toolInput")
    tool_response = extract_field(payload, "tool_response", "toolResponse", "error", "tool_error")
    note = str(extract_field(payload, "note", "message") or "").strip()

    lines: list[str] = []
    lines.append(f"### Agent mistake — {timestamp}\n")
    lines.append(f"- hook_event: `{hook_event}`\n")
    lines.append(f"- manual_mark: `{manual_mark}`\n")
    if session_id:
        lines.append(f"- session_id: `{session_id}`\n")
    if tool_name:
        lines.append(f"- tool_name: `{tool_name}`\n")
    lines.append("\n")

    if note:
        lines.append("#### Note\n\n")
        lines.append(f"{note}\n\n")

    if tool_input is not None:
        lines.append("#### Tool Input\n\n```json\n")
        lines.append(safe_dump(tool_input))
        lines.append("\n```\n\n")

    if tool_response is not None:
        lines.append("#### Tool Response / Error\n\n```json\n")
        lines.append(safe_dump(tool_response))
        lines.append("\n```\n\n")

    lines.append("----\n\n")
    return "".join(lines)


def load_payload() -> dict:
    stdin_text = sys.stdin.read().strip()

    if stdin_text:
        try:
            parsed = json.loads(stdin_text)
        except json.JSONDecodeError as error:
            print(f"Error: invalid JSON on stdin: {error}", file=sys.stderr)
            raise SystemExit(2) from error
        if not isinstance(parsed, dict):
            print("Error: stdin JSON must be an object", file=sys.stderr)
            raise SystemExit(2)
        return parsed

    if len(sys.argv) > 1:
        return {"manual_mark": True, "note": " ".join(sys.argv[1:])}

    print("Error: no stdin JSON and no CLI args provided", file=sys.stderr)
    raise SystemExit(3)


def main() -> None:
    payload = load_payload()
    entry = build_entry(payload)
    append_to_log(entry)
    print(json.dumps({"ok": True, "appended": True, "file": LOG_FILE_NAME}))


if __name__ == "__main__":
    main()
