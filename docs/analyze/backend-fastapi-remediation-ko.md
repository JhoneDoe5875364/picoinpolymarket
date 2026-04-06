# PredictPix Backend (FastAPI) 수정방안

**관련 문서:** [backend-fastapi-analysis-ko.md](./backend-fastapi-analysis-ko.md)  
**목적:** 분석에서 도출된 이슈를 **구체적인 수정 작업**으로 나누고, 구현 시 확인할 **완료 기준**을 제시합니다.  
**동기화:** 2026-03-24 재분석 결과와 정합.

---

## 사용 방법

- **P0**는 배포·보안·가용성에 직결되므로 먼저 처리합니다.
- 각 항목은 `대상 파일` → `수정 내용` → `완료 기준` 순으로 읽습니다.
- 실제 패치는 한 PR에 P0만 묶거나, 보안/DB/기능별로 PR을 쪼개는 것을 권장합니다.

---

## P0 — 즉시 (동작·인증·데이터 무결성)

### P0-1. DB 연결 DSN 단일화

| 항목 | 내용 |
|------|------|
| 문제 | `app/core/database.py`의 `psycopg2.connect("")`는 DSN이 불명확하거나 실패할 수 있음. `app/db.py`의 `dsn_for_psycopg2`와 역할이 중복됨. |
| 수정 | `_conn()`이 `DATABASE_URL`(및 기존 별칭)을 읽어 `app.db.dsn_for_psycopg2()` 또는 동일 로직으로 DSN을 구성한 뒤 `psycopg2.connect(dsn)` 하도록 통일. |
| 대상 파일 | `backend/app/core/database.py` (필요 시 `backend/app/db.py`에서 공개 함수만 재사용) |
| 완료 기준 | `.env`에 유효한 `DATABASE_URL`만으로 API가 DB에 연결됨. 빈 문자열 연결 시도 없음. |

### P0-2. `migrations.py` 실행 가능하게 수정 또는 폐기

| 항목 | 내용 |
|------|------|
| 문제 | `app/core/migrations.py`에 `_conn` / `RealDictCursor` 미import, `psycopg2` 연결에 `await conn.execute(...)` 사용 등으로 실행 불가. |
| 수정 (단기) | 동기 코드로만 작성: `with _conn() as conn` → `cur.execute(...)` 문장 단위 분리. `await`/`conn.execute`(asyncpg 스타일) 제거. 필요한 import 추가. |
| 수정 (중기) | Alembic 또는 `bin/` 스크립트로 마이그레이션 이관 후, 앱 내 `migrate_database`는 제거하거나 씬 래퍼만 유지. |
| 대상 파일 | `backend/app/core/migrations.py`, 마이그레이션 호출부(있다면) |
| 완료 기준 | CI 또는 로컬에서 마이그레이션 스크립트가 한 번에 성공 실행됨. |

### P0-3. `POST /api/auth/pi/` — `mint_jwt_token` 호출 정합성

| 항목 | 내용 |
|------|------|
| 문제 | `mint_jwt_token(uid=uid, username=username, role=roles)`는 시그니처 `mint_jwt_token(user_id, username, role, pi_access_token)`와 불일치함. `uid`는 정의되지 않은 키워드 인자, `pi_access_token` 누락, `role`에 리스트(`roles`) 전달. |
| 수정 | 위치 인자 또는 올바른 키워드 인자로 호출. `role`은 JWT에 문자열 하나로 저장할지, `roles` 배열을 직렬화할지 정책 결정 후 `/verify`·`/me`와 일치. `body.accessToken`을 네 번째 인자로 전달할지(페이로드 `tok`) 정책 결정. |
| 대상 파일 | `backend/app/routes/api/auth_pi.py`, `backend/app/core/security.py`(필요 시 시그니처·payload 정리) |
| 완료 기준 | `POST /` 호출 시 500·TypeError 없이 토큰 발급, `verify_token`·`/me`와 클레임 일관. |

### P0-4. 어테스테이션 라우트 — async/sync 및 신원 바인딩

| 항목 | 내용 |
|------|------|
| 문제 | `AttestationService` 메서드는 동기 `def`인데 라우트에서 `await create_attestation` 등으로 호출하면 **await 대상이 아니어서** 런타임 오류. `confirm`에서 본문 `user_id`만 신뢰하면 스푸핑 가능. |
| 수정 A | 서비스 메서드를 `async def`로 바꾸고 내부 DB는 `asyncio.to_thread` 등으로 감싸거나, 라우트에서 **`await` 제거** 후 동기 호출만 사용. |
| 수정 B | `POST /confirm`은 `Depends(verify_token)`로 JWT 확보 후 **`body.user_id`와 `payload["sub"]` 일치**를 강제(관리자 예외가 필요하면 명시적 역할 검사). |
| 수정 C | `GET /status/{user_id}`는 기본적으로 **본인(`sub` 일치)만** 조회 가능하게 하거나, 관리자 전용으로 분리. |
| 대상 파일 | `backend/app/routes/api/attestation.py`, `backend/app/core/attestation.py` |
| 완료 기준 | 어테스테이션 API 호출 시 예외 없음. 타인 `user_id`로 확인 기록·상세 조회 불가(정책에 맞게). |

---

## P1 — 보안·노출 최소화

### P1-1. 시크릿·JWT 설정 로깅 제거

| 항목 | 내용 |
|------|------|
| 문제 | `mint_jwt_token`에서 JWT 시크릿·issuer·audience·알고리즘을 로그에 남김. |
| 수정 | 해당 `logger.info` 삭제 또는 마스킹. 운영 로그 레벨 정책 점검. |
| 대상 파일 | `backend/app/core/security.py` |
| 완료 기준 | 코드 검색으로 `JWT_SECRET` 등 민감 값이 로그 문자열에 포함되지 않음. |

### P1-2. 토큰 검증 실패 메시지 일반화

| 항목 | 내용 |
|------|------|
| 문제 | `verify_token`에서 `Invalid token: {e}`로 내부 예외가 클라이언트에 전달될 수 있음. |
| 수정 | 클라이언트에는 고정 메시지(예: `Invalid token`). 상세는 `logger`에만 기록. |
| 대상 파일 | `backend/app/core/security.py` |
| 완료 기준 | 잘못된 토큰 응답 본문에 스택/라이브러리 내부 문자열이 노출되지 않음. |

### P1-3. CORS

| 항목 | 내용 |
|------|------|
| 문제 | `ALLOWED_ORIGINS` 기본값은 `http://localhost:9002`이나, 출처 목록이 **빈 리스트**가 되면 `origins or ["*"]`로 `*` 허용으로 떨어짐. |
| 수정 | 프로덕션에서는 `ALLOWED_ORIGINS` 미설정·빈 문자열 시 **기동 실패** 또는 명시적 허용 목록만 사용. 개발용은 `ENV=development`일 때만 완화. |
| 대상 파일 | `backend/app/main.py` |
| 완료 기준 | 스테이징/프로덕션에서 의도한 Origin만 허용. |

### P1-4. Geo 디버그·임의 IP 조회

| 항목 | 내용 |
|------|------|
| 문제 | `/api/geo/debug/headers` 헤더 전량 노출. `/api/geo/check`의 `body.ip` 남용 가능. |
| 수정 | `debug/headers`: `DEBUG=true` 또는 `ENABLE_GEO_DEBUG=1`일 때만 등록, 또는 비프로덕션에서만 include. `check`: 임의 IP 허용 시 **인증·레이트 리밋·감사 로그** 중 최소 1개 적용, 가능하면 `body.ip` 제거하고 `request.state`만 사용. |
| 대상 파일 | `backend/app/routes/api/geo.py`, `backend/app/core/config.py`(플래그) |
| 완료 기준 | 프로덕션에서 디버그 엔드포인트 비활성. `check` 남용 시도에 대한 제한 또는 거부. |

### P1-5. JWT `issuer` 검증 (선택)

| 항목 | 내용 |
|------|------|
| 수정 | `jwt.decode(..., issuer=JWT_ISSUER, options={"require": ["exp", "iss"]})` 등으로 발급자 고정. |
| 대상 파일 | `backend/app/core/security.py` |
| 완료 기준 | 다른 `iss`로 서명된 토큰은 거부. |

---

## P2 — 성능·DB 부하

### P2-1. 커넥션 풀

| 항목 | 내용 |
|------|------|
| 문제 | 요청마다 새 연결 생성 가능성 → 지연·DB `max_connections` 압박. |
| 수정 | `psycopg2.pool.ThreadedConnectionPool` 또는 `psycopg` 풀로 `_conn()`을 래핑. 풀 크기·타임아웃을 환경변수로 노출. |
| 대상 파일 | `backend/app/core/database.py` |
| 완료 기준 | 부하 테스트에서 연결 수가 요청 수와 선형으로 늘지 않음. |

### P2-2. 쿼리 왕복 축소

| 항목 | 내용 |
|------|------|
| 수정 예시 | `suggestions` 목록+COUNT를 한 연결/한 트랜잭션에서 처리 또는 윈도우 함수로 단일 쿼리. `markets.get_market_detail` 등 스냅샷+보조 집계를 한 쿼리로 통합 검토. |
| 대상 파일 | `backend/app/routes/api/suggestions.py`, `backend/app/routes/api/markets.py` |
| 완료 기준 | 동일 API에 대해 평균 DB 왕복 횟수 감소(모니터링 또는 로그로 확인). |

### P2-3. 목록 API 페이지네이션

| 항목 | 내용 |
|------|------|
| 문제 | 마켓 목록 `LIMIT 500` 고정 구간 존재. |
| 수정 | `page`/`limit`(상한 캡) 또는 커서 기반 파라미터 추가. 기존 클라이언트 호환을 위해 기본값 유지 후 상한만 조정하는 점진적 방식 가능. |
| 대상 파일 | `backend/app/routes/api/markets.py` |
| 완료 기준 | 대량 데이터에서도 응답 크기·쿼리 비용 상한이 명확함. |

### P2-4. `async def` 내부 동기 DB 호출

| 항목 | 내용 |
|------|------|
| 문제 | 이벤트 루프 블로킹. |
| 수정 | 단기: `asyncio.to_thread`로 `_conn` 블록 실행. 중기: asyncpg/SQLAlchemy async로 이관하는 엔드포인트부터 단계 적용. |
| 대상 파일 | 동기 SQL을 쓰는 모든 `async def` 라우트 |
| 완료 기준 | 동시 요청 시 지연 체감 개선(벤치마크 기준은 팀 합의). |

---

## P3 — 구조·유지보수·품질

### P3-1. 요청 본문 Pydantic화

| 항목 | 내용 |
|------|------|
| 문제 | `request.json()` 수동 파싱으로 검증·OpenAPI 품질 저하. |
| 수정 | `admin` 마켓 생성, `markets` trade, `positions` 생성 등부터 Body 모델 도입. |
| 대상 파일 | 각 `routes/api/*.py` |
| 완료 기준 | `/docs`에 스키마 노출, 잘못된 본문은 422. |

### P3-2. `schemas/database.py`와 응답 정렬

| 항목 | 내용 |
|------|------|
| 수정 | 주요 GET 응답에 `response_model` 지정 또는 서비스 레이어에서 Pydantic으로 검증 후 반환. |
| 완료 기준 | 필드 누락·타입 오류를 서버에서 조기 발견. |

### P3-3. Repository(또는 DAO) 레이어

| 항목 | 내용 |
|------|------|
| 수정 | SQL 문자열을 라우터에서 분리해 `app/repositories/` 등으로 이동. 라우터는 HTTP·권한만 담당. |
| 완료 기준 | 동일 쿼리 재사용·단위 테스트 용이. |

### P3-4. Alembic 도입

| 항목 | 내용 |
|------|------|
| 수정 | 스키마 변경을 버전 관리. `migrations.py`의 DDL 문자열은 Alembic revision으로 이전. |
| 완료 기준 | 빈 DB에서 `alembic upgrade head`로 스키마 재현 가능. |

### P3-5. 스텁·경고 주석 정리

| 항목 | 내용 |
|------|------|
| 수정 | nonce 인메모리 등 운영 한계가 있는 모듈은 README 또는 모듈 docstring에 **책임·완성도** 명시. |
| 대상 파일 | `auth_pi.py` 등 |
| 완료 기준 | 신규 기여자가 프로덕션 경로를 주석 없이 파악 가능. |

### P3-6. Nonce 저장소

| 항목 | 내용 |
|------|------|
| 문제 | 인메모리 `nonce_store`는 다중 워커·재시작에 취약. |
| 수정 | Redis 등 외부 저장 + TTL, 또는 Pi 측 권장 플로우에 맞는 상태 없는 검증으로 전환. |
| 대상 파일 | `backend/app/routes/api/auth_pi.py` |
| 완료 기준 | 수평 확장 시에도 nonce 재사용·불일치 이슈 없음. |

### P3-7. 의존성 정리

| 항목 | 내용 |
|------|------|
| 수정 | `psycopg`·`asyncpg` 미사용이면 `requirements.txt`에서 제거하거나, async 이관 로드맵에 맞춰 하나로 통일. |
| 대상 파일 | `backend/requirements.txt` |
| 완료 기준 | 설치 패키지와 import가 일치. |

### P3-8. `app/db.py` asyncpg 풀

| 항목 | 내용 |
|------|------|
| 수정 | async 경로로 DB를 쓸 계획이 있으면 `main.py` lifespan에서 `init_pool`/`close_pool` 연결. 사용하지 않으면 파일 상단에 “예약” 또는 제거 결정. |
| 대상 파일 | `backend/app/main.py`, `backend/app/db.py` |
| 완료 기준 | 죽은 코드 없음 또는 명시적 로드맵 문서화. |

### P3-9. 레이트 리밋

| 항목 | 내용 |
|------|------|
| 수정 | `slowapi`, API Gateway, Nginx `limit_req` 등 팀 표준에 맞는 계층에서 로그인·공개 검색·geo API 제한. |
| 완료 기준 | 단순 스크립트 남용 시 429 또는 차단. |

### P3-10. Gunicorn workers

| 항목 | 내용 |
|------|------|
| 수정 | CPU 코어 수·DB 풀 크기와 맞춰 `workers` 조정. 풀 크기 × 워커 수 ≤ DB 허용 연결. |
| 대상 파일 | `backend/gunicorn.conf.py` |
| 완료 기준 | 부하 대비 처리량·안정성 균형. |

---

## 구현 체크리스트 (요약)

| 우선순위 | ID | 한 줄 작업 |
|----------|-----|------------|
| P0 | P0-1 | `_conn()` DSN을 `DATABASE_URL` 단일 소스로 |
| P0 | P0-2 | `migrations.py` 수정 또는 Alembic 이관 |
| P0 | P0-3 | `auth_pi` `POST /`의 `mint_jwt_token` 인자·역할 정책 정합 |
| P0 | P0-4 | 어테스테이션 async/sync·JWT sub 바인딩 |
| P1 | P1-1 ~ P1-5 | 로그·CORS·Geo·JWT iss |
| P2 | P2-1 ~ P2-4 | 풀·쿼리·페이지네이션·블로킹 |
| P3 | P3-1 ~ P3-11 | Pydantic·레이어·Alembic·nonce·authz 등 |

---

## 검증 권장

- **회귀:** 인증 플로우(`auth_pi`의 `/`·`/verify`, `verify_token`), 마켓/포지션/클레임, 관리자 해결·취소.
- **보안:** 프로덕션 빌드에서 geo 디버그 비활성, 어테스테이션 타인 조작 불가.
- **DB:** 스테이징에서 풀 크기·`max_connections` 모니터링.

---

*이 문서는 구현 우선순위 가이드입니다. 일정에 맞춰 P2/P3는 스프린트 단위로 나누면 됩니다.*
