# Security Audit Report

- Audit date: 2026-04-12 (KST)
- Scope: FastAPI backend (`app/`), auth flow, webhook ingest, runtime headers, dependency-audit readiness
- Environment: Local (`uvicorn 0.35.0`, `Python 3.12.7`, macOS arm64)

## 1) Executive Summary

현재 구현은 POC로 동작은 하지만, 외부 노출 환경 기준으로는 **즉시 보완이 필요한 보안 리스크**가 있습니다.  
특히 `POST /webhooks/github`에 서명 검증이 없어 임의 요청 수용이 가능한 점이 가장 치명적입니다.

## 2) Findings (Severity Order)

### F-01. Webhook 서명 검증 부재 (Critical)
- Severity: Critical
- Evidence:
  - [`app/api/webhooks.py`](/Users/jungwonjun/database_cocone_team/app/api/webhooks.py:8)~[32]에서 `X-Hub-Signature-256` 검증 로직 없음
  - 실제 검증: 서명 없이 요청해도 `200 OK` 수신됨 (`{"ok":true,...}`)
- Risk:
  - 누구나 위조 이벤트를 주입해 DB 상태를 오염시킬 수 있음
  - 자동화 파이프라인(칸반 동기화) 신뢰성 붕괴
- Recommendation:
  - `X-Hub-Signature-256` HMAC-SHA256 필수 검증
  - 검증 실패 시 `401` 즉시 반환
  - `X-GitHub-Delivery` 중복 방지 + 타임윈도우 검증 추가

### F-02. Swagger HTML에 API 키 자동 주입 (High)
- Severity: High
- Evidence:
  - [`app/main.py`](/Users/jungwonjun/database_cocone_team/app/main.py:51)~[56]에서 `preauthorizeApiKey`로 키를 HTML에 삽입
  - `/docs` 응답 HTML에 실제 키 문자열 포함 확인 (`contains_key_literal=True`)
- Risk:
  - `/docs` 접근 가능한 사용자/프록시/로그에서 키 유출 가능
  - 키 재사용 시 보호 엔드포인트 무단 접근 가능
- Recommendation:
  - 운영 환경에서 자동 주입 비활성화 (`SWAGGER_X_API_KEY` 미사용)
  - `/docs` 자체를 내부망/IP allowlist로 제한
  - 키는 브라우저 주입이 아니라 사용자 수동 입력 방식 유지

### F-03. CORS 설정 위험 (`*` + credentials) (High)
- Severity: High
- Evidence:
  - [`app/main.py`](/Users/jungwonjun/database_cocone_team/app/main.py:27)~[33]
  - `allow_origins=["*"]`, `allow_credentials=True`
- Risk:
  - 크로스오리진 요청 경계가 느슨해져 의도치 않은 인증정보/토큰 사용 시나리오 확대
- Recommendation:
  - 허용 origin 명시적 화이트리스트로 전환
  - `allow_credentials`는 필요할 때만 `True`

### F-04. 서비스 롤 키를 API 서버가 직접 상시 사용 (High)
- Severity: High
- Evidence:
  - [`app/repositories/supabase_client.py`](/Users/jungwonjun/database_cocone_team/app/repositories/supabase_client.py:15)~[17] `SUPABASE_SERVICE_ROLE_KEY`를 모든 REST/RPC 호출에 사용
- Risk:
  - 앱 계층 침해 시 DB 전체 권한 노출
  - 최소권한 원칙 위반
- Recommendation:
  - 서버 전용 최소권한 DB role 분리
  - 가능하면 RLS + 제한된 anon/service 분리 구조로 재설계

### F-05. 내부 예외 메시지 외부 노출 (Medium)
- Severity: Medium
- Evidence:
  - [`app/api/boards.py`](/Users/jungwonjun/database_cocone_team/app/api/boards.py:14), [23], [32]
  - [`app/api/webhooks.py`](/Users/jungwonjun/database_cocone_team/app/api/webhooks.py:31)~[32]
  - `HTTPException(detail=str(e))`
- Risk:
  - 내부 구조/쿼리 오류가 외부에 노출되어 공격 표면 확대
- Recommendation:
  - 클라이언트에는 일반화된 오류코드/메시지만 반환
  - 상세 에러는 서버 로그/추적 시스템에만 기록

### F-06. 의존성 보안 감사 파이프라인 불가 상태 (Medium)
- Severity: Medium
- Evidence:
  - [`requirements.txt`](/Users/jungwonjun/database_cocone_team/requirements.txt:1)에 머지 충돌 마커(`<<<<<<<`) 존재
  - `pip-audit -r requirements.txt` 실패
- Risk:
  - CVE 점검 자동화 불가
  - 빌드 재현성과 공급망 보안 저하
- Recommendation:
  - `requirements.txt` 충돌 즉시 해소
  - CI에서 `pip-audit -r requirements.txt`를 필수 게이트로 적용

### F-07. 보안 응답 헤더 부재 (Low)
- Severity: Low
- Evidence:
  - `/health`, `/docs` 응답에서 `X-Content-Type-Options`, `Content-Security-Policy`, `Strict-Transport-Security` 미확인
- Risk:
  - 브라우저 기반 공격 완화 수준 부족
- Recommendation:
  - 운영 배포 레이어(Nginx/Ingress) 또는 FastAPI 미들웨어로 보안 헤더 추가

## 3) Positive Controls Observed

- 보드 API는 API Key 스킴이 OpenAPI에 반영되어 있음 (`APIKeyHeader`)
- API Key 비교 시 `hmac.compare_digest` 사용
- `.gitignore`에 `.sync.env`, `.env` 포함 (로컬 비밀파일 기본 제외)

## 4) Immediate Remediation Plan (Priority)

1. `webhooks/github`에 HMAC 서명 검증 강제 (즉시)
2. Swagger 키 자동주입 제거 및 `/docs` 접근제어 (즉시)
3. CORS allowlist 전환 (즉시)
4. 외부 오류 메시지 일반화 + 내부 로깅 분리 (단기)
5. `requirements.txt` 충돌 해소 후 `pip-audit` CI 게이트 적용 (단기)
6. Supabase 권한 최소화(서비스 롤 직접노출 축소) (중기)

## 5) Audit Commands (Executed)

```bash
curl -D - -o /dev/null http://127.0.0.1:8000/health
curl -D - -o /dev/null http://127.0.0.1:8000/docs
python - <<'PY'
import json, urllib.request
spec=json.loads(urllib.request.urlopen('http://127.0.0.1:8000/openapi.json').read())
print(spec.get('components',{}).get('securitySchemes',{}).keys())
PY
pip-audit -r requirements.txt
```

