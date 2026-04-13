# kanban-sync skill

목적: Codex/claude 작업을 팀 칸반보드 이슈로 자동 등록/갱신해 공유 가능한 작업 이력을 남긴다.

## 언제 사용하나

- 작업 시작 시 이슈를 자동 생성하고 싶을 때
- 작업 상태(진행/완료/실패)를 CLI로 업데이트할 때
- 같은 작업을 중복 생성하지 않고 추적하고 싶을 때

## 사용 파일

- `scripts/kanban_task_start.sh`
- `scripts/kanban_task_update.sh`
- `scripts/kanban_task_done.sh`
- `scripts/kanban_task_fail.sh`
- 상태파일: `.claude/kanban-state.json`

## 필수 조건

1. 백엔드 서버 실행: `uvicorn app.main:app --reload --port 8000`
2. `.sync.env`에 API 키 포함 (`SWAGGER_X_API_KEY`)
3. `uvx` 사용 가능

## 기본 워크플로우

1. 작업 시작
```bash
scripts/kanban_task_start.sh \
  --task-key "repo:main:add-issues-crud" \
  --title "Add /issues CRUD API" \
  --body "Implement POST/PATCH/DELETE /issues and verify via CLI"
```

2. 진행 중 상태 갱신
```bash
scripts/kanban_task_update.sh \
  --task-key "repo:main:add-issues-crud" \
  --status open \
  --column-id "$KANBAN_COLUMN_IN_PROGRESS_ID" \
  --body "Router added, testing in progress"
```

3. 완료 처리
```bash
scripts/kanban_task_done.sh \
  --task-key "repo:main:add-issues-crud" \
  --summary "Implemented and validated with curl + CLI"
```

4. 실패 처리
```bash
scripts/kanban_task_fail.sh \
  --task-key "repo:main:add-issues-crud" \
  --reason "DB constraint mismatch, needs schema alignment"
```

## 규칙

1. `task_key`는 작업 단위에서 유일해야 한다. (idempotency key)
2. 시작 스크립트는 같은 `task_key`가 이미 있으면 새 이슈를 만들지 않는다.
3. 완료/실패 처리 전에는 반드시 `task_key`로 연결된 이슈가 있어야 한다.
4. 코덱스가 큰 작업을 수행할 때는 최소 시작/완료 두 단계는 반드시 기록한다.

## 환경변수 (선택)

- `KANBAN_BOARD_ID`: 기본 보드 고정
- `KANBAN_COLUMN_BACKLOG_ID`, `KANBAN_COLUMN_READY_ID`, `KANBAN_COLUMN_DONE_ID`
- `KANBAN_START_STATUS`, `KANBAN_DONE_STATUS`, `KANBAN_FAIL_STATUS`
- `KANBAN_CONFIG`, `KANBAN_BASE_URL`, `KANBAN_API_KEY`
