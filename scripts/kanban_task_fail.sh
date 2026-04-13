#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/kanban_sync_lib.sh"

TASK_KEY=""
ISSUE_ID=""
REASON=""
STATUS="${KANBAN_FAIL_STATUS:-open}"
COLUMN_ID="${KANBAN_COLUMN_READY_ID:-${KANBAN_COLUMN_BACKLOG_ID:-}}"

usage() {
  cat <<'EOF'
Usage:
  scripts/kanban_task_fail.sh --task-key <key> [options]

Options:
  --task-key <key>      Task key in state file (required)
  --issue-id <id>       Explicit issue id (optional)
  --reason <text>       Failure reason (stored in issue body)
  --status <status>     Fail status (default: open)
  --column-id <id>      Fail column id (default: KANBAN_COLUMN_READY_ID/BACKLOG)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-key)
      TASK_KEY="${2:-}"
      shift 2
      ;;
    --issue-id)
      ISSUE_ID="${2:-}"
      shift 2
      ;;
    --reason)
      REASON="${2:-}"
      shift 2
      ;;
    --status)
      STATUS="${2:-}"
      shift 2
      ;;
    --column-id)
      COLUMN_ID="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      kanban_sync_log "unknown option: $1"
      usage
      exit 2
      ;;
  esac
done

if [[ -z "$TASK_KEY" ]]; then
  usage
  exit 2
fi

kanban_sync_setup

if [[ -z "$ISSUE_ID" ]]; then
  if ! ISSUE_ID="$(kanban_sync_state_get_issue_id "$TASK_KEY" 2>/dev/null)"; then
    kanban_sync_log "issue_id not found for task_key=$TASK_KEY"
    exit 1
  fi
fi

cmd=(--config "$KANBAN_SYNC_CONFIG" issue update "$ISSUE_ID" --status "$STATUS" --json)

if [[ -n "$COLUMN_ID" ]]; then
  cmd+=(--column-id "$COLUMN_ID")
fi

if [[ -n "$REASON" ]]; then
  cmd+=(--body "$REASON")
fi

raw="$(kanban_sync_run_cli "${cmd[@]}")"
kanban_sync_state_touch_status "$TASK_KEY" "$STATUS"
kanban_sync_log "failed task_key=$TASK_KEY issue_id=$ISSUE_ID status=$STATUS"
echo "$raw"
