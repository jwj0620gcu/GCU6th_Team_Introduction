#!/usr/bin/env bash
set -euo pipefail

KANBAN_SYNC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KANBAN_SYNC_STATE_FILE="${KANBAN_SYNC_STATE_FILE:-$KANBAN_SYNC_ROOT/.claude/kanban-state.json}"
KANBAN_SYNC_CONFIG="${KANBAN_CONFIG:-$HOME/.config/kanban/config.toml}"


kanban_sync_log() {
  echo "[kanban-sync] $*" >&2
}


kanban_sync_require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    kanban_sync_log "missing command: $cmd"
    exit 127
  fi
}


kanban_sync_source_env() {
  local env_file="$KANBAN_SYNC_ROOT/.sync.env"
  if [[ -f "$env_file" ]]; then
    # shellcheck disable=SC1090
    set -a
    source "$env_file"
    set +a
  fi
}


kanban_sync_prepare_auth_env() {
  if [[ -z "${KANBAN_API_KEY:-}" && -n "${SWAGGER_X_API_KEY:-}" ]]; then
    export KANBAN_API_KEY="$SWAGGER_X_API_KEY"
  fi
}


kanban_sync_run_cli() {
  (
    cd "$KANBAN_SYNC_ROOT"
    uvx --isolated --from . kanban "$@"
  )
}


kanban_sync_ensure_config() {
  local base_url="${KANBAN_BASE_URL:-http://127.0.0.1:8000}"
  local cfg="$KANBAN_SYNC_CONFIG"
  local api_key="${KANBAN_API_KEY:-}"

  if [[ -f "$cfg" ]]; then
    return 0
  fi

  if [[ -z "$api_key" ]]; then
    kanban_sync_log "KANBAN_API_KEY(or SWAGGER_X_API_KEY) is required to init config: $cfg"
    exit 1
  fi

  kanban_sync_log "creating config: $cfg"
  kanban_sync_run_cli --config "$cfg" config init \
    --base-url "$base_url" \
    --api-key "$api_key" \
    --force >/dev/null
}


kanban_sync_check_health() {
  if ! kanban_sync_run_cli --config "$KANBAN_SYNC_CONFIG" health >/dev/null 2>&1; then
    kanban_sync_log "backend is not reachable. start server first: uvicorn app.main:app --reload --port 8000"
    exit 1
  fi
}


kanban_sync_init_state() {
  mkdir -p "$(dirname "$KANBAN_SYNC_STATE_FILE")"
  if [[ ! -f "$KANBAN_SYNC_STATE_FILE" ]]; then
    printf '{"tasks":{}}\n' > "$KANBAN_SYNC_STATE_FILE"
  fi
}


kanban_sync_state_get_issue_id() {
  local task_key="$1"
  python3 - "$KANBAN_SYNC_STATE_FILE" "$task_key" <<'PY'
import json
import pathlib
import sys

state_path = pathlib.Path(sys.argv[1])
task_key = sys.argv[2]
if not state_path.exists():
    sys.exit(1)
try:
    data = json.loads(state_path.read_text(encoding="utf-8"))
except Exception:
    sys.exit(1)
issue_id = data.get("tasks", {}).get(task_key, {}).get("issue_id", "")
if issue_id:
    print(issue_id)
    sys.exit(0)
sys.exit(1)
PY
}


kanban_sync_state_upsert() {
  local task_key="$1"
  local issue_id="$2"
  local board_id="$3"
  local status="$4"
  local title="$5"
  python3 - "$KANBAN_SYNC_STATE_FILE" "$task_key" "$issue_id" "$board_id" "$status" "$title" <<'PY'
import datetime as dt
import json
import pathlib
import sys

state_path = pathlib.Path(sys.argv[1])
task_key, issue_id, board_id, status, title = sys.argv[2:]
now = dt.datetime.now(dt.timezone.utc).isoformat()

if state_path.exists():
    try:
        data = json.loads(state_path.read_text(encoding="utf-8"))
    except Exception:
        data = {"tasks": {}}
else:
    data = {"tasks": {}}

tasks = data.setdefault("tasks", {})
existing = tasks.get(task_key, {})
created_at = existing.get("created_at", now)
tasks[task_key] = {
    "issue_id": issue_id,
    "board_id": board_id,
    "title": title,
    "last_status": status,
    "created_at": created_at,
    "updated_at": now,
}
state_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}


kanban_sync_state_mark_done() {
  local task_key="$1"
  python3 - "$KANBAN_SYNC_STATE_FILE" "$task_key" <<'PY'
import datetime as dt
import json
import pathlib
import sys

state_path = pathlib.Path(sys.argv[1])
task_key = sys.argv[2]
if not state_path.exists():
    sys.exit(0)
try:
    data = json.loads(state_path.read_text(encoding="utf-8"))
except Exception:
    sys.exit(0)
task = data.get("tasks", {}).get(task_key)
if not task:
    sys.exit(0)
task["completed_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
task["updated_at"] = task["completed_at"]
state_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}


kanban_sync_state_touch_status() {
  local task_key="$1"
  local status="$2"
  local title="${3:-}"
  python3 - "$KANBAN_SYNC_STATE_FILE" "$task_key" "$status" "$title" <<'PY'
import datetime as dt
import json
import pathlib
import sys

state_path = pathlib.Path(sys.argv[1])
task_key, status, title = sys.argv[2:]
if not state_path.exists():
    sys.exit(0)
try:
    data = json.loads(state_path.read_text(encoding="utf-8"))
except Exception:
    sys.exit(0)
task = data.get("tasks", {}).get(task_key)
if not task:
    sys.exit(0)
task["last_status"] = status
if title:
    task["title"] = title
task["updated_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
state_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}


kanban_sync_resolve_column_id() {
  local board_id="$1"
  local name_hint="${2:-Backlog}"

  if [[ -n "${KANBAN_COLUMN_BACKLOG_ID:-}" ]]; then
    echo "$KANBAN_COLUMN_BACKLOG_ID"
    return 0
  fi
  if [[ -n "${KANBAN_COLUMN_READY_ID:-}" ]]; then
    echo "$KANBAN_COLUMN_READY_ID"
    return 0
  fi

  local raw
  raw="$(kanban_sync_run_cli --config "$KANBAN_SYNC_CONFIG" board columns "$board_id" --json)"
  python3 - "$raw" "$name_hint" <<'PY'
import json, sys
payload = json.loads(sys.argv[1])
hint = sys.argv[2].lower()
cols = payload.get("columns", [])
if not cols:
    raise SystemExit(1)
match = next((c for c in cols if c.get("name", "").lower() == hint), None)
print((match or sorted(cols, key=lambda c: c.get("position", 0))[0])["column_id"])
PY
}


kanban_sync_resolve_board_id() {
  if [[ -n "${KANBAN_BOARD_ID:-}" ]]; then
    echo "$KANBAN_BOARD_ID"
    return 0
  fi

  local raw
  raw="$(kanban_sync_run_cli --config "$KANBAN_SYNC_CONFIG" board list --json)"
  python3 - <<'PY' "$raw"
import json
import sys

payload = json.loads(sys.argv[1])
boards = payload.get("boards", [])
if not boards:
    raise SystemExit(1)
print(boards[0]["board_id"])
PY
}


kanban_sync_generate_github_number() {
  local task_key="$1"
  python3 - "$task_key" <<'PY'
import hashlib
import sys
import time

task_key = sys.argv[1]
seed = f"{task_key}:{time.time_ns()}"
value = int(hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12], 16)
number = 900000000 + (value % 90000000)
print(number)
PY
}


kanban_sync_extract_issue_id() {
  local raw="$1"
  python3 - "$raw" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
issue = payload.get("issue", {})
issue_id = issue.get("issue_id", "")
if not issue_id:
    raise SystemExit(1)
print(issue_id)
PY
}


kanban_sync_setup() {
  kanban_sync_require_cmd "python3"
  kanban_sync_require_cmd "uvx"
  kanban_sync_source_env
  kanban_sync_prepare_auth_env
  kanban_sync_ensure_config
  kanban_sync_check_health
  kanban_sync_init_state
}
