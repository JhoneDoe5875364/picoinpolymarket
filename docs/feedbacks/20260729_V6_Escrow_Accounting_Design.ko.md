# P0 — 에스크로 회계 재설계 설계서 (V6 근본 해결)

> 작성일: 2026-07-29
> 목적: "승리 정산 시 앱 지갑이 매번 적자"인 근본 결함(V6-C)을 회계 모델 자체를 고쳐 해결
> 근거: [20260729_V6_Accounting_Simulation.ko.md](20260729_V6_Accounting_Simulation.ko.md) 시나리오 C — 유동성 무관 −49π 고정 손실
> 관련 코드: [resolve_market](../../backend/app/repositories/admin.py#L247), [get_payout_target](../../backend/app/repositories/admin.py#L786), [pi.py complete](../../backend/app/routes/api/pi.py#L137), [positions.py sell](../../backend/app/routes/api/positions.py)

---

## 0. 문제 재정의

### 지금의 (잘못된) 회계
- 매수: 사용자가 `price×shares + fee`를 앱 지갑에 낸다.
- 승리 정산: 앱이 승자에게 `shares × 1`을 지급 ([resolve_market:255](../../backend/app/repositories/admin.py#L255)에서 `final_price=1`, [get_payout_target](../../backend/app/repositories/admin.py#L786)에서 `amount_owed = shares × final_price`).
- **문제**: 승자 지급의 재원이 명시적으로 없다. 앱이 "자기 돈"으로 `shares×1`을 준다. 매수로 받은 건 `price×shares`(< `1×shares`)뿐이라, 승리마다 `(1−price)×shares` 적자.

### 정상 회계 (예측시장의 정의)
예측시장은 **제로섬**이다:
> **승자에게 지급하는 재원 = 같은 마켓에서 패자가 낸 판돈.** 하우스(앱)는 **수수료만** 가져가고, 원금 이동에서는 손익이 0이어야 한다.

즉 마켓 하나를 닫았을 때: **모든 참가자가 낸 원금 합(패자+승자) = 모든 승자에게 지급할 합.** 앱은 그 사이에서 **에스크로(예치금 보관)** 역할만 하고, 수익은 수수료뿐이다.

---

## 1. 핵심 불변식 (Invariant)

각 마켓 `m`에 대해, 항상 다음이 성립해야 한다:

```
pool(m)  =  Σ(매수 원금: amount)  −  Σ(매도로 환급한 원금)  −  Σ(승리 정산 지급)
pool(m)  >=  0   (앱이 마이너스로 지급하지 않는다)
```

- **매수**: `amount`(= price×shares, 수수료 제외)를 `pool(m)`에 **적립**. 수수료 `fee`는 앱 수익(풀 밖).
- **매도**: 사용자에게 환급하는 `net_payout`은 `pool(m)`에서 **차감**. (매도 수수료도 앱 수익)
- **승리 정산**: 승자 지급 총액은 `pool(m)` 잔액을 **초과할 수 없다**.

이 불변식이 지켜지면 **앱 지갑은 원금 정산에서 절대 적자가 나지 않는다.** 수수료만 남는다.

---

## 2. 지급액 모델 — "share=1π 고정"에서 "풀 비례 분배"로

현재는 승자에게 `shares × 1`을 준다. 이게 적자의 직접 원인이다. 두 가지 방식이 있다.

### 방식 A (권장) — 파리뮤추얼(pari-mutuel) 풀 분배
승자 지급 = **마켓 풀 전체를 승자들이 shares 비율로 나눠 가짐.**

```
payout(user)  =  pool(m) × ( user_winning_shares / Σ all_winning_shares )
```

- **정확히 제로섬**: 승자 총지급 = pool(m) = 패자+승자 원금 합. 앱 원금 손익 0.
- share 가격이 "1π 보장"이 아니라 **"풀에서 내 몫"** 이 된다. 배당은 승자 수에 따라 변동(적으면 큰 배당, 많으면 작은 배당) — 파리뮤추얼의 정상 동작.
- 매수 UI의 "Estimated Return" 문구를 이 모델에 맞게 조정 필요.

### 방식 B — 고정 1π 유지 + 풀 한도 강제 (과도기적)
`shares×1`을 유지하되, **지급 합이 pool(m)을 넘으면 비례 축소**(haircut):

```
if Σ(shares×1) > pool(m):
    payout(user) = shares × 1 × ( pool(m) / Σ winning_shares )
```

- 최소 침습적이지만, "1π 보장" 문구가 사실이 아니게 되는 경우가 생김(풀 부족 시).
- **방식 A가 회계적으로 더 정직하다.** 방식 B는 UI 약속과 실제 지급이 어긋날 수 있어 권장하지 않음.

**→ 방식 A(파리뮤추얼) 채택 확정 (2026-07-29).**

---

## 3. 스키마 변경

### 3.1 마켓 풀 잔액 추적
`markets`에 컬럼 추가 (또는 별도 `market_pools` 테이블):
```
escrow_pool     NUMERIC(24,4) NOT NULL DEFAULT 0   -- 현재 예치 원금 잔액
gross_staked    NUMERIC(24,4) NOT NULL DEFAULT 0   -- 누적 매수 원금(감사용)
gross_paid_out  NUMERIC(24,4) NOT NULL DEFAULT 0   -- 누적 지급(매도+승리)
```
- 매수 정산([pi.py complete](../../backend/app/routes/api/pi.py#L191) 트랜잭션) 안에서 `escrow_pool += amount`, `gross_staked += amount`.
- 매도([positions.py](../../backend/app/routes/api/positions.py) Tx A) 안에서 `escrow_pool -= net_payout` (음수 방지: `net_payout <= escrow_pool` 검증). `gross_paid_out += net_payout`.
- 승리 정산 시 `escrow_pool -= payout`, `gross_paid_out += payout`.

### 3.2 정산 스냅샷
방식 A는 해결 시점에 `Σ winning_shares`와 `pool`을 **동결(snapshot)** 해야 한다. `resolve_market`에서:
```
winners_total_shares = Σ(shares WHERE outcome == resolved_outcome)
pool_at_resolution   = escrow_pool
```
두 값을 마켓 행(또는 스냅샷 테이블)에 저장하고, 이후 개별 지급은 `pool_at_resolution × shares / winners_total_shares`로 계산.

---

## 4. 흐름별 변경 상세

### 4.1 매수 정산 ([pi.py:191](../../backend/app/routes/api/pi.py#L191) 트랜잭션 내)
```
insert_market_trade(...)
update_market_position(...)          # 기존
update_market_price(...)             # 기존
escrow_pool += order.amount          # 신규: 원금만 적립(수수료 제외)
gross_staked += order.amount         # 신규
```

### 4.2 매도 정산 ([positions.py](../../backend/app/routes/api/positions.py) Tx A 내, 차감과 같은 트랜잭션)
```
# 검증: 환급이 풀 잔액을 넘지 않는지
if net_payout > escrow_pool(m):
    reject 409 "insufficient market pool"   # 정상적으론 발생 안 함(원금 회수라)
reduce_market_position(...)          # 기존(V1 수정본)
escrow_pool -= net_payout            # 신규
gross_paid_out += net_payout         # 신규
```
- **주의**: 매도는 "내가 낸 원금 회수 + 가격변동분"이다. 파리뮤추얼에선 매도 가격도 풀 기반이어야 일관된다. AMM 가격으로 매도 시, 그 환급액이 풀을 넘지 않는지 반드시 검증(위 가드).

### 4.3 승리 정산 (방식 A로 [resolve_market](../../backend/app/repositories/admin.py#L247) + [get_payout_target](../../backend/app/repositories/admin.py#L786) 변경)
- `resolve_market`: `final_price=1` 세팅을 **제거하거나 유지하되**, 실제 지급액 계산을 **풀 비례식**으로 교체.
  - 스냅샷 저장: `pool_at_resolution`, `winners_total_shares`.
- `get_payout_target`: `amount_owed = shares × final_price` ([admin.py:817](../../backend/app/repositories/admin.py#L817)) 을
  `amount_owed = pool_at_resolution × shares / winners_total_shares` 로 교체.
- 지급 실행([auto_pay_payout_queue](../../backend/app/routes/api/admin.py#L700)) 시 `escrow_pool -= amount_owed`.

### 4.4 무효/전패 처리
- 승자가 아무도 없는 경우(모두 패): `winners_total_shares = 0`. 이때 풀을 어떻게? → **환불(패자에게 원금 반환) 또는 하우스 귀속** 정책 결정 필요. 파리뮤추얼 표준은 "무효 시 원금 환불".

---

## 5. 마이그레이션·백필 (기존 데이터)

이미 매수/매도/정산이 일어난 상태이므로:
1. `escrow_pool` 등 컬럼 추가(기본 0).
2. **백필**: 각 마켓별로 `escrow_pool = Σ(기존 매수 amount) − Σ(기존 매도 net_payout) − Σ(기존 승리 지급)` 계산해 초기값 설정.
3. 백필 결과 `escrow_pool < 0`인 마켓 = **이미 적자가 실현된 마켓**. 목록화해 별도 정리(운영 판단).

---

## 6. UI/문구 영향

- 매수 화면의 **"Estimated Return: 10.00 π"**(주당 1 보장) → 파리뮤추얼에선 **변동 배당**이므로 "예상 배당(승자 수에 따라 변동)"으로 문구 변경 필요. [tradeTerms.ts](../../frontend/src/lib/trade/tradeTerms.ts)의 `estimatedReturn = shares` 로직 재검토.
- 이는 **제품 약속의 변경**이라 반드시 승인 필요. (현재 "1π 보장"이 마케팅/약관에 있다면 법적·신뢰 이슈)

---

## 7. 단계별 실행 계획

| 순번 | 작업 | 규모 | 비고 |
|---|---|---|---|
| 1 | `markets`에 escrow 컬럼 + 마이그레이션 | 소 | |
| 2 | 매수 정산에 `escrow_pool += amount` 배선 | 소 | pi.py 트랜잭션 |
| 3 | 매도 정산에 풀 차감 + 잔액 가드 | 중 | positions.py Tx A |
| 4 | `resolve_market` 스냅샷(pool, winners_shares) | 중 | |
| 5 | 승리 지급을 풀 비례식으로 교체 | 중 | get_payout_target + auto_pay |
| 6 | 무효/전패 환불 정책 구현 | 중 | 정책 결정 선행 |
| 7 | 기존 데이터 백필 + 적자 마켓 목록화 | 중 | 운영 |
| 8 | UI 문구(예상 배당 변동) 변경 + 약관 검토 | 중 | **승인 필요** |
| 9 | 시뮬레이션 재실행으로 순손익=수수료만 확인 | 소 | sim 스크립트 확장 |

**선결(승인 필요):** #8(제품 약속 변경)과 방식 A/B 선택은 **비즈니스 결정**이다. 코드보다 먼저 확정해야 한다.

---

## 8. 결정 사항

1. **지급 모델: 방식 A — 파리뮤추얼(변동 배당) 확정** (2026-07-29 결정). 승자가 마켓 풀을 shares 비율로 분배. 앱 원금 손익 0, 수수료만 수익.
2. **무효/전패 시** 원금 환불 vs 하우스 귀속 — **미결(구현 전 결정 필요)**. 파리뮤추얼 표준은 원금 환불.
3. **"1π 보장" 문구가 약관/마케팅에 있는지** — **확인 필요**. 파리뮤추얼은 변동 배당이라 "주당 1π 보장"이 성립하지 않으므로, 해당 문구가 있으면 변경.
4. **이미 적자난 기존 마켓**(백필 시 pool<0) 처리 방침 — **미결**. 백필 후 목록화해 운영 판단.

---

## 9. 검증 방법 (구현 후)

`sim_sell_accounting.py`를 확장해, 파리뮤추얼 정산을 적용한 뒤:
- 임의의 매수/매도/해결 시퀀스에서 **앱 지갑 원금 순손익 == 0**, **수익 == 누적 수수료** 임을 assert.
- 이게 성립하면 V6 근본 해결. mainnet 승격 가능 조건 충족.
