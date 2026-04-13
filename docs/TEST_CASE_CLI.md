# TEST_CASE_CLI.md

## 1. 문서 목적

본 문서는 `kanban` CLI의 테스트 케이스를 정의합니다.

형식 원칙:

- Test Cases 형식
- 성공/실패 케이스 포함
- 각 케이스에 endpoint, request, expected response 포함
- 체크리스트 형태

---

## 2. 공통 사전 조건

- API 서버 실행: `http://127.0.0.1:8000`
- CLI 실행 방식: `uvx --from . kanban`
- 테스트용 설정 파일:
  - `CONFIG_OK` (유효 `base_url`, 유효 `api_key`)
  - `CONFIG_NO_KEY` (유효 `base_url`, 빈 `api_key`)
  - `CONFIG_BAD_URL` (잘못된 `base_url`)
- 테스트용 보드 ID:
  - `BOARD_ID_EXISTING=f950861e-3252-4030-bcb8-947a4a992402`
  - `BOARD_ID_NOT_FOUND=00000000-0000-0000-0000-000000000000`

---

## 3. Test Cases Checklist

- [ ] TC-CLI-001 (성공)
  Endpoint: `GET /health`
  Request: `uvx --from . kanban --config ${CONFIG_OK} health`
  Expected Response: 종료코드 `0`, text 출력에 `ok: True`

- [ ] TC-CLI-002 (성공)
  Endpoint: `GET /health`
  Request: `uvx --from . kanban --config ${CONFIG_OK} health --json`
  Expected Response: 종료코드 `0`, JSON 출력 `{"ok": true}`

- [ ] TC-CLI-003 (성공)
  Endpoint: `GET /boards/`
  Request: `uvx --from . kanban --config ${CONFIG_OK} board list`
  Expected Response: 종료코드 `0`, 보드 목록 text 출력

- [ ] TC-CLI-004 (성공)
  Endpoint: `GET /boards/`
  Request: `uvx --from . kanban --config ${CONFIG_OK} board list --json`
  Expected Response: 종료코드 `0`, JSON 응답에 `boards` 키 포함

- [ ] TC-CLI-005 (실패)
  Endpoint: `GET /boards/`
  Request: `uvx --from . kanban --config ${CONFIG_NO_KEY} board list`
  Expected Response: 종료코드 `!=0`, `API key is required` 메시지 출력

- [ ] TC-CLI-006 (성공)
  Endpoint: `GET /boards/{board_id}/columns`
  Request: `uvx --from . kanban --config ${CONFIG_OK} board columns ${BOARD_ID_EXISTING}`
  Expected Response: 종료코드 `0`, 컬럼 목록 text 출력

- [ ] TC-CLI-007 (성공)
  Endpoint: `GET /boards/{board_id}/columns`
  Request: `uvx --from . kanban --config ${CONFIG_OK} board columns ${BOARD_ID_EXISTING} --json`
  Expected Response: 종료코드 `0`, JSON 응답에 `columns` 키 포함

- [ ] TC-CLI-008 (실패)
  Endpoint: `GET /boards/{board_id}/columns`
  Request: `uvx --from . kanban --config ${CONFIG_OK} board columns ${BOARD_ID_NOT_FOUND}`
  Expected Response: 종료코드 `!=0` 또는 빈 결과 처리(현재 API 동작 기준), 오류/결과가 일관되게 출력

- [ ] TC-CLI-009 (성공)
  Endpoint: `GET /boards/{board_id}/issues`
  Request: `uvx --from . kanban --config ${CONFIG_OK} board issues ${BOARD_ID_EXISTING}`
  Expected Response: 종료코드 `0`, 이슈 목록 text 출력

- [ ] TC-CLI-010 (성공)
  Endpoint: `GET /boards/{board_id}/issues`
  Request: `uvx --from . kanban --config ${CONFIG_OK} board issues ${BOARD_ID_EXISTING} --json`
  Expected Response: 종료코드 `0`, JSON 응답에 `issues` 키 포함

- [ ] TC-CLI-011 (실패)
  Endpoint: `GET /boards/{board_id}/issues`
  Request: `uvx --from . kanban --config ${CONFIG_NO_KEY} board issues ${BOARD_ID_EXISTING}`
  Expected Response: 종료코드 `!=0`, `API key is required` 메시지 출력

- [ ] TC-CLI-012 (성공)
  Endpoint: `POST /webhooks/github`
  Request: `uvx --from . kanban --config ${CONFIG_OK} webhook github --event issues --delivery-id tc-cli-012 --payload-file ./payload.json --json`
  Expected Response: 종료코드 `0`, JSON 응답에 `ok: true` 포함

- [ ] TC-CLI-013 (실패)
  Endpoint: `POST /webhooks/github`
  Request: `uvx --from . kanban --config ${CONFIG_OK} webhook github --event issues --payload-file ./invalid.json`
  Expected Response: 종료코드 `!=0`, `Invalid JSON payload` 메시지 출력

- [ ] TC-CLI-014 (실패)
  Endpoint: `POST /webhooks/github`
  Request: `uvx --from . kanban --config ${CONFIG_OK} webhook github --event issues --payload-file ./payload.json --payload-json '{"x":1}'`
  Expected Response: 종료코드 `!=0`, `Use only one of --payload-file or --payload-json` 메시지 출력

- [ ] TC-CLI-015 (실패)
  Endpoint: `GET /health`
  Request: `uvx --from . kanban --config ${CONFIG_BAD_URL} health`
  Expected Response: 종료코드 `!=0`, `Network error` 메시지 출력

- [ ] TC-CLI-016 (성공)
  Endpoint: `N/A (config command)`
  Request: `uvx --from . kanban --config ${CONFIG_OK} config show`
  Expected Response: 종료코드 `0`, `api_key_masked`가 마스킹 형태로 출력

- [ ] TC-CLI-017 (성공)
  Endpoint: `N/A (config command)`
  Request: `uvx --from . kanban --config ${CONFIG_OK} config show --json`
  Expected Response: 종료코드 `0`, JSON 출력에 `base_url`, `api_key_masked`, `timeout_seconds` 포함

- [ ] TC-CLI-018 (성공)
  Endpoint: `N/A (config command)`
  Request: `uvx --from . kanban --config ${CONFIG_OK} config init --base-url http://127.0.0.1:8000 --api-key test-key --force`
  Expected Response: 종료코드 `0`, `Created config:` 메시지 출력

- [ ] TC-CLI-019 (실패)
  Endpoint: `N/A (config command)`
  Request: `uvx --from . kanban --config ${CONFIG_OK} config init --base-url http://127.0.0.1:8000 --api-key test-key`
  Expected Response: 종료코드 `!=0`, 기존 파일 존재 시 overwrite 거부 메시지 출력

- [ ] TC-CLI-020 (성공)
  Endpoint: `GET /boards/`
  Request: `KANBAN_API_KEY=<valid_key> uvx --from . kanban --config ${CONFIG_NO_KEY} board list`
  Expected Response: 종료코드 `0`, 환경변수 override로 조회 성공

---

## 4. 실행 결과 기록 템플릿

- [ ] 실행 일시:
- [ ] 실행자:
- [ ] 대상 브랜치/커밋:
- [ ] 통과 케이스 수:
- [ ] 실패 케이스 수:
- [ ] 주요 실패 원인:
- [ ] 조치 내용:
