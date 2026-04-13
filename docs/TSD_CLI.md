# TSD_CLI.md

## 1. 문서 정보

- 시스템명: `kanban` CLI (POC)
- 기술 스택: Python + Typer + httpx
- 실행 방식: `uvx --from . kanban ...`
- 대상 OS: macOS

---

## 2. 기술 목표

1. FastAPI OpenAPI 스펙 기반 엔드포인트를 CLI로 안전하게 호출
2. 설정파일 기반 환경 전환(로컬/스테이징 등)
3. 비개발자도 사용할 수 있는 단순 명령 체계 제공

---

## 3. 아키텍처

### 3.1 구성 요소

1. Command Layer (`ttodo_cli/main.py`)
2. API Client Layer (`ttodo_cli/client.py`)
3. Config Layer (`ttodo_cli/config.py`)
4. Packaging (`pyproject.toml`)

### 3.2 호출 흐름

1. 사용자가 CLI 명령 실행
2. 설정파일/환경변수에서 `base_url`, `api_key`, timeout 로드
3. `httpx.Client`로 API 호출
4. 성공 시 text 또는 `--json` 출력
5. 실패 시 오류 메시지 출력 + exit code `1`

---

## 4. 디렉토리/파일 구조

```text
.
├─ pyproject.toml
└─ ttodo_cli/
   ├─ __init__.py
   ├─ config.py
   ├─ client.py
   └─ main.py
```

---

## 5. 설정 설계

### 5.1 설정 파일

- 기본 경로: `~/.config/kanban/config.toml`
- 사용자 지정: `--config /path/to/config.toml` (또는 `--kanban-config`)
- 환경변수로 지정: `KANBAN_CONFIG=/path/to/config.toml`

### 5.2 설정 키

| 키 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `base_url` | string | `http://127.0.0.1:8000` | API 접속 주소 |
| `api_key` | string | 빈 문자열 | `X-API-Key` 값 |
| `timeout_seconds` | float | `10.0` | HTTP timeout |

### 5.3 우선순위

1. CLI 옵션 (`--config`로 파일 경로 선택)
2. 설정 파일 값
3. 환경변수 override (`KANBAN_BASE_URL`, `KANBAN_API_KEY`, `KANBAN_TIMEOUT_SECONDS`)
4. 코드 기본값

---

## 6. 명령 설계

### 6.1 루트 명령

1. `kanban health`
2. `kanban board ...`
3. `kanban webhook ...`
4. `kanban config ...`

### 6.2 상세 명령

| CLI 명령 | HTTP Method | Endpoint | 인증 필요 |
|---|---|---|---|
| `kanban health` | GET | `/health` | 아니오 |
| `kanban board list` | GET | `/boards/` | 예 (`X-API-Key`) |
| `kanban board columns <board_id>` | GET | `/boards/{board_id}/columns` | 예 |
| `kanban board issues <board_id>` | GET | `/boards/{board_id}/issues` | 예 |
| `kanban webhook github --event ...` | POST | `/webhooks/github` | 아니오 |

### 6.3 출력 형식

1. 기본: text (요약형)
2. 옵션: `--json` (pretty JSON)

---

## 7. API 클라이언트 설계

### 7.1 HTTP 클라이언트

- 라이브러리: `httpx.Client`
- 공통 설정:
  - `base_url`
  - `timeout`
  - `Accept: application/json`

### 7.2 인증 헤더

- 인증 필요 명령에서만 `X-API-Key` 자동 첨부
- API 키가 없는 경우 CLI 레벨에서 즉시 실패 처리

### 7.3 오류 처리

1. `HTTPStatusError` -> `HTTP <status>: <body>` 출력 후 exit code `1`
2. `HTTPError` -> 네트워크 오류 출력 후 exit code `1`
3. payload JSON 오류 -> `Invalid JSON payload` 후 exit code `1`

---

## 8. 패키징/실행 설계

### 8.1 pyproject

- `project.name`: `kanban-cli`
- 엔트리포인트: `kanban = "ttodo_cli.main:app"`
- 의존성: `typer`, `httpx`

### 8.2 실행

```bash
uvx --from . kanban --help
uvx --from . kanban health
```

---

## 9. 보안 고려사항

1. `config show`에서 API 키는 마스킹 출력
2. 설정파일에 평문 키가 저장될 수 있으므로 파일 권한 관리 필요
3. 운영 환경에서는 키 자동 주입/로그 노출 방지 정책 필요

---

## 10. 테스트 전략

1. 기능 테스트: 각 명령이 대응 API를 정확히 호출하는지 검증
2. 예외 테스트: API 키 누락, 잘못된 `board_id`, 잘못된 payload
3. 출력 테스트: text/JSON 포맷 분기 검증
4. 회귀 테스트: OpenAPI 엔드포인트 변경 시 명령 매핑 검토

---

## 11. 향후 확장

1. OpenAPI 기반 코드 자동 생성 파이프라인
2. 출력 포맷 확장(csv)
3. 인증 확장(OAuth/API key profile 관리)
4. CI에서 CLI e2e 테스트 자동화
