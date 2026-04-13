# TSD.md

## 1. 문서 정보

- 시스템명: Team Kanban Backend API (POC)
- 기술 스택: Python + FastAPI + Supabase
- 배포 환경: Localhost
- API 문서: FastAPI Swagger (`/docs`)

---

## 2. 기술 목표

1. 기존 Supabase 칸반 스키마를 그대로 활용하는 REST API 계층 제공
2. 소규모 팀 협업에 필요한 핵심 CRUD 및 웹훅 반영 기능 제공
3. 로컬에서 빠르게 실행/검증 가능한 단순 구조 유지

---

## 3. 아키텍처

### 3.1 구성 요소

1. FastAPI 애플리케이션
2. Supabase PostgreSQL(`public` schema)
3. GitHub Webhook 입력(선택 사용)
4. CLI/테스트 클라이언트(curl, Postman, 향후 Typer CLI)

### 3.2 논리 흐름

1. 클라이언트가 FastAPI 엔드포인트 호출
2. FastAPI가 Supabase table API 또는 RPC 호출
3. 결과를 JSON으로 반환
4. GitHub 이벤트는 `/webhooks/github`로 수신 후 `process_github_webhook` RPC 처리

---

## 4. 기술 스택 상세

| 영역 | 선택 기술 | 비고 |
|---|---|---|
| 언어 | Python 3.x | 백엔드 구현 |
| 웹 프레임워크 | FastAPI | REST API + Swagger |
| ASGI 서버 | Uvicorn | 로컬 개발 서버 |
| DB 접근 | supabase-py | Supabase table/RPC 호출 |
| 환경변수 | python-dotenv | `.env`, `.sync.env` 로드 |

현재 의존성(기준):

- `fastapi==0.116.1`
- `uvicorn[standard]==0.35.0`
- `python-dotenv==1.1.1`
- `supabase==2.18.1`

---

## 5. 데이터 모델 연계

데이터는 기존 DB를 사용하며 스키마 변경 없이 API 계층을 구현합니다.

- 기준 문서: [DATABASE.md](/Users/jungwonjun/database_cocone_team/docs/DATABASE.md)
- 주요 참조 테이블:
  - `boards`, `board_columns`, `issues`
  - `users`, `comments`, `labels`, `issue_labels`
  - `github_webhook_deliveries`

핵심 매핑 규칙:

1. assignee는 `issues.user_id` FK를 사용한다.
2. 이슈 컬럼 상태는 `issues.column_id` FK로 관리한다.
3. 웹훅 처리는 `process_github_webhook` RPC를 사용한다.

---

## 6. API 설계

### 6.1 기본 규칙

1. Base URL: `http://127.0.0.1:8000`
2. 콘텐츠 타입: `application/json`
3. 인증/로그인: 없음(POC 정책)
4. 오류 응답: HTTP 상태코드 + `detail`

### 6.2 엔드포인트 목록

| 메서드 | 경로 | 목적 | 상태 |
|---|---|---|---|
| GET | `/health` | 서버 헬스체크 | 구현 |
| GET | `/boards` | 보드 목록 조회 | 구현 |
| GET | `/boards/{board_id}/columns` | 보드 컬럼 조회 | 구현 |
| GET | `/boards/{board_id}/issues` | 보드 이슈 조회 | 구현 |
| POST | `/webhooks/github` | GitHub 웹훅 수신/RPC 반영 | 구현 |
| POST | `/issues` | 이슈 생성 | 계획 |
| PATCH | `/issues/{issue_id}` | 이슈 수정(상태/컬럼/담당자 포함) | 계획 |
| DELETE | `/issues/{issue_id}` | 이슈 삭제 | 계획 |
| GET | `/issues/{issue_id}/comments` | 코멘트 조회 | 계획 |
| POST | `/issues/{issue_id}/comments` | 코멘트 생성 | 계획 |
| DELETE | `/comments/{comment_id}` | 코멘트 삭제 | 계획 |
| GET | `/boards/{board_id}/labels` | 라벨 조회 | 계획 |
| POST | `/boards/{board_id}/labels` | 라벨 생성 | 계획 |
| POST | `/issues/{issue_id}/labels/{label_id}` | 이슈-라벨 연결 | 계획 |
| DELETE | `/issues/{issue_id}/labels/{label_id}` | 이슈-라벨 해제 | 계획 |

---

## 7. 구현 상세

### 7.1 코드 구조

현재 구현 파일:

- [app/main.py](/Users/jungwonjun/database_cocone_team/app/main.py)

POC 권장 확장 구조:

1. `app/main.py` : 라우터 등록, 앱 초기화
2. `app/api/` : 라우터 모듈(boards/issues/comments/labels/webhook)
3. `app/services/` : 비즈니스 로직(검증/조합/상태 전이)
4. `app/repositories/` : Supabase 쿼리 캡슐화
5. `app/schemas/` : 요청/응답 Pydantic 모델

### 7.2 웹훅 처리

1. 헤더에서 `X-GitHub-Event`, `X-GitHub-Delivery`, `X-Hub-Signature-256` 수신
2. 시그니처 검증
3. JSON payload 파싱
4. `process_github_webhook` RPC 호출
5. 처리 결과 반환

---

## 8. 환경 변수

| 키 | 필수 여부 | 설명 |
|---|---|---|
| `SUPABASE_URL` | 필수 | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 필수 | Supabase service role key |
| `GITHUB_WEBHOOK_SECRET` | 웹훅 사용 시 필수 | GitHub 웹훅 서명 검증 키 |

주의:

1. 비밀값은 `.env`/`.sync.env`로 관리하고 Git에 커밋하지 않는다.
2. 서비스 키는 서버 내부에서만 사용한다.

---

## 9. 로컬 실행 및 문서 확인

```bash
python3 -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

확인 URL:

- Swagger: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

---

## 10. 테스트 전략 (POC)

1. 스모크 테스트
  - `/health`, `/boards`, `/boards/{board_id}/columns`, `/boards/{board_id}/issues`
2. 웹훅 테스트
  - 유효/무효 시그니처 케이스
  - 중복 delivery 멱등 케이스
3. CRUD 테스트(구현 후)
  - 이슈/코멘트/라벨 생성-조회-수정-삭제 시나리오
4. 문서 검증
  - Swagger에 모든 엔드포인트 노출 여부 확인

---

## 11. 제약 및 리스크

1. 인증/권한이 없으므로 외부 공개 환경 배포에 부적합하다.
2. service role key 사용으로 API 서버 접근 통제가 중요하다.
3. POC 단계에서는 단일 인스턴스 기준이며 확장성 고려가 제한적이다.

---

## 12. 향후 확장

1. API Key 또는 OAuth2 인증 도입
2. 감사 로그/요청 추적 강화
3. CLI 명세(PRD_CLI/TSD_CLI)와 1:1 명령 매핑
4. CI + 린트 + 테스트 하네스 자동화
