# CLI_E2E_RESULT.md

- Execution date: 2026-04-12 20:36:17 KST
- Command base: `uvx --isolated --from . kanban`
- API base URL: `http://127.0.0.1:8000`
- Env file fallback: `/Users/jungwonjun/database_cocone_team/.sync.env`
- Board ID used: `f950861e-3252-4030-bcb8-947a4a992402`

| TC ID | Endpoint | Result | Exit | Notes |
|---|---|---|---:|---|
| TC-CLI-001 | `GET /health` | PASS | 0 | ok: True  |
| TC-CLI-002 | `GET /health` | PASS | 0 | {   "ok": true }  |
| TC-CLI-003 | `GET /boards/` | PASS | 0 | Boards (1): - AI와 스타트업 팀_소개: f950861e-3252-4030-bcb8-947a4a992402  |
| TC-CLI-004 | `GET /boards/` | PASS | 0 | {   "boards": [     {       "board_id": "f950861e-3252-4030-bcb8-947a4a992402",       "name": "AI와 스타트업 팀_소개",       "github_project_url": "https://github.com/users/jwj0620gcu/proj... |
| TC-CLI-005 | `GET /boards/` | PASS | 1 | API key is required for this command. Set api_key in config file or KANBAN_API_KEY.  |
| TC-CLI-006 | `GET /boards/{board_id}/columns` | PASS | 0 | Columns (5): - [0] Backlog: d259070b-9672-4060-997b-df562d96b373 - [1] Ready: 60acfe80-24d1-429b-8bab-a821832a4716 - [2] In progress: 900d26a2-e80b-4608-99f6-5f3e7dc006ab - [3] In ... |
| TC-CLI-007 | `GET /boards/{board_id}/columns` | PASS | 0 | {   "columns": [     {       "column_id": "d259070b-9672-4060-997b-df562d96b373",       "board_id": "f950861e-3252-4030-bcb8-947a4a992402",       "name": "Backlog",       "position... |
| TC-CLI-008 | `GET /boards/{board_id}/columns` | PASS | 0 | No columns found.  |
| TC-CLI-009 | `GET /boards/{board_id}/issues` | PASS | 0 | Issues (22): - #13 [closed] [docs] 배포 및 Readme 정리 (3840d1d2-4d60-4683-8eec-7ef20d3c2100) - #5 [closed] [fix] 브랜치 병합 과정 수정 (43a93597-b3fa-4024-b349-50214d399b51) - #4 [closed] [Feat... |
| TC-CLI-010 | `GET /boards/{board_id}/issues` | PASS | 0 | {   "issues": [     {       "issue_id": "3840d1d2-4d60-4683-8eec-7ef20d3c2100",       "board_id": "f950861e-3252-4030-bcb8-947a4a992402",       "column_id": "aeb44dd5-ea75-42ba-a0d... |
| TC-CLI-011 | `GET /boards/{board_id}/issues` | PASS | 1 | API key is required for this command. Set api_key in config file or KANBAN_API_KEY.  |
| TC-CLI-012 | `POST /webhooks/github` | PASS | 0 | {   "ok": true,   "result": {     "event": "issues",     "action": "opened",     "status": "processed"   } }  |
| TC-CLI-013 | `POST /webhooks/github` | PASS | 1 | Invalid JSON payload: Expecting property name enclosed in double quotes: line 1 column 3 (char 2)  |
| TC-CLI-014 | `POST /webhooks/github` | PASS | 1 | Use only one of --payload-file or --payload-json.  |
| TC-CLI-015 | `GET /health` | PASS | 1 | Network error: [Errno 61] Connection refused  |
| TC-CLI-016 | `N/A (config show)` | PASS | 0 | config_path: /var/folders/bw/_5lts_8103s05ls4jypmh2880000gn/T/tmp.Q4GcLAbzXq/config_ok.toml base_url: http://127.0.0.1:8000 api_key_masked: bFbg...Gjn0 timeout_seconds: 10.0  |
| TC-CLI-017 | `N/A (config show --json)` | PASS | 0 | {   "base_url": "http://127.0.0.1:8000",   "api_key_masked": "bFbg...Gjn0",   "timeout_seconds": 10.0,   "config_path": "/var/folders/bw/_5lts_8103s05ls4jypmh2880000gn/T/tmp.Q4GcLA... |
| TC-CLI-018 | `N/A (config init --force)` | PASS | 0 | Created config: /var/folders/bw/_5lts_8103s05ls4jypmh2880000gn/T/tmp.Q4GcLAbzXq/config_ok.toml  |
| TC-CLI-019 | `N/A (config init without force)` | PASS | 1 | Config already exists: /var/folders/bw/_5lts_8103s05ls4jypmh2880000gn/T/tmp.Q4GcLAbzXq/config_ok.toml. Use --force to overwrite.  |
| TC-CLI-020 | `GET /boards/ (env override)` | PASS | 0 | Boards (1): - AI와 스타트업 팀_소개: f950861e-3252-4030-bcb8-947a4a992402  |

## Summary

- Total: 20
- Passed: 20
- Failed: 0
