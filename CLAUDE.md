# Agent Guide

Project: Team Kanban Backend POC
Goal: Supabase 기반 API+CLI로 팀 업무를 저장/공유한다.
OutOfScope: 인증/로그인, 멀티테넌시, 프로덕션 운영 고도화

## Stack
Backend: Python, FastAPI, supabase-py
CLI: Python, Typer
DB: Supabase PostgreSQL (existing schema)
Docs: FastAPI Swagger (/docs)

## Source of Truth
PRD: docs/PRD.md
TSD: docs/TSD.md
DATABASE: docs/DATABASE.md
Code Entry: (backend scaffold to be recreated)

## Environment
Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Optional: GITHUB_WEBHOOK_SECRET
Rule: 비밀값 출력/커밋 금지 (.env, .sync.env)

## Run Commands
Validate Claude settings: python3 -m json.tool .claude/settings.json >/dev/null
Validate mistake logger script: python3 -m py_compile scripts/record_agent_mistake.py
Manual mistake log: python3 scripts/record_agent_mistake.py "manual note"
API/Swagger commands: backend scaffold recreated 후 추가

## Engineering Rules
1. 변경은 작고 검증 가능하게 유지한다.
2. 요청 없으면 DB 스키마를 바꾸지 않는다.
3. 에러는 HTTP 상태코드 + detail로 명확히 반환한다.
4. API/동작 변경 시 문서를 함께 갱신한다.
5. 임시 코드/TODO 주석은 남기지 않는다.

## Kanban Logging Rule
1. 작업 시작 전: 간반 이슈 생성 또는 기존 이슈에 시작 코멘트 추가
2. 주요 변경 후: 진행 코멘트 추가 (무엇을 바꿨는지 1~3줄)
3. 작업 완료 후: Done 이동 + 결과/검증 요약 코멘트 추가

## Definition of Done
1. 현 단계에서는 하네스/문서 검증이 통과한다.
2. 성공/실패 케이스를 최소 1개씩 검증했다.
3. 시크릿 유출 없이 커밋 가능 상태다.
4. README와 docs 내용이 현재 코드 상태와 일치한다.

## Default Workflow
Read docs -> Plan -> Implement -> Test -> Update docs -> Report
### Agent mistake — 2026-04-12T04:51:06.208059Z
- Manual: True
- tool: `(unknown)`

#### Note

initial test of agent mistake logging

----
