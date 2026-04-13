# TDD_CLI_PLAN.md

## 1. 목적

본 계획은 아래 문서를 기준으로 `kanban` CLI를 TDD 방식으로 구현/확장하기 위한 실행 계획입니다.

- 요구사항: [PRD_CLI.md](/Users/jungwonjun/database_cocone_team/docs/PRD_CLI.md)
- 기술 명세: [TSD_CLI.md](/Users/jungwonjun/database_cocone_team/docs/TSD_CLI.md)
- 테스트 기준: [TEST_CASE_CLI.md](/Users/jungwonjun/database_cocone_team/docs/TEST_CASE_CLI.md)

---

## 2. TDD 원칙

1. 실패하는 테스트(Red)를 먼저 작성한다.
2. 테스트를 통과하는 최소 코드(Green)를 구현한다.
3. 중복 제거/가독성 개선(Refactor)을 수행한다.
4. 모든 변경은 테스트가 통과한 상태로 마무리한다.

---

## 3. 구현 범위 (현재 OpenAPI 전체)

1. `GET /health` -> `kanban health`
2. `GET /boards/` -> `kanban board list`
3. `GET /boards/{board_id}/columns` -> `kanban board columns <board_id>`
4. `GET /boards/{board_id}/issues` -> `kanban board issues <board_id>`
5. `POST /webhooks/github` -> `kanban webhook github ...`

---

## 4. 단계별 계획

### Phase 1: Core CLI 안정화 (진행 중)

- 목표:
  - 필수 명령 정상 동작
  - 에러 처리 일관화 (HTTP/네트워크/입력 오류)
  - 설정파일 기반 실행 보장
- Red:
  - `board list` API 키 누락 실패 케이스
  - `board list` 네트워크 오류 메시지 케이스
  - `webhook github` payload 파일 누락 케이스
- Green:
  - 사용자 친화 오류 메시지 + exit code `1` 통일
  - board 계열 공통 호출 에러 핸들러 적용
  - payload 파일 예외 처리 보강
- Refactor:
  - 중복된 board 에러 처리 로직 공통화

### Phase 2: 테스트 케이스 확장

- 목표:
  - `TEST_CASE_CLI.md`의 주요 케이스를 자동화 테스트로 확장
- 대상:
  - text/json 출력 검증
  - config init/show 동작
  - 환경변수 override (`KANBAN_API_KEY`, `KANBAN_BASE_URL`)
  - webhook payload 옵션 충돌 케이스

### Phase 3: 회귀 방지 및 CI 연계

- 목표:
  - CLI 회귀를 PR 단계에서 자동 차단
- 작업:
  - `tests/test_cli.py`를 CI 테스트 스위트에 포함
  - OpenAPI 변경 시 CLI 매핑 점검 체크 추가

---

## 5. 현재 진행 결과 (이번 사이클)

1. Red 테스트 추가: `tests/test_cli.py`
2. Green 구현 완료:
  - API 키 누락 사용자 메시지 처리
  - board 계열 네트워크 오류 처리
  - webhook payload 파일 누락 처리
3. 검증:
  - `uv run --with pytest -m pytest -q tests/test_cli.py` -> `5 passed`
  - `uvx --isolated --from . kanban ...` 실동작 확인

---

## 6. 다음 구현 우선순위

1. `TEST_CASE_CLI.md`의 나머지 케이스를 자동화 테스트로 추가
2. OpenAPI 스키마 변경 감지 시 CLI 매핑 누락 검사 도입
3. 출력 포맷(text) 가독성 개선(열 정렬/요약 표기)
