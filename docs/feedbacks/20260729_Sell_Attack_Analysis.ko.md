# 매도(SELL) 기능 공격 시나리오 분석 — 취약점 실측 검증

> 작성일: 2026-07-29
> 대상: `POST /api/positions/{id}/sell` ([positions.py](../../backend/app/routes/api/positions.py))
> 방식: 실제 구현 코드의 검증 순서·트랜잭션 경계·경합 지점을 라인 단위로 추적
> 배경: 매도는 **앱 지갑에서 실제 코인이 나가는(A2U)** 기능이라, 취약점이 곧 직접 금전 손실이다.

---

## 요약 (심각도 순)

| # | 취약점 | 심각도 | 유형 | 결과 |
|---|---|---|---|---|
| V1 | **send/settle 갭 이중 인출** — 트랜잭션 A 커밋 후 포지션 잠금이 풀린 상태에서 송금이 일어남 | 🔴 치명적 | 경합(TOCTOU) | 같은 포지션을 여러 번 팔아 앱 지갑에서 초과 인출 |
| V2 | **멱등성 체크의 원자성 결여** — idempotency 조회가 트랜잭션 밖 + create_pending 사이에 창(window) 존재 | 🔴 치명적 | 경합 | 같은 `sell_request_id` 동시 요청 2건이 둘 다 송금 |
| V3 | **PENDING 고착 → 영구 매도 불가(DoS)** | 🟠 높음 | 가용성 | settle 중 크래시 시 해당 포지션 재매도 영구 차단 |
| V4 | **가격 조작(워시 트레이딩)** — 얇은 유동성에서 자기 매수로 가격 띄우고 고가 매도 | 🟠 높음 | 경제 | 앱 지갑에서 순유출 차익 실현 |
| V5 | **dev 인증 우회 시 임의 사용자 사칭 송금** | 🟠 높음 | 인증 | `ENVIRONMENT=development`면 누구나 superadmin으로 송금 유발 |
| V6 | **회계 미스매치 — 저가 매수→고가 매도 무위험 차익** | 🟡 중간 | 경제 | AMM 구조상 앱 지갑 순유출 |
| V7 | **음수/미세수량·정밀도 악용** 여지 | 🟡 중간 | 입력검증 | 수수료 라운딩·초소액 스팸 |

**V1·V2는 실제로 앱 지갑을 비울 수 있는 치명적 결함이며, 현재 코드에 존재한다.**

---

## V1. send/settle 갭 이중 인출 (치명적) 🔴

### 근거 코드
- 트랜잭션 A에서 `lock_position(FOR UPDATE)`로 포지션을 잠금 ([positions.py:112](../../backend/app/routes/api/positions.py#L112))
- 그러나 트랜잭션 A는 `async with db.begin()` 블록이 **커밋되면서 잠금이 해제**됨 ([positions.py:111-175](../../backend/app/routes/api/positions.py#L111))
- 송금(`send_payout`)은 **트랜잭션 밖**에서 실행 ([positions.py:186](../../backend/app/routes/api/positions.py#L186))
- 포지션 차감(`reduce_market_position`)은 **트랜잭션 B**에서 비로소 실행 ([positions.py:218](../../backend/app/routes/api/positions.py#L218))

### 문제
포지션 잠금이 **송금 구간 동안 유지되지 않는다.** 즉:

```
[요청1] Tx A: 포지션 10주 확인·잠금 → 커밋(잠금 해제) → 송금 시작(수 초 소요)
[요청2]                              Tx A: 포지션 여전히 10주로 보임 → 커밋 → 송금 시작
[요청1]                                                              Tx B: 10→0 차감
[요청2]                                                              Tx B: (이미 0인데) ...
```

두 요청이 **서로 다른 `sell_request_id`** 로 거의 동시에 들어오면, 둘 다 트랜잭션 A에서 "10주 보유"를 통과하고 **각자 송금**한다. 포지션 차감(Tx B)은 송금이 끝난 뒤에야 일어나므로, **10주짜리 포지션으로 20주어치 Pi가 앱 지갑에서 나간다.**

### 완화 요소 (부분적)
- 트랜잭션 B의 `reduce_market_position`이 다시 `FOR UPDATE`로 잠그고 `sell > current_shares`를 재검사 ([market.py:267](../../backend/app/core/market.py#L267))
- 따라서 **두 번째 요청의 Tx B는 실패**한다(잔여 0). 하지만 **송금은 Tx B 이전에 이미 나갔다** ([positions.py:186](../../backend/app/routes/api/positions.py#L186) → [positions.py:229](../../backend/app/routes/api/positions.py#L229) 순서). Tx B 실패는 500 에러 + `mark_failed(txid=...)`로 기록될 뿐, **나간 코인은 회수되지 않는다.**

### 공격 시나리오
1. 공격자가 10주 YES 포지션 보유
2. 동일 포지션에 대해 **서로 다른 sell_request_id로 N개 요청을 병렬 전송**
3. 각 요청이 Tx A(잠금→해제)를 통과 → 각자 `send_payout`으로 실제 송금
4. 첫 요청만 Tx B 성공(차감), 나머지는 500이지만 **이미 N배 송금 완료**
5. 결과: 10주 매도 대금 × N배가 앱 지갑에서 유출

### 재현 난이도
낮음. `curl`/스크립트로 동일 position_id에 서로 다른 uuid를 넣어 동시 POST하면 된다. 실측 로그에서 매도 처리에 ~5초(01:46:33→38)가 걸렸으므로, 경합 창이 충분히 넓다.

### 수정 방향
- **포지션 잠금을 송금 구간까지 유지**하거나(단일 트랜잭션 내에서 "차감 예약" 후 송금), 
- **송금 전에 포지션을 먼저 차감(예약)** 하고 실패 시 롤백하는 구조로 전환. 즉 "차감 → 송금 → 실패 시 복구"가 이중지출에 더 안전하다(단 이 경우 송금 실패 복구가 필요).
- 또는 **포지션당 `pending_sell` 플래그/잠금 레코드**를 Tx A에서 세워, 송금 완료 전까지 같은 포지션의 새 매도를 거부.

---

## V2. 멱등성 체크의 원자성 결여 (치명적) 🔴

### 근거 코드
```python
existing = await sell_repo.get_by_request_id(db, sell_request_id=...)  # 조회
await db.rollback()                                                     # 트랜잭션 종료
if existing is not None: ...                                            # 있으면 반환
# ↓↓↓ 여기에 창(window)이 있다 ↓↓↓
async with db.begin():
    ...
    await sell_repo.create_pending(db, sell_request_id=..., ...)        # 이때 비로소 INSERT
```
([positions.py:93-94](../../backend/app/routes/api/positions.py#L93), [positions.py:163](../../backend/app/routes/api/positions.py#L163))

### 문제
멱등성 판단(`get_by_request_id`)과 실제 삽입(`create_pending`) **사이에 시간 간격**이 있고, 그 사이는 어떤 잠금도 없다. **같은 `sell_request_id`로 두 요청이 동시에** 들어오면:
- 둘 다 `get_by_request_id` → `None`(아직 삽입 전)
- 둘 다 Tx A 진입 → **둘 다 `create_pending` 시도**

`sell_settlements.sell_request_id`에 **UNIQUE 제약**은 있다([sell_settlement.py:32](../../backend/app/models/tables/sell_settlement.py#L32)). 그래서 두 번째 INSERT는 DB에서 **IntegrityError**로 실패한다. 하지만:
- 그 실패는 `create_pending`에서 잡히지 않고 [positions.py:180](../../backend/app/routes/api/positions.py#L180)의 `except Exception → 500`으로 처리됨 → **정상 거부되는 것처럼 보임**
- **그러나** 두 Tx A가 **완전히 병렬로 커밋에 성공한 뒤 각자 송금 단계로 넘어갈 수 있는 인터리빙**이 존재한다. UNIQUE는 커밋 시점에만 강제되므로, 타이밍에 따라 한쪽이 커밋 성공→송금 진입한 뒤 다른 쪽이 커밋에서 실패할 수도, 혹은 둘 다 커밋 전이면 하나만 살아남는다.

결론적으로 V2는 **UNIQUE 제약 덕분에 V1보다 방어가 낫지만**, "조회 후 삽입" 사이에 잠금이 없어 **경합 안전을 UNIQUE 예외 처리에 전적으로 의존**한다. 그리고 그 예외가 `create_pending`에서 **명시적으로 구분 처리되지 않아**(그냥 500), 재시도 클라이언트가 같은 id로 다시 쏘면 이제 `get_by_request_id`가 `FAILED`를 반환해 409가 되는 등 **상태가 꼬인다**.

### 핵심
V2 자체로 이중 송금이 나긴 어렵지만, **V1(다른 id)** 과 결합하면 방어선이 UNIQUE 하나뿐이라 취약하다. 그리고 idempotency를 **트랜잭션 밖에서** 판정하는 설계는 원칙적으로 잘못됐다 — 조회와 삽입이 같은 트랜잭션·같은 잠금 안에 있어야 한다.

### 수정 방향
- `create_pending`을 **`INSERT ... ON CONFLICT (sell_request_id) DO NOTHING RETURNING`** 으로 바꾸고, 삽입 실패(=이미 존재) 시 그 자리에서 "이미 처리 중/완료"로 분기. 조회·삽입을 한 문장으로 원자화.
- idempotency 조회의 `await db.rollback()`([positions.py:94](../../backend/app/routes/api/positions.py#L94))을 없애고 Tx A 안으로 편입.

---

## V3. PENDING 고착 → 영구 매도 불가 (DoS) 🟠

### 근거 코드
- 멱등성 분기에서 `status == "PENDING"`이면 **무조건 409** ([positions.py:103-104](../../backend/app/routes/api/positions.py#L103))
- `status == "FAILED"`여도 **409 "use a new request id"** ([positions.py:105](../../backend/app/routes/api/positions.py#L105))

### 문제
- Tx A에서 `create_pending`(PENDING 기록)까지 성공한 뒤 **송금 직전/직후에 프로세스가 죽으면**, 그 settlement는 **영구히 PENDING**으로 남는다.
- 이후 **같은 sell_request_id** 재시도는 409(처리 중)로 영구 거부.
- 클라이언트가 **새 sell_request_id**로 재시도해도, V1의 포지션은 그대로이므로 매도 자체는 가능하다. 하지만 **PENDING 레코드는 정리되지 않고**, 운영자가 그게 "실제 송금됐는지" 알 수 없어 수동 대조가 필요하다.
- 더 나쁜 경우: 송금은 성공했으나 Tx B 실패 → `mark_failed(txid=...)` 기록([positions.py:238](../../backend/app/routes/api/positions.py#L238)). 이때 **포지션은 차감 안 됐는데 코인은 나갔다.** 사용자가 새 id로 다시 팔면 **또 송금** → V1과 동일한 이중 인출.

### 수정 방향
- PENDING 레코드에 **타임아웃/재조정 배치**를 두어, Pi API로 실제 송금 여부를 확인 후 SETTLED/FAILED로 확정.
- FAILED(txid 있음)는 "송금됨·미차감" 상태로 분류해 **자동으로 포지션 차감을 복구**(같은 txid 재사용, 재송금 금지).

---

## V4. 가격 조작 / 워시 트레이딩 🟠

### 근거 코드
- 매도가는 **매도 시점의 라이브 마켓가**를 그대로 사용 ([positions.py:132](../../backend/app/routes/api/positions.py#L132))
- AMM은 매수가 풀에 pi_amount를 더해 **가격을 올리고**, 매도는 빼서 내린다 ([market.py:137](../../backend/app/core/market.py#L137), 방식 A)
- **1인당 매도 한도·최소 유동성·워시 방지 정책이 없음**

### 문제
얇은 유동성 마켓에서:
1. 공격자가 대량 매수 → 그 아웃컴 가격이 급등
2. 즉시 대량 매도 → 오른 가격으로 순수령액 산정
3. 매수로 낸 돈 + 매도로 받은 돈의 차액이 **앱 지갑에서 나간다**(AMM이 자기 자신과 거래하는 구조라, 스프레드/수수료가 이 유출을 못 덮으면 순손실)

이는 예측시장 AMM의 고전적 문제이며, **매도가 열리기 전(매수만)에는 발생하지 않던 유출**이다.

### 수정 방향
- 최소 유동성 임계, 1거래·1인당 매도 상한, 매수-매도 시간차 제한(쿨다운), 동적 스프레드.
- **회계 시뮬레이션(V6)과 함께** 매도 오픈 전 필수 검증.

---

## V5. dev 인증 우회 시 임의 송금 🟠

### 근거 코드
```python
async def verify_token(request):
    if Config.ENVIRONMENT == "development":
        return {"sub": "1", "role": "superadmin"}   # 인증 완전 생략
```
([security.py:31-36](../../backend/app/core/security.py#L31))

### 문제
- `ENVIRONMENT=development`면 **토큰 없이도 user_id=1로 인증 통과**.
- 매도는 `user_id`로 포지션 소유를 판단하므로, dev 모드에선 **누구나 user 1의 포지션을 매도**시켜 그 지갑으로 송금을 유발할 수 있다.
- 현재 프로덕션 `.env`는 `ENVIRONMENT=production`이라 **지금은 안전**하나([.env 확인됨](../../backend/.env)), 실수로 development로 바뀌거나 스테이징이 노출되면 **무단 송금**이 된다.
- 매수(U2A)는 사용자가 돈을 내는 방향이라 이 우회가 앱에 금전 피해를 안 줬지만, **매도(A2U)는 정반대**라 이 우회의 위험이 급상승한다.

### 수정 방향
- 매도·A2U 같은 **송금 경로는 development 우회에서 제외**(항상 실인증 요구).
- `PROGRESS_LOG`에도 배포 전 선결로 명시되어 있음.

---

## V6. 회계 미스매치 — 무위험 차익 🟡

### 근거
- 매수 회계가 "주당 `price` 받고 정산 시 `1` 지급" 구조라 **이미 적자 소지**가 문서화됨 ([PROGRESS_LOG.md:142](../PROGRESS_LOG.md#L142))
- 매도는 여기에 **중간 청산 경로**를 추가한다. 사용자가 저가(예: 0.3)에 매수 후 가격이 오르면(0.7) 매도해 차액을 즉시 실현 → 그 차액은 앱 지갑 부담.

### 문제
매수만 있을 땐 "시장 해결 시 1회 정산"이라 손익이 마켓 종료 시점에 확정됐다. 매도가 열리면 **아무 때나 유리한 가격에 빠져나갈 수 있어**, 앱 지갑의 순유출 위험이 상시화된다.

### 수정 방향
- 매도 오픈 전 **AMM 유동성·수수료가 지출을 커버하는지 시뮬레이션**(설계서 §4-1). 수수료율/스프레드 재설계 가능성.

---

## V7. 입력·정밀도 악용 🟡

### 근거 코드
- `sell_shares: float = Field(..., gt=0)` — Pydantic이 0 이하는 막지만 **float**이다 ([positions.py:54](../../backend/app/routes/api/positions.py#L54))
- 이후 `Decimal(str(...))` + `quantize(0.0001)`로 정규화 ([market.py:247](../../backend/app/core/market.py#L247))

### 문제 (경미)
- **초소액 스팸**: `sell_shares=0.0001`짜리 매도를 대량 반복 → 각 건이 A2U 송금(온체인 수수료 발생) 유발. 앱 지갑의 **네트워크 수수료가 야금야금 소모**된다(수령액보다 체인 수수료가 클 수 있음).
- **라운딩**: `net_payout = gross - fee`에서 `quantize(ROUND_HALF_UP)` 누적 시, 다수 초소액 거래로 미세하게 유리한 라운딩을 노릴 여지(실익은 작음).
- float 파싱 자체는 `Decimal(str(...))`로 감싸 정밀도 손실은 방지됨(양호).

### 수정 방향
- **최소 매도 수량/최소 순수령액** 하한(예: net_payout ≥ 체인수수료 × k) 설정. 1인당 매도 rate limit.

---

## 추가 관찰 (취약점은 아니나 위험)

- **`update_market_price`의 volume 누적**: 매도도 volume을 더한다([market.py:107-115](../../backend/app/core/market.py#L107)). 워시 트레이딩으로 **거래량 지표를 인위적으로 부풀려** 마켓을 상위 노출시키는 데 악용 가능(V4의 부수효과).
- **에러 정보 노출**: 500 응답에 `txid`를 그대로 반환([positions.py:249](../../backend/app/routes/api/positions.py#L249)). 운영 편의는 있으나, 사용자에게 내부 정산 상태를 노출한다.

---

## 수정 반영 현황 (2026-07-29)

| # | 상태 | 조치 |
|---|---|---|
| V1 | ✅ 수정됨 | 송금 전 포지션 선차감(단일 Tx). 실패 시 `restore_market_position` 복구, `PAYING` 상태 |
| V2 | ✅ 수정됨 | `create_reserved` = `ON CONFLICT (sell_request_id) DO NOTHING` |
| V3 | ✅ 수정됨 | 송금실패→복구+FAILED, 송금후 마킹실패→PAYING+txid(대조) |
| V5 | ✅ 수정됨 | `verify_token_strict` — dev 우회 배제 |
| V4 | ✅ 완화 | `SELL_MIN_MARKET_LIQUIDITY`(최소 유동성), `SELL_COOLDOWN_SECONDS`(라운드트립 쿨다운). 기본 0=비활성, env로 켬 |
| V6 | ✅ 완화 | V4 쿨다운으로 즉시 저가매수→고가매도 차익 차단. 근본 회계는 별도 시뮬레이션 필요 |
| V7 | ✅ 수정됨 | `SELL_MIN_SHARES`(1), `SELL_MIN_NET_PAYOUT`(0.1π), `SELL_RATE_MAX`(10/60s) |

**남은 근본 과제:** V6의 회계 구조(주당 price 받고 1 지급, [PROGRESS_LOG.md:142](../PROGRESS_LOG.md#L142))는 정책 가드로 완화만 했을 뿐 근본 해결이 아니다. 매도를 mainnet(실 Pi)으로 승격하기 전 **AMM 수수료·스프레드가 앱 지갑 순유출을 커버하는지 시뮬레이션**이 필요하다.

---

## 우선순위 결론

**매도를 프로덕션(실자금)에 열기 전 반드시 막아야 할 것:**

1. 🔴 **V1 (send/settle 갭 이중 인출)** — 포지션 잠금을 송금 구간까지 확장하거나 "차감 선행" 구조로 전환. **이게 없으면 앱 지갑이 병렬 요청으로 털린다.**
2. 🔴 **V2 (멱등성 원자화)** — `create_pending`을 `ON CONFLICT DO NOTHING`으로, 조회·삽입을 한 트랜잭션에.
3. 🟠 **V5 (dev 우회 제외)** — A2U 경로는 항상 실인증.
4. 🟠 **V3 (PENDING/FAILED 재조정)** — 송금됨·미차감 자동 복구 배치.
5. 🟠 **V4 + 🟡 V6 (경제/회계)** — 유동성·한도·시뮬레이션.
6. 🟡 **V7** — 최소 수량·rate limit.

**V1·V2가 해결되기 전에는 매도를 testnet 이상(실 Pi)으로 승격하면 안 된다.** 현재 testnet 실측이 성공한 것은 "동시 요청을 하지 않았기 때문"이지, 코드가 경합에 안전해서가 아니다.

---

## 실측 검증 상태

| 시나리오 | 검증 방법 | 상태 |
|---|---|---|
| 정상 매도 (단일 요청) | testnet 실거래, txid `630d10bb…` | ✅ 성공 확인 |
| 초과 매도(단일) | `reduce_market_position`의 `sell > shares` 가드 | ✅ 코드상 차단 |
| 마감 마켓 매도 | `market_status != "open"` 가드 | ✅ 코드상 차단 |
| Pi 미연동 | `pi_uid` 없음 → 400 | ✅ 코드상 차단 |
| **V1 병렬 이중 매도** | 서로 다른 uuid 동시 POST | ❌ **미차단(취약)** |
| **V2 동일 uuid 경합** | 같은 uuid 동시 POST | ⚠️ UNIQUE에만 의존 |
| V3 PENDING 고착 | settle 중 크래시 주입 | ❌ 복구 로직 없음 |

> 주의: V1은 실 자금 손실을 유발하므로 **testnet에서만**, 그리고 앱 지갑 잔액을 최소화한 상태에서 재현 검증할 것.
