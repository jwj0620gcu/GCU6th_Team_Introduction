# TEST_CASE.md

## 1. 문서 목적

본 문서는 [PRD.md](/Users/jungwonjun/database_cocone_team/docs/PRD.md) 기준으로
Team Kanban Backend POC의 API 테스트 케이스를 정의합니다.

형식 원칙:

- Test Cases 형식
- 성공/실패 케이스 포함
- 각 케이스에 endpoint, request, expected response 포함
- 체크리스트 형태

---

## 2. 공통 사전 조건

- API 서버가 로컬에서 실행 중이어야 함: `http://127.0.0.1:8000`
- 테스트용 데이터 준비:
  - `BOARD_ID_EXISTING`
  - `BOARD_ID_NOT_FOUND`
  - `ISSUE_ID_EXISTING`
  - `ISSUE_ID_NOT_FOUND`
  - `COMMENT_ID_EXISTING`
  - `COMMENT_ID_NOT_FOUND`
  - `LABEL_ID_EXISTING`
  - `LABEL_ID_NOT_FOUND`
- 웹훅 테스트 시 `GITHUB_WEBHOOK_SECRET` 설정

---

## 3. Test Cases Checklist

- [ ] TC-001 (FR-01, 성공)
  Endpoint: `GET /health`
  Request: `curl -X GET http://127.0.0.1:8000/health`
  Expected Response: `200`, body `{"ok": true}`

- [ ] TC-002 (FR-01, 실패)
  Endpoint: `POST /health`
  Request: `curl -X POST http://127.0.0.1:8000/health`
  Expected Response: `405`, body에 `detail` 포함

- [ ] TC-003 (FR-02, 성공)
  Endpoint: `GET /boards`
  Request: `curl -X GET http://127.0.0.1:8000/boards`
  Expected Response: `200`, body는 보드 배열(JSON)

- [ ] TC-004 (FR-02, 실패)
  Endpoint: `POST /boards`
  Request: `curl -X POST http://127.0.0.1:8000/boards`
  Expected Response: `405`, body에 `detail` 포함

- [ ] TC-005 (FR-03, 성공)
  Endpoint: `GET /boards/{board_id}/columns`
  Request: `curl -X GET http://127.0.0.1:8000/boards/${BOARD_ID_EXISTING}/columns`
  Expected Response: `200`, body는 `position` 기준 정렬된 컬럼 배열

- [ ] TC-006 (FR-03, 실패)
  Endpoint: `GET /boards/{board_id}/columns`
  Request: `curl -X GET http://127.0.0.1:8000/boards/${BOARD_ID_NOT_FOUND}/columns`
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-007 (FR-04, 성공)
  Endpoint: `GET /boards/{board_id}/issues`
  Request: `curl -X GET http://127.0.0.1:8000/boards/${BOARD_ID_EXISTING}/issues`
  Expected Response: `200`, body는 이슈 배열(assignee, column 포함)

- [ ] TC-008 (FR-04, 실패)
  Endpoint: `GET /boards/{board_id}/issues`
  Request: `curl -X GET http://127.0.0.1:8000/boards/${BOARD_ID_NOT_FOUND}/issues`
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-009 (FR-05, 성공)
  Endpoint: `POST /issues`
  Request:
  ```json
  {
    "board_id": "BOARD_ID_EXISTING",
    "title": "POC 테스트 이슈",
    "status": "todo",
    "column_id": "COLUMN_ID_EXISTING"
  }
  ```
  Expected Response: `201`, body에 생성된 `issue_id` 포함

- [ ] TC-010 (FR-05, 실패)
  Endpoint: `POST /issues`
  Request:
  ```json
  {
    "board_id": "BOARD_ID_EXISTING",
    "status": "todo"
  }
  ```
  Expected Response: `422`, body에 유효성 검증 오류(`detail`) 포함

- [ ] TC-011 (FR-05, 실패)
  Endpoint: `POST /issues`
  Request:
  ```json
  {
    "board_id": "BOARD_ID_NOT_FOUND",
    "title": "잘못된 보드",
    "status": "todo"
  }
  ```
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-012 (FR-06, 성공)
  Endpoint: `PATCH /issues/{issue_id}`
  Request:
  ```json
  {
    "title": "수정된 제목",
    "status": "in_progress",
    "column_id": "COLUMN_ID_IN_PROGRESS",
    "user_id": "USER_ID_EXISTING"
  }
  ```
  Expected Response: `200`, body에 수정 결과 반영

- [ ] TC-013 (FR-06, 실패)
  Endpoint: `PATCH /issues/{issue_id}`
  Request:
  ```json
  {
    "status": "done"
  }
  ```
  Expected Response: `404` (issue 미존재), body에 `detail` 포함

- [ ] TC-014 (FR-06, 실패)
  Endpoint: `PATCH /issues/{issue_id}`
  Request:
  ```json
  {
    "status": "not_a_valid_status"
  }
  ```
  Expected Response: `422`, body에 유효성 검증 오류(`detail`) 포함

- [ ] TC-015 (FR-07, 성공)
  Endpoint: `DELETE /issues/{issue_id}`
  Request: `curl -X DELETE http://127.0.0.1:8000/issues/${ISSUE_ID_EXISTING}`
  Expected Response: `204`, body 없음

- [ ] TC-016 (FR-07, 실패)
  Endpoint: `DELETE /issues/{issue_id}`
  Request: `curl -X DELETE http://127.0.0.1:8000/issues/${ISSUE_ID_NOT_FOUND}`
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-017 (FR-08, 성공)
  Endpoint: `GET /issues/{issue_id}/comments`
  Request: `curl -X GET http://127.0.0.1:8000/issues/${ISSUE_ID_EXISTING}/comments`
  Expected Response: `200`, body는 코멘트 배열

- [ ] TC-018 (FR-08, 실패)
  Endpoint: `GET /issues/{issue_id}/comments`
  Request: `curl -X GET http://127.0.0.1:8000/issues/${ISSUE_ID_NOT_FOUND}/comments`
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-019 (FR-08, 성공)
  Endpoint: `POST /issues/{issue_id}/comments`
  Request:
  ```json
  {
    "user_id": "USER_ID_EXISTING",
    "content": "코멘트 테스트"
  }
  ```
  Expected Response: `201`, body에 `comment_id` 포함

- [ ] TC-020 (FR-08, 실패)
  Endpoint: `POST /issues/{issue_id}/comments`
  Request:
  ```json
  {
    "user_id": "USER_ID_EXISTING",
    "content": ""
  }
  ```
  Expected Response: `422`, body에 유효성 검증 오류(`detail`) 포함

- [ ] TC-021 (FR-08, 성공)
  Endpoint: `DELETE /comments/{comment_id}`
  Request: `curl -X DELETE http://127.0.0.1:8000/comments/${COMMENT_ID_EXISTING}`
  Expected Response: `204`, body 없음

- [ ] TC-022 (FR-08, 실패)
  Endpoint: `DELETE /comments/{comment_id}`
  Request: `curl -X DELETE http://127.0.0.1:8000/comments/${COMMENT_ID_NOT_FOUND}`
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-023 (FR-09, 성공)
  Endpoint: `GET /boards/{board_id}/labels`
  Request: `curl -X GET http://127.0.0.1:8000/boards/${BOARD_ID_EXISTING}/labels`
  Expected Response: `200`, body는 라벨 배열

- [ ] TC-024 (FR-09, 실패)
  Endpoint: `GET /boards/{board_id}/labels`
  Request: `curl -X GET http://127.0.0.1:8000/boards/${BOARD_ID_NOT_FOUND}/labels`
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-025 (FR-09, 성공)
  Endpoint: `POST /boards/{board_id}/labels`
  Request:
  ```json
  {
    "name": "backend",
    "color": "1d76db"
  }
  ```
  Expected Response: `201`, body에 `label_id` 포함

- [ ] TC-026 (FR-09, 실패)
  Endpoint: `POST /boards/{board_id}/labels`
  Request:
  ```json
  {
    "name": "backend",
    "color": "1d76db"
  }
  ```
  Expected Response: `409` (중복 라벨), body에 `detail` 포함

- [ ] TC-027 (FR-09, 성공)
  Endpoint: `POST /issues/{issue_id}/labels/{label_id}`
  Request: `curl -X POST http://127.0.0.1:8000/issues/${ISSUE_ID_EXISTING}/labels/${LABEL_ID_EXISTING}`
  Expected Response: `200`, body에 연결 결과 포함

- [ ] TC-028 (FR-09, 실패)
  Endpoint: `POST /issues/{issue_id}/labels/{label_id}`
  Request: `curl -X POST http://127.0.0.1:8000/issues/${ISSUE_ID_NOT_FOUND}/labels/${LABEL_ID_EXISTING}`
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-029 (FR-09, 성공)
  Endpoint: `DELETE /issues/{issue_id}/labels/{label_id}`
  Request: `curl -X DELETE http://127.0.0.1:8000/issues/${ISSUE_ID_EXISTING}/labels/${LABEL_ID_EXISTING}`
  Expected Response: `204`, body 없음

- [ ] TC-030 (FR-09, 실패)
  Endpoint: `DELETE /issues/{issue_id}/labels/{label_id}`
  Request: `curl -X DELETE http://127.0.0.1:8000/issues/${ISSUE_ID_EXISTING}/labels/${LABEL_ID_NOT_FOUND}`
  Expected Response: `404`, body에 `detail` 포함

- [ ] TC-031 (FR-10, 성공)
  Endpoint: `POST /webhooks/github`
  Request: 유효한 `X-Hub-Signature-256` + 유효 JSON payload
  Expected Response: `200`, body `{"ok": true, "result": ...}`

- [ ] TC-032 (FR-10, 실패)
  Endpoint: `POST /webhooks/github`
  Request: 잘못된 `X-Hub-Signature-256`
  Expected Response: `401`, body에 `detail` 포함

- [ ] TC-033 (FR-10, 실패)
  Endpoint: `POST /webhooks/github`
  Request: 서명은 유효하지만 payload가 JSON 파싱 불가
  Expected Response: `400`, body에 `detail` 포함

- [ ] TC-034 (FR-10, 성공-멱등)
  Endpoint: `POST /webhooks/github`
  Request: 동일 `X-GitHub-Delivery`를 재전송
  Expected Response: `200`, body의 result가 중복 처리 상태(`duplicate`)를 반환

- [ ] TC-035 (FR-11, 성공)
  Endpoint: `GET /docs`
  Request: `curl -X GET http://127.0.0.1:8000/docs`
  Expected Response: `200`, Swagger UI HTML 응답

- [ ] TC-036 (FR-11, 성공)
  Endpoint: `GET /openapi.json`
  Request: `curl -X GET http://127.0.0.1:8000/openapi.json`
  Expected Response: `200`, body에 주요 path(`/health`, `/boards`) 포함

- [ ] TC-037 (FR-11, 실패)
  Endpoint: `GET /docz`
  Request: `curl -X GET http://127.0.0.1:8000/docz`
  Expected Response: `404`, body에 `detail` 포함

---

## 4. 실행 결과 기록 템플릿

- [ ] 실행 일시:
- [ ] 실행자:
- [ ] 대상 브랜치/커밋:
- [ ] 통과 케이스 수:
- [ ] 실패 케이스 수:
- [ ] 주요 실패 원인:
- [ ] 조치 내용:

