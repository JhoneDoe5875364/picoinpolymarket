# SQLAlchemy 기반 데이터베이스 조작 전환 — 수정방안

**대상 프로젝트:** PredictPix 백엔드 (`backend/`)  
**작성 목적:** 원시 SQL + `psycopg2`/`asyncpg` 혼용 구조를 SQLAlchemy 2.0으로 정리하기 위한 실행 계획입니다.

---

## 1. 현황 요약

| 구분 | 내용 |
|------|------|
| DB | PostgreSQL (Supabase 등) |
| 애플리케이션 | FastAPI |
| 실제 사용 | `app.core.database._conn()` → `psycopg2` + `RealDictCursor`, 엔드포인트에서 `cur.execute(...)` 다수 |
| 병행 정의 | `app/db.py`에 `asyncpg` 풀(`init_pool`/`close_pool`) 및 `dsn_for_psycopg2` — **`main.py`에서 풀 생명주기 미연결로 asyncpg 경로는 비활성** |
| 스키마 표현 | `app/schemas/database.py`에 Pydantic 모델로 테이블 형태 문서화 (ORM과 분리됨) |
| 알려진 기술부채 | `core/database.py`의 `_conn()`이 `psycopg2.connect("")` 형태로, 배포 환경에 따라 DSN이 명시되지 않으면 연결 실패 가능 — **`DATABASE_URL`(또는 동일 의미 변수)과 `db.dsn_for_psycopg2` 정합** 필요 |

**SQL 문자열이 밀집한 모듈 (전환 우선 검토 대상):**

- `app/routes/api/admin.py`, `account.py`, `auth_pi.py`, `markets.py`, `positions.py`, `suggestions.py`, `users.py`
- `app/core/compliance_logger.py`, `app/core/attestation.py`
- `app/core/migrations.py` (DDL, 별도 전략 가능)

---

## 2. 전환 목표

1. **단일 접근 계층:** 세션/엔진/연결 관리를 SQLAlchemy로 통일한다.
2. **쿼리 가독성·유지보수:** 동적 SQL 문자열을 Core `select()`/`insert()`/ORM 모델 기반으로 단계적으로 치환한다.
3. **FastAPI와의 정합:** (권장) **비동기 세션**으로 이벤트 루프 블로킹을 줄인다. 현재도 `async def` 핸들러 안에서 동기 DB 호출이 있어 개선 여지가 있다.
4. **마이그레이션:** 스키마 변경은 **Alembic**으로 버전 관리한다 (수동 DDL 스크립트보다 재현성이 좋음).

---

## 3. 권장 기술 선택

### 3.1 SQLAlchemy 2.0 + 비동기 (권장)

- **구성:** `sqlalchemy[asyncio]` + `asyncpg` (드라이버)
- **장점:** FastAPI `async` 경로와 일치, `db.py`의 asyncpg 풀 개념을 **SQLAlchemy 비동기 엔진**으로 대체 가능.
- **주의:** 일부 레거시 동기 유틸은 `run_sync` 또는 소규모 동기 전용 경로로 잠시 유지할 수 있다.

### 3.2 SQLAlchemy 2.0 + 동기 (`psycopg` / `psycopg2`)

- **장점:** 마이그레이션 난이도가 상대적으로 낮음.
- **단점:** `async` 핸들러에서 동기 세션을 그대로 쓰면 이벤트 루프 블로킹이 지속됨 → **`anyio.to_thread` 등으로 감싸거나** 핸들러를 동기로 바꾸는 정책이 필요.

**본 문서에서는 비동기 스택을 기본안으로 둔다.**

---

## 4. 아키텍처 설계 (목표 구조)

```
app/
  db/
    session.py      # async_engine, async_sessionmaker, get_session()
    base.py         # DeclarativeBase
  models/           # ORM 클래스 (테이블 1:1 또는 핵심 테이블부터)
  repositories/     # (선택) UserRepository 등, 라우트에서 직접 Session 남발 방지
```

- **FastAPI `Depends`:** `AsyncSession`을 주입하는 `get_db` 패턴 적용.
- **애플리케이션 수명:** `lifespan`에서 엔진 생성/종료 (`async_engine.dispose()` 등) — 기존 `@app.on_event("startup")`를 권장되는 `lifespan` 컨텍스트로 정리할 수 있다.

---

## 5. Pydantic 모델과 ORM의 관계

- `app/schemas/database.py`의 Pydantic 모델은 **API 입출력·직렬화**에 계속 사용한다.
- ORM 모델은 **`DeclarativeBase` 서브클래스**로 두고, 필요 시 `model_validate` / `from_attributes`로 Pydantic과 변환한다.
- 한 파일에 이중 정의가 부담되면: ORM은 `app/models/`, 요청/응답 스키마는 기존 `schemas/` 유지.

---

## 6. 단계별 마이그레이션 계획

### Phase 0 — 준비 (리스크 낮음)

1. `DATABASE_URL`(및 alias)과 SQLAlchemy용 URL 정규화 규칙 확정 (`postgresql+asyncpg://...` 형태).
2. `requirements.txt`에 `sqlalchemy>=2.0`, Alembic 추가; 전환 완료 후 미사용 `asyncpg` 직접 호출 여부 검토.
3. `_conn()`을 **실제 DSN**을 쓰도록 수정하거나, Phase 1에서 즉시 제거해 세션으로만 접근.

### Phase 1 — 인프라 뼈대

1. `async_engine` / `async_sessionmaker` / `get_db()` 구현.
2. `main.py`에 `lifespan`으로 엔진·세션 팩토리 연결.
3. **건강 체크** 엔드포인트에서 `SELECT 1` 수준으로 비동기 세션 검증.

### Phase 2 — 읽기 위주·단순 쿼리 치환

우선순위 예시:

- 단독 `SELECT` 위주: `users` 목록/카운트, `suggestions` 일부.
- SQLAlchemy Core(`text()` 래핑)로 동일 SQL을 유지한 뒤, 점진적으로 `select()`로 옮김.

### Phase 3 — 쓰기·트랜잭션·복잡 쿼리

- `admin`, `account`, `markets` 등 다중 `execute`·동적 필터가 많은 모듈.
- **한 요청 단위 트랜잭션**을 `async with session.begin():`로 명시.

### Phase 4 — 보조 모듈

- `compliance_logger`, `attestation`: 로깅 특성상 실패 허용 정책과 타임아웃을 유지할 것.
- `migrations.py`: Alembic으로 이전하거나, 초기 부트스트랩 DDL만 남기고 나머지는 Alembic revision으로 통합.

### Phase 5 — 정리

- 미사용 `psycopg2` 직접 호출 제거 여부 결정.
- `app/db.py`의 레거시 `asyncpg` 풀 함수는 SQLAlchemy 엔진으로 대체 후 삭제.

---

## 7. Alembic

1. `alembic init` 후 `env.py`에서 `async` 엔진 연동 (SQLAlchemy 공식 async Alembic 패턴 참고).
2. **초기 revision:** 현재 운영 스키마(`predictpix_structure_*.sql` 또는 실 DB)와 `target_metadata` 일치 확인.
3. 이후 컬럼·인덱스 변경은 모두 revision으로만 반영.

---

## 8. 리스크 및 완화

| 리스크 | 완화 |
|--------|------|
| 동적 `ORDER BY` / 문자열 조합 SQL | 화이트리스트 컬럼명 유지, Core `column()` + `getattr` 또는 `literal_column` 신중 사용 |
| PostgreSQL 특화 타입 (`JSONB`, `array`, `UUID`) | SQLAlchemy 타입 매핑 명시 (`JSONB`, `ARRAY`, `Uuid` 등) |
| Supabase RLS / 권한 | 연결 역할·정책은 기존과 동일; ORM만 바뀌는지 통합 테스트 |
| 성능 회귀 | N+1 방지(`selectinload` 등), 슬로우 쿼리 로깅 |

---

## 9. 검증 체크리스트

- [ ] 모든 라우트에서 `_conn()` / `RealDictCursor` 제거
- [ ] 스테이징에서 주요 API 스모크 + 부하 샘플
- [ ] Alembic upgrade/downgrade 한 사이클
- [ ] 환경 변수 문서 (`DATABASE_URL`, async URL) 업데이트

---

## 10. 요약

현재 백엔드는 **psycopg2 + 수동 SQL**이 중심이며, **asyncpg 풀은 미연결** 상태입니다. SQLAlchemy 2.0 **비동기 스택**으로 연결·세션·쿼리 빌더를 통일하고, Pydantic 스키마는 API 계층에 유지하는 구성이 유지보수와 FastAPI 특성에 가장 잘 맞습니다. 단계적(읽기 → 쓰기 → 보조/마이그레이션)으로 옮기면 서비스 중단 리스크를 줄일 수 있습니다.
