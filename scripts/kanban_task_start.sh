#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/kanban_sync_lib.sh"

TASK_KEY=""
TITLE=""
BODY=""
BOARD_ID=""
COLUMN_ID="${KANBAN_COLUMN_READY_ID:-${KANBAN_COLUMN_BACKLOG_ID:-}}"
STATUS="${KANBAN_START_STATUS:-open}"

usage() {
  cat <<'EOF'
Usage:
  scripts/kanban_task_start.sh --task-key <key> --title <title> [options]

Options:
  --task-key <key>      Unique key for idempotency (required)
  --title <title>       Issue title (required)
  --body <text>         Issue body
  --board-id <id>       Target board id (default: KANBAN_BOARD_ID or first board)
  --column-id <id>      Target column id
  --status <status>     Issue status (default: open)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-key)
      TASK_KEY="${2:-}"
      shift 2
      ;;
    --title)
      TITLE="${2:-}"
      shift 2
      ;;
    --body)
      BODY="${2:-}"
      shift 2
      ;;
    --board-id)
      BOARD_ID="${2:-}"
      shift 2
      ;;
    --column-id)
      COLUMN_ID="${2:-}"
      shift 2
      ;;
    --status)
      STATUS="${2:-}"
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

if [[ -z "$TASK_KEY" || -z "$TITLE" ]]; then
  usage
  exit 2
fi

kanban_sync_setup

if existing_issue_id="$(kanban_sync_state_get_issue_id "$TASK_KEY" 2>/dev/null)"; then
  kanban_sync_log "already tracked task_key=$TASK_KEY issue_id=$existing_issue_id"
  echo "$existing_issue_id"
  exit 0
fi

if [[ -z "$BOARD_ID" ]]; then
  BOARD_ID="$(kanban_sync_resolve_board_id)"
fi

if [[ -z "$COLUMN_ID" ]]; then
  COLUMN_ID="$(kanban_sync_resolve_column_id "$BOARD_ID")"
fi

GITHUB_NUMBER="$(kanban_sync_generate_github_number "$TASK_KEY")"

cmd=(
  --config "$KANBAN_SYNC_CONFIG"
  issue create
  --board-id "$BOARD_ID"
  --title "$TITLE"
  --status "$STATUS"
  --github-issue-id "$GITHUB_NUMBER"
  --github-issue-number "$GITHUB_NUMBER"
  --json
)

if [[ -n "$BODY" ]]; then
  cmd+=(--body "$BODY")
fi

if [[ -n "$COLUMN_ID" ]]; then
  cmd+=(--column-id "$COLUMN_ID")
fi

raw="$(kanban_sync_run_cli "${cmd[@]}")"
issue_id="$(kanban_sync_extract_issue_id "$raw")"

kanban_sync_state_upsert "$TASK_KEY" "$issue_id" "$BOARD_ID" "$STATUS" "$TITLE"
kanban_sync_log "created task_key=$TASK_KEY issue_id=$issue_id board_id=$BOARD_ID"
echo "$issue_id"
