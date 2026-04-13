# E2E_TEST_PLAN_CLI.md

## 1. 목적

`docs/PRD_CLI.md`, `docs/TSD_CLI.md`, `docs/TEST_CASE_CLI.md`를 기준으로
`kanban` CLI의 실제 통합 동작을 End-to-End 관점에서 검증한다.

---

## 2. 참조 문서

1. [PRD_CLI.md](/Users/jungwonjun/database_cocone_team/docs/PRD_CLI.md)
2. [TSD_CLI.md](/Users/jungwonjun/database_cocone_team/docs/TSD_CLI.md)
3. [TEST_CASE_CLI.md](/Users/jungwonjun/database_cocone_team/docs/TEST_CASE_CLI.md)

---

## 3. 범위

### 3.1 In-Scope

1. 실행 방식: `uvx --from . kanban`
2. 설정 파일 로딩/우선순위 (`--config`, `KANBAN_*`)
3. OpenAPI 매핑 5개 엔드포인트 전체
4. 출력 형식(text/`--json`)
5. 실패 처리(인증키 누락, 네트워크 오류, 잘못된 payload)

### 3.2 Out-of-Scope

1. Supabase 스키마/데이터 정합성 상세 검증
2. 성능/부하 테스트
3. 보안 침투 테스트

---

## 4. 환경 및 사전 조건

1. API 서버: `http://127.0.0.1:8000` 기동 상태
2. `.sync.env`에 `SWAGGER_X_API_KEY` 존재
3. macOS + `uv`/`uvx` 사용 가능
4. 테스트 보드 ID: `f950861e-3252-4030-bcb8-947a4a992402`

---

## 5. 테스트 전략

1. 테스트 케이스 소스: `TEST_CASE_CLI.md`의 TC-CLI-001~020
2. 방식:
  - `scripts/run_cli_e2e.sh`로 실제 CLI 명령 실행
  - 명령별 종료코드 + 핵심 출력 문자열 기반 판정
3. 결과물:
  - 자동 생성 리포트: `docs/CLI_E2E_RESULT.md`

---

## 6. 성공 기준

1. 전체 케이스 실행 완료
2. Must 성격의 핵심 경로(health, boards list, issues, webhook, config)가 PASS
3. 실패 케이스는 의도한 에러 메시지/exit code로 PASS 판정

---

## 7. 실행 명령

```bash
bash scripts/run_cli_e2e.sh docs/CLI_E2E_RESULT.md
```

---

## 8. 리스크/대응

1. 서버 미기동
  - 대응: 사전 health check에서 즉시 fail-fast
2. API 키 누락/만료
  - 대응: `.sync.env` 키 존재 확인 후 진행
3. 외부 환경 변동으로 인한 간헐 실패
  - 대응: 결과 리포트에 실패 케이스/출력 로그 요약 기록

---

## 9. CI 연계

- 워크플로우 파일: `.github/workflows/cli-e2e.yml`
- 트리거: `pull_request`, `workflow_dispatch`
- 실행 스크립트: `scripts/run_cli_e2e.sh`

필수 GitHub Secrets:

1. `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`
3. `KANBAN_API_KEY` (워크플로우에서 `SWAGGER_X_API_KEY`로 매핑)

참고:

- fork PR에서는 repository secrets 접근이 불가하여 job이 skip된다.
