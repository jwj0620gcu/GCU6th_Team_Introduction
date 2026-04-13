# DATABASE.md

## 1. 문서 목적

이 문서는 현재 프로젝트의 `Supabase PostgreSQL(public schema)` 데이터베이스 구조를
`README.md` 기준으로 정리한 문서입니다.

- 기준 문서: [README.md](/Users/jungwonjun/database_cocone_team/README.md)
- 범위: 테이블 역할, 주요 컬럼, PK/FK, 유니크 제약, 동기화/멱등 처리 구조
- 비고: SQL 원문이 별도 존재할 경우 SQL이 최종 기준(Source of Truth)입니다.

---

## 2. 데이터베이스 개요

- DB 엔진: PostgreSQL (Supabase)
- 스키마: `public`
- 아키텍처 역할:
1. GitHub Projects(v2) 칸반 데이터 저장
2. 웹훅/동기화 이벤트 기반 반영
3. FastAPI 조회 API의 영속 계층

---

## 3. 테이블 목록 및 상세

### 3.1 `users`

- 역할: GitHub 사용자/담당자 정보 저장
- 기본키(PK): `id`
- 주요 컬럼:
  - `id`
  - `github_user_id`
  - `github_login`
  - `name`
  - `email`

### 3.2 `boards`

- 역할: 칸반 보드(프로젝트) 단위 저장
- 기본키(PK): `board_id`
- 주요 컬럼:
  - `board_id`
  - `name`
  - `github_project_url`
  - `created_at`
  - `updated_at`
- 유니크 제약:
  - `github_project_url` 유니크

### 3.3 `board_columns`

- 역할: 보드 내부 컬럼(예: Ready/In progress/Done) 저장
- 기본키(PK): `column_id`
- 주요 컬럼:
  - `column_id`
  - `board_id`
  - `name`
  - `position`
- 외래키(FK):
  - `board_id` -> `boards.board_id`
- 유니크 제약:
  - `(board_id, name)` 유니크
  - `(board_id, position)` 유니크

### 3.4 `issues`

- 역할: 이슈(업무) 본문/상태/담당자/컬럼 저장
- 기본키(PK): `issue_id`
- 주요 컬럼(README 기준):
  - `issue_id`
  - `board_id`
  - `column_id`
  - `user_id`
  - `status`
  - `github_issue_number`
- FastAPI 조회에서 사용 중인 컬럼:
  - `github_url`
  - `title`
  - `labels`
  - `milestone`
  - `created_at`
  - `updated_at`
- 외래키(FK):
  - `board_id` -> `boards.board_id`
  - `user_id` -> `users.id`
  - `(board_id, column_id)` -> `board_columns.(board_id, column_id)`
- 유니크 제약:
  - `(board_id, github_issue_id)` 유니크
  - `(board_id, github_issue_number)` 유니크

### 3.5 `labels`

- 역할: 라벨 마스터 저장
- 기본키(PK): `label_id`
- 주요 컬럼:
  - `label_id`
  - `board_id`
  - `name`
  - `color`
  - `github_label_id`
- 외래키(FK):
  - `board_id` -> `boards.board_id`
- 유니크 제약:
  - `(board_id, name)` 유니크
  - `(board_id, github_label_id)` 유니크

### 3.6 `issue_labels`

- 역할: 이슈-라벨 다대다(M:N) 연결
- 기본키(PK):
  - 복합키 `(issue_id, label_id)`
- 주요 컬럼:
  - `issue_id`
  - `label_id`
- 외래키(FK):
  - `issue_id` -> `issues.issue_id`
  - `label_id` -> `labels.label_id`

### 3.7 `comments`

- 역할: 이슈 댓글 저장
- 기본키(PK): `comment_id`
- 주요 컬럼:
  - `comment_id`
  - `issue_id`
  - `user_id`
  - `content`
  - `github_comment_id`
- 외래키(FK):
  - `issue_id` -> `issues.issue_id`
  - `user_id` -> `users.id`
- 유니크 제약:
  - `github_comment_id` 유니크

### 3.8 `github_webhook_deliveries`

- 역할: GitHub 웹훅 멱등/처리 로그 저장
- 기본키(PK): `delivery_id`
- 주요 컬럼:
  - `delivery_id`
  - `event`
  - `action`
  - `status`
  - `payload`
- 핵심 특징:
  - 동일 `delivery_id` 재수신 시 중복 처리 방지(멱등성)

---

## 4. 관계(ERD 요약)

아래는 핵심 관계를 텍스트로 표현한 ERD 요약입니다.

- `boards` 1 --- N `board_columns`
- `boards` 1 --- N `issues`
- `users` 1 --- N `issues` (assignee via `issues.user_id`)
- `board_columns` 1 --- N `issues` (same board 제약 포함)
- `boards` 1 --- N `labels`
- `issues` N --- N `labels` (through `issue_labels`)
- `issues` 1 --- N `comments`
- `users` 1 --- N `comments`
- `github_webhook_deliveries`는 이벤트 이력/멱등 처리용 독립 로그 테이블

---

## 5. 상태 저장 규칙

### 5.1 담당자(Assignee)

- 별도 `issues.assignee` 문자열이 아니라 `issues.user_id` 외래키로 저장
- 조회 시 `users.github_login` 또는 `users.name`으로 해석

### 5.2 칸반 컬럼(Status Column)

- 컬럼 상태는 `issues.column_id`로 저장
- 실제 사람 읽는 이름은 `board_columns.name`으로 조회 시 조인

---

## 6. 동기화 및 반영 흐름

핵심 RPC:

- `public.process_github_webhook(delivery_id, event, payload)`

처리 이벤트:

- `issues`
- `issue_comment`
- `label`

처리 순서:

1. `github_webhook_deliveries`에 수신 기록(멱등 체크)
2. 이벤트 분기 처리
3. `users / issues / labels / issue_labels / comments` 반영
4. 성공/실패 상태 기록

보완 동기화:

- Projects v2 `Status` 컬럼 이동은 폴링 스크립트로 보정 반영
  - `scripts/sync-github-project-column-moves.mjs`

---

## 7. FastAPI와 DB 매핑 관점

현재 FastAPI는 Supabase 앞단 BFF로 동작하며 주요 조회는 아래 흐름을 사용합니다.

- `GET /boards` -> `boards`
- `GET /boards/{board_id}/columns` -> `board_columns`
- `GET /boards/{board_id}/issues` -> `issues + users + board_columns` 조합 조회
- `POST /webhooks/github` -> `process_github_webhook` RPC 호출

참고 구현:

- [app/main.py](/Users/jungwonjun/database_cocone_team/app/main.py)

---

## 8. 점검 체크리스트 (현재 과제용)

- 모든 FK가 실제 DB에 적용되어 있는가
- 유니크 제약이 README 명세와 일치하는가
- `issues`의 조회 컬럼(`title`, `labels`, `milestone`, `github_url`)이 실제 스키마와 일치하는가
- 웹훅 중복 수신 시 `delivery_id` 멱등 처리가 동작하는가
- `board_columns.position` 정렬 기준이 일관되게 유지되는가

