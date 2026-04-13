# PRD_CLI.md

## 1. 문서 정보

- 제품명: `kanban` CLI (Kanban Backend CLI)
- 문서 버전: v1.0 (POC)
- 문서 목적: 비개발자도 사용할 수 있는 명령형 CLI 요구사항 정의

---

## 2. 배경과 문제 정의

현재 백엔드 API는 Swagger로 사용 가능하지만, 반복 업무(조회/웹훅 테스트/자동화)에는 CLI가 더 효율적입니다.  
또한 환경별 접속 주소가 달라질 수 있어, 고정 URL이 아닌 설정 기반 CLI가 필요합니다.

---

## 3. 목표

1. Mac 환경에서 설치 부담 없이 `uvx`로 실행 가능해야 한다.
2. 비대화형(인자/옵션 기반)으로 자동화 가능한 CLI를 제공해야 한다.
3. OpenAPI(`/openapi.json`)의 전체 엔드포인트를 1:1로 CLI 명령에 매핑해야 한다.
4. 사람이 읽기 쉬운 출력과 JSON 출력을 모두 지원해야 한다.

---

## 4. 비목표 (POC 범위 밖)

1. 대화형 프롬프트 기반 모드(REPL/interactive shell)
2. GUI/TUI
3. 멀티프로파일 계정 전환 UI
4. 원격 배포/업데이트 자동화

---

## 5. 타깃 사용자

- 1차: 비개발자 팀원(기본 명령 실행/결과 확인)
- 2차: 개발자(스크립트 자동화, QA, 운영 점검)
- OS: macOS (우선 지원)

---

## 6. 핵심 사용자 시나리오

1. 사용자가 서버 상태를 확인한다 (`health`).
2. 사용자가 보드/컬럼/이슈를 조회한다 (`boards ...`).
3. 사용자가 웹훅 테스트 이벤트를 전송한다 (`webhooks github`).
4. 사용자가 환경별 설정파일을 바꿔 로컬/다른 서버를 전환한다.
5. 사용자가 `--json`으로 파이프라인 자동화(JSON 파싱)한다.

---

## 7. 기능 요구사항

| ID | 요구사항 | 우선순위 | 완료 기준 |
|---|---|---|---|
| FR-CLI-01 | CLI 이름은 `kanban`을 사용한다. | Must | `uvx --from . kanban --help` 동작 |
| FR-CLI-02 | CLI는 `Typer` 기반으로 구현한다. | Must | Typer 명령/옵션 구조 제공 |
| FR-CLI-03 | CLI는 비대화형 모드만 지원한다. | Must | 모든 입력은 인자/옵션으로 처리 |
| FR-CLI-04 | 접속주소는 설정파일 기반으로 변경 가능해야 한다. | Must | 설정파일의 `base_url`로 호출 |
| FR-CLI-05 | 기본 출력은 사람이 읽기 쉬운 text 형식이다. | Must | 표준 text 출력 제공 |
| FR-CLI-06 | `--json` 옵션으로 raw JSON 출력이 가능해야 한다. | Must | JSON pretty print 출력 |
| FR-CLI-07 | API 키 필요 명령은 설정파일/환경변수 키를 사용한다. | Must | `board` 계열 호출 성공 |
| FR-CLI-08 | OpenAPI 전체 엔드포인트를 CLI 명령으로 제공한다. | Must | 아래 매핑 전부 지원 |
| FR-CLI-09 | 실패 시 이해 가능한 에러와 비정상 종료 코드를 반환한다. | Must | HTTP 오류 시 exit code 1 |
| FR-CLI-10 | 설정 파일 생성/조회 명령을 제공한다. | Should | `config init/show` 동작 |

OpenAPI 1:1 매핑:

1. `GET /health` -> `kanban health`
2. `GET /boards/` -> `kanban board list`
3. `GET /boards/{board_id}/columns` -> `kanban board columns <board_id>`
4. `GET /boards/{board_id}/issues` -> `kanban board issues <board_id>`
5. `POST /webhooks/github` -> `kanban webhook github --event ...`

---

## 8. 비기능 요구사항

1. 실행 방식: `uvx`로 즉시 실행 가능해야 함 (설치 부담 최소화)
2. 학습 난이도: `--help`만으로 기본 사용 가능해야 함
3. 보안: API 키는 출력 시 마스킹되어야 함
4. 확장성: OpenAPI 변경 시 명령 추가가 쉬운 구조여야 함

---

## 9. 성공 기준 (Acceptance Criteria)

1. `uvx --from . kanban --help`가 정상 동작한다.
2. 설정파일 기반 URL/API Key로 `board` 조회가 성공한다.
3. `--json` 옵션으로 구조화 응답을 반환한다.
4. API 키 누락/잘못된 요청 시 명확한 에러와 실패 코드로 종료한다.
5. OpenAPI의 현재 5개 엔드포인트를 CLI에서 모두 호출할 수 있다.

---

## 10. 오픈 이슈

1. OpenAPI 변경 시 자동 코드생성 여부 (수동/자동 파이프라인)
2. 출력 text 포맷의 표준화(표 형태/폭 자동 조절)
3. 운영 단계에서 인증 확장(API key rotation, OAuth 등)
