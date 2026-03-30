# GitHub Projects 기반 Kanban Backend (Supabase + FastAPI)

이 저장소는 GitHub Projects(v2) 칸반보드를 Supabase(PostgreSQL)에 동기화하고,  
FastAPI로 조회/웹훅 수신 API를 제공하는 백엔드 프로젝트입니다.

---

## 1) 전체 구조

- **DB**: Supabase PostgreSQL (`public` 스키마)
- **실시간 반영**: GitHub Webhook -> Supabase Edge Function/FastAPI -> `process_github_webhook` RPC
- **컬럼 이동 보정**: Projects v2 `Status`를 폴링 스크립트로 반영
- **조회 API**: FastAPI (`/docs` Swagger 제공)

---

## 2) 테이블 설명 (한국어)

| 테이블 | 역할 | 핵심 컬럼 |
|---|---|---|
| `users` | GitHub 사용자/담당자 정보 저장 | `id`, `github_user_id`, `github_login`, `name`, `email` |
| `boards` | 칸반 보드(프로젝트) 단위 저장 | `board_id`, `name`, `github_project_url` |
| `board_columns` | 보드 안의 컬럼(Ready, Done 등) 저장 | `column_id`, `board_id`, `name`, `position` |
| `issues` | 이슈 본문/상태/담당자/컬럼 저장 | `issue_id`, `board_id`, `column_id`, `user_id`, `status`, `github_issue_number` |
| `labels` | 라벨 마스터 저장 | `label_id`, `board_id`, `name`, `color`, `github_label_id` |
| `issue_labels` | 이슈-라벨 다대다 연결 | `issue_id`, `label_id` |
| `comments` | 이슈 댓글 저장 | `comment_id`, `issue_id`, `user_id`, `content`, `github_comment_id` |
| `github_webhook_deliveries` | 웹훅 멱등/처리 로그 | `delivery_id`, `event`, `action`, `status`, `payload` |

---

## 3) 테이블 관계 (PK / FK)

### PK

- `users.id`
- `boards.board_id`
- `board_columns.column_id`
- `issues.issue_id`
- `labels.label_id`
- `issue_labels (issue_id, label_id)` (복합 PK)
- `comments.comment_id`
- `github_webhook_deliveries.delivery_id`

### FK

- `board_columns.board_id` -> `boards.board_id`
- `issues.board_id` -> `boards.board_id`
- `issues.user_id` -> `users.id`
- `issues.(board_id, column_id)` -> `board_columns.(board_id, column_id)` (같은 보드 컬럼 강제)
- `labels.board_id` -> `boards.board_id`
- `issue_labels.issue_id` -> `issues.issue_id`
- `issue_labels.label_id` -> `labels.label_id`
- `comments.issue_id` -> `issues.issue_id`
- `comments.user_id` -> `users.id`

### 유니크 제약 핵심

- `boards.github_project_url` 유니크
- `board_columns (board_id, name)` 유니크
- `board_columns (board_id, position)` 유니크
- `issues (board_id, github_issue_id)` 유니크
- `issues (board_id, github_issue_number)` 유니크
- `labels (board_id, name)` 유니크
- `labels (board_id, github_label_id)` 유니크
- `comments.github_comment_id` 유니크

---

## 4) assignee / 컬럼 값이 저장되는 방식

- assignee는 `issues.assignee` 컬럼이 아니라 **`issues.user_id` FK**로 저장됩니다.
- 컬럼(Ready, In progress, Done)은 `issues.column_id` FK -> `board_columns.name`으로 연결됩니다.

조회 예시:

```sql
select
  i.github_issue_number as issue_no,
  i.title,
  u.github_login as assignee,
  c.name as board_column
from public.issues i
left join public.users u on u.id = i.user_id
left join public.board_columns c on c.column_id = i.column_id
where i.board_id = 'f950861e-3252-4030-bcb8-947a4a992402'
order by i.github_issue_number;
```

---

## 5) Webhook 자동화

핵심 함수:

- `public.process_github_webhook(delivery_id, event, payload)`

처리 이벤트:

- `issues`
- `issue_comment`
- `label`

동작:

1. `github_webhook_deliveries`에 먼저 저장 (멱등 처리)
2. 이벤트별 분기
3. `users / issues / labels / issue_labels / comments` 반영
4. 성공/실패 상태 기록

멱등성:

- 같은 `delivery_id` 재수신 시 `duplicate`로 무시

### Projects v2 컬럼 이동(Status)

- 개인 프로젝트(`users/.../projects/...`)는 컬럼 이동 이벤트를 웹훅만으로 받기 어려워  
  `scripts/sync-github-project-column-moves.mjs` 폴링으로 반영합니다.

---

## 6) 동기화 스크립트

| 스크립트 | 목적 |
|---|---|
| `scripts/sync-github-project-to-supabase.mjs` | 전체 동기화 (이슈/댓글/라벨/유저/컬럼) |
| `scripts/sync-github-project-column-moves.mjs` | 컬럼 이동(Status) 증분 반영 |

실행:

```bash
# 전체 동기화
node scripts/sync-github-project-to-supabase.mjs

# 컬럼 이동 1회 반영
node scripts/sync-github-project-column-moves.mjs

# 컬럼 이동 폴링
WATCH=true POLL_INTERVAL_SECONDS=60 node scripts/sync-github-project-column-moves.mjs
```

---

## 7) FastAPI

FastAPI는 Supabase 앞단 BFF 역할을 하며 자체 Swagger를 제공합니다.

구현 파일:

- `app/main.py`

### 제공 엔드포인트

- `GET /health`
- `GET /boards`
- `GET /boards/{board_id}/columns`
- `GET /boards/{board_id}/issues`
- `POST /webhooks/github`

### 실행

```bash
python3 -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Swagger:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/openapi.json`

---

## 8) Supabase Swagger와 FastAPI Swagger 차이

- **Supabase Swagger**: DB 기반 CRUD/RPC 자동 문서 (`/rest/v1/`)
- **FastAPI Swagger**: 서비스 관점 커스텀 API 문서 (`/docs`)

둘 다 맞고, 용도가 다릅니다.

---

## 9) 파일 구조

```text
.
├─ app/
│  ├─ main.py
│  └─ README.md
├─ scripts/
│  ├─ sync-github-project-to-supabase.mjs
│  └─ sync-github-project-column-moves.mjs
├─ supabase/
│  └─ functions/github-webhook/index.ts
├─ supabase_sql/
│  ├─ 01_schema.sql
│  ├─ 02_seed.sql
│  ├─ 03_automation.sql
│  └─ edge_function/github-webhook/
├─ requirements.txt
├─ package.json
└─ .env.example
```

---

## 10) 보안 주의

- `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`는 절대 커밋 금지
- 실제 비밀값은 `.env` 또는 `.sync.env`에만 저장

