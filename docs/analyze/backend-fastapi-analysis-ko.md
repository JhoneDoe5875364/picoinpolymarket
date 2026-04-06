# PredictPix Backend (FastAPI) 코드베이스 분석 보고서

**분석 대상:** `backend/` (FastAPI 앱, 라우터, DB 접근, 보안·지오 관련 모듈)  
**작성 목적:** 유지보수성, 가독성, DB 부하·공격 방어, DB 조작 시 모델(스키마) 사용 여부 등 다각도 점검  
**재분석 일자:** 2026-03-24 (저장소 스냅샷 기준)  
**참고:** 배포 환경의 `.env`·인프라 설정은 포함하지 않습니다.

---

## 1. 요약

| 영역 | 평가 | 한 줄 요약 |
|------|------|------------|
| 구조 | 보통 | 라우터·코어 모듈 분리는 되어 있으나 DB 레이어가 단일 `_conn()`에 집중되고, `app/db.py`의 풀과 실제 사용 경로가 분리됨 |
| 가독성 | 보통 | 일부 파일에 스텁 성격 주석·동기/비동기 혼용으로 의도 파악이 어려운 구간 존재 |
| DB 부하 | 주의 | 요청당 다중 연결·순차 쿼리, 고정 `LIMIT 500` 목록 API, 커넥션 풀 미사용(psycopg2 직접 연결) |
| 보안 | 주의 | 시크릿 로깅, 디버그·지오 API의 정보 노출 가능성, JWT 검증 메시지 노출, 어테스테이션·Pi 인증 경로 구현 결함 |
| 스키마/모델 | 참고용 | `schemas/database.py`는 Pydantic 문서화에 가깝고, 쿼리 결과 검증·ORM과는 연결 약함 |
| 미사용 코드 | 참고 | `app/authz.py`(Supabase Bearer 검증)는 라우터에 연결되지 않음 |

**즉시 조치 권장:** `app/core/database.py`의 DSN 설정, `app/core/migrations.py`의 import·비동기 오류, `auth_pi`의 `POST /`에서 `mint_jwt_token` 호출(키워드·인자 개수·`role` 타입), `attestation` 라우트의 `await`와 동기 서비스 불일치.

---

## 2. 아키텍처 개요

- **진입점:** `app/main.py` — FastAPI 인스턴스, CORS, Geo 미들웨어, `startup`에서 `include_all_routers`.
- **라우팅:** `app/routes/api/__init__.py`에서 `/api` 프리픽스로 `users`, `account`, `admin`, `auth_pi`, `pi`, `markets`, `positions`, `suggestions`, `geo`, `attestation`, `health` 등록.
- **DB 접근:** 대부분 `psycopg2` + `app.core.database._conn()` + 인라인 SQL.
- **보조 모듈:** `app/core/security.py`(JWT), `app/middleware/geo_middleware.py`(지역 차단·상태 주입), `compliance_logger`, `tier_engine`, `ip_resolver` 등.

`app/db.py`에는 `asyncpg` 풀(`init_pool` / `close_pool`)과 `dsn_for_psycopg2`가 정의되어 있으나, `main.py`에서 풀 초기화·종료(lifespan)가 연결되어 있지 않아 **asyncpg 풀 경로는 미사용**입니다.

---

## 3. 유지보수성

### 3.1 강점

- **기능별 라우터 분리:** 마켓·포지션·관리자·계정·지오·어테스테이션 등 경계가 비교적 명확합니다.
- **관리자 쿼리의 정렬 컬럼 화이트리스트:** `admin.py` 등에서 `sort_by` / `order`를 허용 집합으로 제한해 SQL 조각 주입을 완화한 패턴이 있습니다.
- **트랜잭션 사용:** 마켓 생성, 포지션/클레임, 마켓 취소·해결 등에서 `commit` / `rollback`을 시도하고 있습니다.
- **일부 Pi 인증:** `PiAuthRequest`, `VerifyRequest` 등 Pydantic 모델 사용.

### 3.2 리스크

1. **단일 연결 팩토리 의존**  
   모든 모듈이 `from app.core.database import _conn`에 의존합니다. 풀링·타임아웃·재시도·메트릭을 한곳에서 바꾸기 어렵고, 테스트 시 목(mock) 주입도 불편합니다.

2. **스텁·경고 주석이 남은 파일**  
   `auth_pi.py`의 인메모리 nonce 등 운영 한계가 주석으로만 남아 있고, `admin`·`account` 등 일부 모듈에 완성도 표시가 부족할 수 있습니다.

3. **마이그레이션 모듈**  
   `app/core/migrations.py`는 `_conn`, `RealDictCursor`를 import하지 않으며, `psycopg2` 커서에 `await conn.execute(...)`(asyncpg 스타일)를 호출합니다. **실행 시 실패**합니다. DDL을 여러 문장 한 번에 `execute`하는 부분도 드라이버·설정에 따라 깨질 수 있어, Alembic 등 외부 마이그레이션으로 이관하는 편이 안전합니다.

4. **요구 패키지 중복**  
   `requirements.txt`에 `psycopg`와 `psycopg2`가 함께 있으나, 라우트·코어 경로는 `psycopg2` 중심입니다. `asyncpg`는 풀이 main에 연결되지 않아 실질 사용 여부가 제한적입니다.

---

## 4. 코드 가독성

### 4.1 양호한 점

- `positions.py`처럼 입력 검증·도메인 계산을 함수로 분리한 부분은 읽기 좋습니다.
- `geo.py`는 Pydantic 응답 모델을 사용해 OpenAPI와 응답 형태가 분명합니다.

### 4.2 개선 여지

- **동기 DB를 `async def` 안에서 직접 호출:** 이벤트 루프를 블로킹합니다. 동시 요청이 많을 때 지연과 타임아웃이 증가할 수 있습니다.
- **`request.json()` 직접 파싱:** 다수 엔드포인트가 Pydantic Body 대신 수동 JSON 파싱을 사용합니다. 검증 규칙이 분산되고 OpenAPI 스키마 품질이 떨어집니다.
- **어테스테이션 라우트:** `AttestationService`의 메서드는 동기 `def`인데, 라우트에서 `await attestation_service.create_attestation(...)` 등으로 호출합니다. 동기 함수의 반환값(`bool` 등)은 await 대상이 아니므로 **런타임에서 `TypeError`가 납니다.**

---

## 5. DB 부하 및 쿼리 패턴

### 5.1 연결·풀링

- `app/core/database.py`는 여전히 `psycopg2.connect("")`로 **빈 DSN** 연결을 시도합니다. 로컬에서 `PG*` 환경변수로 libpq가 채워지는 경우를 제외하면 오류·잘못된 연결로 이어질 수 있습니다. `app/db.py`의 `DATABASE_URL` 기반 `dsn_for_psycopg2`와 **역할이 중복**되어 있습니다.  
- **권장:** 단일 설정 소스로 `_conn()`을 통일하고, `psycopg2.pool` 또는 `psycopg` 풀로 연결 수를 제한합니다.

### 5.2 요청당 쿼리 수

- **목록 + 카운트:** `suggestions.py` 공개 목록은 데이터 조회 후 **별도 연결**로 `COUNT(*)`를 실행합니다.
- **마켓 상세:** 스냅샷과 보조 카운트 등 순차 쿼리 패턴이 남아 있으면 왕복을 줄일 여지가 있습니다.
- **플랫폼 통계:** `admin`의 `platform_state` 등은 동일 커서로 순차 실행하는 형태가 많습니다.

### 5.3 대량 조회

- `markets.py`의 열린/해결 마켓 목록은 `LIMIT 500` 고정 구간이 있습니다. 트래픽이 크면 메모리·전송량·DB 정렬 비용이 커질 수 있어 페이지네이션·커서 API를 권장합니다.

### 5.4 인덱스·뷰 의존

- `v_market_snapshots`, `v_portfolio_open_markets`, `v_leaderboard` 등 **뷰에 강하게 의존**합니다. 뷰 정의와 인덱스가 API 계약의 일부이므로 DB 변경 시 백엔드와 함께 버전 관리하는 것이 좋습니다.

---

## 6. 공격 방어 및 보안

### 6.1 SQL 인젝션

- 사용자 입력이 들어가는 `sort_by` 등은 다수 화이트리스트 처리되어 있습니다.
- `ILIKE` 검색에 파라미터 바인딩을 사용하는 패턴은 상대적으로 안전합니다.
- 동적 SQL 조립 구간은 값만 바인딩하는지 지속 점검이 필요합니다.

### 6.2 인증·인가

- **JWT:** `verify_token`에서 `audience` 검증을 수행합니다. `issuer`는 페이로드에 `iss`를 넣어 발급하지만, `decode` 시 `issuer` 강제 검증은 하지 않습니다.
- **에러 메시지:** `detail=f"Invalid token: {e}"`로 예외 문자열을 그대로 반환하면 **내부 정보 유출** 가능성이 있습니다.

### 6.3 시크릿·로깅

- `mint_jwt_token`에서 **JWT 시크릿·issuer·audience·알고리즘을 로그에 출력**합니다. 운영 로그에 시크릿이 남지 않도록 제거해야 합니다.

### 6.4 CORS

- `ALLOWED_ORIGINS` 기본값이 `http://localhost:9002`로 설정되어 있어, **환경변수 미설정 시에는** 과거 문서에서 가정한 “즉시 `*`”보다는 한 단계 보수적입니다.  
- 다만 `origins`가 빈 리스트가 되면(`ALLOWED_ORIGINS=`처럼 의도적으로 비운 경우 등) `origins or ["*"]`로 **`allow_origins=["*"]`**가 되고 `allow_credentials=True`와의 조합은 여전히 검토가 필요합니다.

### 6.5 지오·디버그 API

- `GET /api/geo/debug/headers`는 **요청 헤더 전체를 반환**합니다. 프로덕션에서 인증 없이 노출되면 `Authorization`, 쿠키, 내부 프록시 헤더 등이 유출될 수 있습니다.
- `POST /api/geo/check`에서 `body.ip`로 임의 IP를 넣을 수 있으면 **정찰(reconnaissance)** 용도로 악용될 수 있습니다. 속도 제한·인증·허용 범위 제한을 권장합니다.

### 6.6 어테스테이션 API

- `POST /api/attestation/confirm`은 본문의 `user_id`만 신뢰합니다. JWT `sub`와 일치 검증이 없으면 **타인 ID로 기록**이 가능해 감사 추적 신뢰도가 떨어집니다.
- `GET /api/attestation/status/{user_id}`는 **임의 사용자의 어테스테이션 존재 여부**를 노출할 수 있습니다.

### 6.7 Pi 인증 구현 (`auth_pi.py`)

- **`POST /api/auth/pi/`:** `mint_jwt_token(uid=uid, username=username, role=roles)` 호출은 `security.mint_jwt_token(user_id, username, role, pi_access_token)` 시그니처와 **맞지 않습니다.** (`uid` 키워드는 존재하지 않는 인자명, 네 번째 인자 `pi_access_token` 누락, `role`에 문자열이 아닌 `roles` 리스트 전달.) 런타임에서 예외가 나거나 잘못된 토큰 설계로 이어집니다.
- **`POST /api/auth/pi/verify`:** 동일 함수를 위치 인자로 올바르게 호출하는 경로가 있어, **`/`와 `/verify` 동작이 불일치**합니다.

### 6.8 기타

- **`require_tester`:** Bearer 값을 “핸들”로만 취급하며 암호학적 검증이 없습니다. 테스트 전용이라면 환경 분리·경로 프리픽스가 필요합니다.
- **레이트 리밋:** 코드베이스 상 전역 레이트 리밋 미들웨어는 보이지 않습니다.
- **`authz.py`:** Supabase 검증은 구현되어 있으나 라우터에 미연결 — 향후 연동 시 이중 인증 정책(JWT vs Supabase)을 명확히 할 필요가 있습니다.

---

## 7. DB 조작과 모델(Pydantic) 사용

### 7.1 `schemas/database.py`

- 테이블 구조를 반영한 **Pydantic 모델**로 문서·직렬화 계약을 나타냅니다.
- 실제 라우터에서는 대부분 `RealDictCursor` 결과를 그대로 반환하는 경우가 많고, **응답 시 해당 모델로 강제 검증하지는 않습니다.**
- **ORM(SQLAlchemy 등) 레이어는 없음** — 삽입/갱신은 수동 SQL입니다.

### 7.2 권장 방향 (선택)

- 쓰기 경로에 **Pydantic 입력 모델**을 두고 검증을 모읍니다.
- 또는 SQLAlchemy 2.0 + Alembic으로 스키마와 쿼리를 통합합니다.

---

## 8. 운영·스택 메모

- **의존성(예):** `fastapi==0.115.14`, `pydantic==2.11.7`, `starlette==0.40.0` (`requirements.txt` 기준).
- **Gunicorn:** `gunicorn.conf.py`에서 `workers = 1` — 트래픽 증가 시 확장 계획이 필요합니다.
- **Nonce 저장소:** `auth_pi`의 `nonce_store`는 메모리 딕셔너리로, 재시작·수평 확장 시 재사용·불일치 위험이 있습니다.

---

## 9. 우선순위 권장 조치

1. **P0 — 동작 보장:** `database._conn()` DSN을 `DATABASE_URL` 등 단일 소스로 수정; `migrations.py` import·동기/비동기 정리.  
2. **P0 — 인증:** `POST /api/auth/pi/`의 `mint_jwt_token` 호출을 시그니처·역할 문자열·Pi 액세스 토큰 전달 정책에 맞게 수정.  
3. **P0 — 어테스테이션:** 라우트의 `await` 제거 또는 서비스를 `async`로 통일; `confirm`에서 JWT `sub`와 `user_id` 일치 강제.  
4. **P1 — 보안:** 시크릿 로그 제거, `geo/debug`·`geo/check` 노출 범위 축소, 토큰 오류 메시지 일반화, CORS 빈 목록 시 `*` 동작 검토.  
5. **P2 — 성능:** 커넥션 풀, 목록 API 페이지네이션, async 라우트의 블로킹 완화.  
6. **P3 — 구조:** Repository/Service 레이어, Pydantic 요청/응답 확대, Alembic, `authz.py` 연동 여부 결정.

---

## 10. 주요 파일 맵 (분석 시 참고)

| 경로 | 역할 |
|------|------|
| `app/main.py` | 앱 생성, CORS, Geo 미들웨어, 라우터 마운트 |
| `app/core/database.py` | psycopg2 `_conn()` (DSN 설정 점검 필요) |
| `app/db.py` | asyncpg 풀·DSN 헬퍼 (main과 미연결) |
| `app/core/security.py` | JWT 검증/발급, 관리자 API 키, `require_tester` |
| `app/routes/api/*.py` | REST 엔드포인트 |
| `app/schemas/database.py` | 테이블 형상 Pydantic (주로 문서·계약) |
| `app/middleware/geo_middleware.py` | 지역 기반 차단·상태 주입 |

---

*본 보고서는 코드 정적 분석에 기반합니다. 실제 동작은 배포 환경의 DB 뷰, 환경 변수, 리버스 프록시 설정에 따라 달라질 수 있습니다.*
