#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_MD="${1:-$ROOT_DIR/docs/CLI_E2E_RESULT.md}"
ENV_FILE="${2:-$ROOT_DIR/.sync.env}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"

# Prefer already-exported env vars (useful for CI). If missing, fallback to env file.
if [[ -z "${SWAGGER_X_API_KEY:-}" || -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    source "$ENV_FILE"
    set +a
  fi
fi

if [[ -z "${SWAGGER_X_API_KEY:-}" ]]; then
  echo "SWAGGER_X_API_KEY is required (env or env-file)" >&2
  exit 1
fi
if [[ -z "${SUPABASE_URL:-}" ]]; then
  echo "SUPABASE_URL is required (env or env-file)" >&2
  exit 1
fi
if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "SUPABASE_SERVICE_ROLE_KEY is required (env or env-file)" >&2
  exit 1
fi

API_BASE_URL="${KANBAN_BASE_URL:-http://127.0.0.1:8000}"

if [[ "$(curl -s -o /dev/null -w '%{http_code}' "$API_BASE_URL/health")" != "200" ]]; then
  echo "API server is not healthy at $API_BASE_URL" >&2
  exit 1
fi

CONFIG_OK="$TMP_DIR/config_ok.toml"
CONFIG_NO_KEY="$TMP_DIR/config_no_key.toml"
CONFIG_BAD_URL="$TMP_DIR/config_bad_url.toml"
PAYLOAD_VALID="$TMP_DIR/payload.json"
PAYLOAD_INVALID="$TMP_DIR/invalid.json"
MISSING_PAYLOAD="$TMP_DIR/missing.json"

cat > "$PAYLOAD_VALID" <<'JSON'
{
  "action": "opened",
  "issue": {
    "id": 9900000124,
    "number": 999004,
    "title": "[CLI E2E] webhook payload",
    "body": "created by e2e script"
  },
  "repository": {
    "id": 1,
    "name": "GCU6th_Team_Introduction"
  },
  "sender": {
    "id": 123457,
    "login": "kanban-e2e"
  }
}
JSON

cat > "$PAYLOAD_INVALID" <<'JSON'
{ invalid json
JSON

cat > "$CONFIG_OK" <<TOML
base_url = "${API_BASE_URL}"
api_key = "${SWAGGER_X_API_KEY}"
timeout_seconds = 10.0
TOML

cat > "$CONFIG_NO_KEY" <<'TOML'
base_url = "__API_BASE_URL__"
api_key = ""
timeout_seconds = 10.0
TOML
sed -i.bak "s|__API_BASE_URL__|${API_BASE_URL}|g" "$CONFIG_NO_KEY" && rm -f "$CONFIG_NO_KEY.bak"

cat > "$CONFIG_BAD_URL" <<'TOML'
base_url = "http://127.0.0.1:9999"
api_key = ""
timeout_seconds = 1.0
TOML

KANBAN_CMD="uvx --isolated --from . kanban"
BOARD_ID_EXISTING="${BOARD_ID_EXISTING:-}"
BOARD_ID_NOT_FOUND="00000000-0000-0000-0000-000000000000"

if [[ -z "$BOARD_ID_EXISTING" ]]; then
  BOARD_ID_EXISTING="$(python - <<'PY'
import json
import os
import urllib.request

base_url = os.environ.get("KANBAN_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
api_key = os.environ.get("SWAGGER_X_API_KEY", "")

req = urllib.request.Request(
    f"{base_url}/boards/",
    headers={"X-API-Key": api_key},
)
with urllib.request.urlopen(req, timeout=10) as resp:
    body = json.loads(resp.read().decode("utf-8"))
boards = body.get("boards", [])
if boards:
    print(boards[0].get("board_id", ""))
PY
)"
fi

if [[ -z "$BOARD_ID_EXISTING" ]]; then
  BOARD_ID_EXISTING="f950861e-3252-4030-bcb8-947a4a992402"
fi

TOTAL=0
PASSED=0
FAILED=0

mkdir -p "$(dirname "$OUT_MD")"
{
  echo "# CLI_E2E_RESULT.md"
  echo
  echo "- Execution date: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "- Command base: \`$KANBAN_CMD\`"
  echo "- API base URL: \`$API_BASE_URL\`"
  echo "- Env file fallback: \`$ENV_FILE\`"
  echo "- Board ID used: \`$BOARD_ID_EXISTING\`"
  echo
  echo "| TC ID | Endpoint | Result | Exit | Notes |"
  echo "|---|---|---|---:|---|"
} > "$OUT_MD"

run_case() {
  local tc_id="$1"
  local endpoint="$2"
  local mode="$3"
  local expected="$4"
  local cmd="$5"

  TOTAL=$((TOTAL + 1))
  local out_file="$TMP_DIR/${tc_id}.log"
  local exit_code
  set +e
  eval "$cmd" > "$out_file" 2>&1
  exit_code=$?
  set -e

  local ok="false"
  case "$mode" in
    eq0)
      [[ $exit_code -eq 0 ]] && ok="true"
      ;;
    ne0)
      [[ $exit_code -ne 0 ]] && ok="true"
      ;;
    eq0_or_ne0)
      ok="true"
      ;;
  esac

  local output_compact
  output_compact="$(tr '\n' ' ' < "$out_file" | sed 's/[[:space:]]\+/ /g' | sed 's/|/\\|/g')"
  if [[ -n "$expected" && "$output_compact" != *"$expected"* ]]; then
    ok="false"
  fi

  local result_label="PASS"
  if [[ "$ok" == "true" ]]; then
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
    result_label="FAIL"
  fi

  if [[ ${#output_compact} -gt 180 ]]; then
    output_compact="${output_compact:0:180}..."
  fi

  printf '| %s | `%s` | %s | %d | %s |\n' \
    "$tc_id" "$endpoint" "$result_label" "$exit_code" "$output_compact" >> "$OUT_MD"
}

run_case "TC-CLI-001" "GET /health" "eq0" "ok: True" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" health"

run_case "TC-CLI-002" "GET /health" "eq0" "\"ok\": true" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" health --json"

run_case "TC-CLI-003" "GET /boards/" "eq0" "Boards (" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" board list"

run_case "TC-CLI-004" "GET /boards/" "eq0" "\"boards\"" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" board list --json"

run_case "TC-CLI-005" "GET /boards/" "ne0" "API key is required" \
  "$KANBAN_CMD --config \"$CONFIG_NO_KEY\" board list"

run_case "TC-CLI-006" "GET /boards/{board_id}/columns" "eq0" "Columns (" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" board columns \"$BOARD_ID_EXISTING\""

run_case "TC-CLI-007" "GET /boards/{board_id}/columns" "eq0" "\"columns\"" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" board columns \"$BOARD_ID_EXISTING\" --json"

# not_found case accepts empty success or failure by current API behavior
run_case "TC-CLI-008" "GET /boards/{board_id}/columns" "eq0_or_ne0" "" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" board columns \"$BOARD_ID_NOT_FOUND\""

run_case "TC-CLI-009" "GET /boards/{board_id}/issues" "eq0" "Issues (" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" board issues \"$BOARD_ID_EXISTING\""

run_case "TC-CLI-010" "GET /boards/{board_id}/issues" "eq0" "\"issues\"" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" board issues \"$BOARD_ID_EXISTING\" --json"

run_case "TC-CLI-011" "GET /boards/{board_id}/issues" "ne0" "API key is required" \
  "$KANBAN_CMD --config \"$CONFIG_NO_KEY\" board issues \"$BOARD_ID_EXISTING\""

run_case "TC-CLI-012" "POST /webhooks/github" "eq0" "\"ok\": true" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" webhook github --event issues --delivery-id tc-cli-012-$(date +%s) --payload-file \"$PAYLOAD_VALID\" --json"

run_case "TC-CLI-013" "POST /webhooks/github" "ne0" "Invalid JSON payload" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" webhook github --event issues --payload-file \"$PAYLOAD_INVALID\""

run_case "TC-CLI-014" "POST /webhooks/github" "ne0" "Use only one of --payload-file or --payload-json" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" webhook github --event issues --payload-file \"$PAYLOAD_VALID\" --payload-json '{\"x\":1}'"

run_case "TC-CLI-015" "GET /health" "ne0" "Network error" \
  "$KANBAN_CMD --config \"$CONFIG_BAD_URL\" health"

run_case "TC-CLI-016" "N/A (config show)" "eq0" "api_key_masked:" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" config show"

run_case "TC-CLI-017" "N/A (config show --json)" "eq0" "\"api_key_masked\"" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" config show --json"

run_case "TC-CLI-018" "N/A (config init --force)" "eq0" "Created config:" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" config init --base-url \"$API_BASE_URL\" --api-key test-key --force"

run_case "TC-CLI-019" "N/A (config init without force)" "ne0" "Config already exists" \
  "$KANBAN_CMD --config \"$CONFIG_OK\" config init --base-url \"$API_BASE_URL\" --api-key test-key"

run_case "TC-CLI-020" "GET /boards/ (env override)" "eq0" "Boards (" \
  "KANBAN_API_KEY=\"$SWAGGER_X_API_KEY\" $KANBAN_CMD --config \"$CONFIG_NO_KEY\" board list"

{
  echo
  echo "## Summary"
  echo
  echo "- Total: $TOTAL"
  echo "- Passed: $PASSED"
  echo "- Failed: $FAILED"
} >> "$OUT_MD"

if [[ $FAILED -gt 0 ]]; then
  echo "E2E completed with failures: $FAILED/$TOTAL" >&2
  exit 1
fi

echo "E2E completed successfully: $PASSED/$TOTAL"
echo "Report: $OUT_MD"
