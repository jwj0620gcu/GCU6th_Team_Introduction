# Performance Audit Report

- Audit date: 2026-04-12 (KST)
- Scope: FastAPI read APIs + webhook-adjacent DB access path
- Environment:
  - `uvicorn 0.35.0` (`--reload`, single worker)
  - `Python 3.12.7`
  - Local macOS arm64
  - Load tool: ApacheBench (`ab`)

## 1) Test Method

- 인증이 필요한 엔드포인트는 `X-API-Key` 헤더 포함
- DB 비의존 컨트롤 엔드포인트: `GET /health`
- DB 의존 엔드포인트:
  - `GET /boards/`
  - `GET /boards/{board_id}/issues` (`board_id=f950861e-3252-4030-bcb8-947a4a992402`)
- Keep-alive 옵션(`-k`) 사용
- 핵심 관찰 지표: RPS, P95, P99, Max latency, 실패율

## 2) Stress Test Results

### 2.1 Control Endpoint (`/health`)

| Endpoint | Concurrency | Requests | Failed | RPS | Mean (ms) | P95 (ms) | P99 (ms) | Max (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/health` | 100 | 2000 | 0 | 1931.49 | 51.77 | 141 | 160 | 169 |

### 2.2 DB Endpoint (`/boards/`)

| Concurrency | Requests | Failed | RPS | Mean (ms) | P95 (ms) | P99 (ms) | Max (ms) |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 800 | 0 | 25.04 | 399.34 | 566 | 714 | 768 |
| 30 | 1200 | 0 | 28.95 | 1036.38 | 1461 | 1908 | 1978 |
| 60 | 1200 | 0 | 29.21 | 2053.79 | 2227 | 2267 | 2317 |
| 100 | 1500 | 0 | 29.96 | 3337.44 | 3556 | 3669 | 3712 |

### 2.3 DB Endpoint (`/boards/{board_id}/issues`)

| Concurrency | Requests | Failed | RPS | Mean (ms) | P95 (ms) | P99 (ms) | Max (ms) |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 1000 | 0 | 17.61 | 567.80 | 885 | 1413 | 1602 |
| 30 | 1000 | 0 | 26.37 | 1137.59 | 1212 | 1256 | 1296 |
| 60 | 1200 | 0 | 25.54 | 2348.80 | 3339 | 3928 | 3997 |
| 100 | 1500 | 0 | 24.57 | 4069.29 | 4570 | 4683 | 4727 |
| 120 | 800 | 0 | 24.02 | 4995.86 | 5339 | 5392 | 5431 |

### 2.4 Failure Boundary

- `c=150`, `c=200` 구간에서 `ab` 소켓 타임아웃 발생
  - `c=150`: `Total of 295 requests completed` 후 timeout
  - `c=200`: `Total of 227 requests completed` 후 timeout

## 3) DB Connection Pool Observation

부하(`c=120`, `/issues`) 수행 중 FastAPI 워커 프로세스의 Supabase(443) ESTABLISHED 연결 수를 0.2초 간격으로 샘플링:

- Samples: 213
- Min/Avg/P95/Max: `1 / 1.0 / 1 / 1`

해석:
- 커넥션 풀 상한 이전에, 애플리케이션 계층에서 요청 처리/외부 호출이 사실상 직렬화되는 패턴이 관찰됨
- 즉 현재 병목은 “풀 크기 부족”보다는 “동기 I/O + 단일 워커 + 큐잉”에 가깝다

## 4) Key Findings

1. 처리량 포화: DB 엔드포인트 RPS가 대략 `24~30`에서 포화되고, 동시성 증가 시 처리량은 거의 늘지 않음.
2. 지연 급증: 동시성 증가에 따라 P95/P99가 선형에 가깝게 증가 (큐 대기 증가).
3. 안정성 경계: `c>=150`에서 타임아웃이 발생해 실사용 고동시 시나리오에 취약.
4. 구조적 원인 1: `async` 엔드포인트 내부에서 동기 `httpx.Client`를 사용함.
5. 구조적 원인 2: 로컬 실행이 `--reload` 단일 워커라 처리 병렬성이 제한됨.
6. 구조적 원인 3: 요청당 Supabase REST 왕복 비용이 큼.

## 5) Recommendations

### Immediate (이번 스프린트)

1. `httpx.AsyncClient` 기반으로 Supabase 클라이언트 비동기화
2. 운영 실행에서 `--reload` 제거, `uvicorn --workers N`(예: 2~4) 적용
3. `httpx.Limits(max_connections=..., max_keepalive_connections=...)` 명시 튜닝
4. endpoint별 timeout/재시도 정책 정리 (`connect/read/write`)

### Short-Term (다음 스프린트)

1. `/boards/{id}/issues` 조회를 RPC/뷰로 최적화해 왕복 횟수 최소화
2. 빈번 조회 데이터(`boards`, `columns`)에 짧은 TTL 캐시 도입
3. 부하테스트 자동화(k6/Locust) 및 CI 성능 회귀 게이트 도입

### Target SLO (POC 권장)

- `/boards/`:
  - p95 < 800ms @ c=30
- `/boards/{id}/issues`:
  - p95 < 1200ms @ c=30
- error rate:
  - < 1% @ c<=100

## 6) Repro Commands

```bash
# health
ab -n 2000 -c 100 http://127.0.0.1:8000/health > /tmp/ab_health_c100.txt

# boards
ab -k -H "X-API-Key: $SWAGGER_X_API_KEY" -n 1200 -c 30  http://127.0.0.1:8000/boards/ > /tmp/ab_boards_c30.txt
ab -k -H "X-API-Key: $SWAGGER_X_API_KEY" -n 1200 -c 60  http://127.0.0.1:8000/boards/ > /tmp/ab_boards_c60.txt
ab -k -H "X-API-Key: $SWAGGER_X_API_KEY" -n 1500 -c 100 http://127.0.0.1:8000/boards/ > /tmp/ab_boards_c100.txt

# issues
ab -k -H "X-API-Key: $SWAGGER_X_API_KEY" -n 1000 -c 30  http://127.0.0.1:8000/boards/f950861e-3252-4030-bcb8-947a4a992402/issues > /tmp/ab_issues_c30.txt
ab -k -H "X-API-Key: $SWAGGER_X_API_KEY" -n 1200 -c 60  http://127.0.0.1:8000/boards/f950861e-3252-4030-bcb8-947a4a992402/issues > /tmp/ab_issues_c60.txt
ab -k -H "X-API-Key: $SWAGGER_X_API_KEY" -n 1500 -c 100 http://127.0.0.1:8000/boards/f950861e-3252-4030-bcb8-947a4a992402/issues > /tmp/ab_issues_c100.txt
```
