# 파리뮤추얼 에스크로 회계 — 롤백 가이드

> 작성일: 2026-07-31
> 대상 변경 (2개 커밋):
> - **`c9b97db`** "pari-mutuel escrow so house nets only fees (V6 fix)" — 정산 회계
> - **`3b7110f`** "pool-collateralized exit price so platform is never counterparty" — 매도가
> 롤백 기준점(둘 다 되돌린 직전 상태): 커밋 **`4559cec`**
> 관련 설계: [20260729_V6_Escrow_Accounting_Design.ko.md](20260729_V6_Escrow_Accounting_Design.ko.md)

이 문서는 방금 도입한 **파리뮤추얼 에스크로 회계**(정산) + **풀 담보 매도가**(매도)를 되돌려, **"승자에게 shares×1 고정 지급 + AMM 현재가로 매도"** 이던 이전 동작으로 복구하는 방법을 정리한다.

> **두 커밋은 함께 되돌려야 정합적이다.** `3b7110f`(매도가)만 되돌리면 정산은 파리뮤추얼인데 매도는 AMM이라 담보 불변식이 다시 깨진다. `c9b97db`(정산)만 되돌리면 escrow 컬럼이 사라져 매도 풀가격 계산이 실패한다. 순서: **`3b7110f` → `c9b97db`** 순으로 revert(최신부터).

---

## 이번 2차 변경(`3b7110f`) 요약 — 풀 담보 매도가

| 항목 | 이전 (롤백 후) | 이후 (현재) |
|---|---|---|
| 매도 가격 | AMM 현재가 (`get_token_and_price`) | 풀 비례 `min(1, pool×prob/shares)` |
| 매도 초과 시 | 풀 초과하면 차단(502) → 사용자 못 팖 | 항상 풀 이하 → 매끄럽게 매도 |
| 매도 견적 | 프론트 로컬 계산 (AMM가) | 서버 `GET /positions/{id}/sell-quote` |

변경 파일 (`3b7110f`):
- `backend/app/core/trade.py` (`compute_pool_sell_price` 추가)
- `backend/app/repositories/markets.py` (`get_escrow_and_outcome_shares` 추가)
- `backend/app/routes/api/positions.py` (매도가 교체 + `/sell-quote` 엔드포인트)
- `backend/bin/sim_collateral_invariant.py`, `sim_house_pnl.py` (검증 도구)
- `frontend/src/components/market/SellModal.tsx` (서버 견적 fetch)

이 커밋은 **DB 스키마를 바꾸지 않는다** (마이그레이션 없음). 코드 revert만으로 완전히 되돌아간다.

---

## 0. 무엇이 바뀌었나 (되돌릴 대상)

커밋 `c9b97db`가 바꾼 것:

| 영역 | 이전 (롤백 후 돌아갈 상태) | 이후 (현재) |
|---|---|---|
| 승자 지급 | `shares × 1` (고정) | `shares × (pool / 승자shares)` (파리뮤추얼) |
| resolve 시 final_price | 승자=1, 패자=0 | 승자=배당/주, 패자=0 |
| 승자 판정 | `final_price >= 1` | `final_price > 0` |
| markets 컬럼 | 없음 | escrow_pool, gross_staked, gross_paid_out, pool_at_resolution, winners_total_shares |
| 매수/매도/지급 | escrow 무관 | escrow 적립/차감/복원 |
| 프론트 | "Estimated Return" / ResultBadge(final_price≥1) | "Max Return (varies)" / ResultBadge(final_price>0) |

변경 파일 (10개):
- `backend/app/models/tables/market.py` (escrow 컬럼)
- `backend/alembic/versions/b7e2c4f918a3_market_escrow_pool.py` (마이그레이션)
- `backend/app/core/market.py` (escrow 헬퍼 3개)
- `backend/app/routes/api/pi.py` (매수 escrow 적립)
- `backend/app/routes/api/positions.py` (매도 escrow 차감/복원)
- `backend/app/repositories/admin.py` (resolve 파리뮤추얼, 승자판정, 지급 escrow)
- `backend/bin/sim_house_pnl.py`, `backend/bin/backfill_escrow_pool.py` (도구 — 무해, 지워도 됨)
- `frontend/src/lib/copy/trade.ts`, `frontend/src/components/market/ResultBadge.tsx`

---

## 1. 롤백 시 반드시 이해할 것 — 데이터 안전

**코드 롤백과 DB 롤백은 별개다.** 특히:

1. **`c9b97db` 배포 후 새로 resolve된 마켓**은 `final_price`에 **배당율(예: 0.83)** 이 저장돼 있다. 코드만 롤백하면, 이전 코드는 승자를 `final_price >= 1`로 판정하므로 **배당이 1 미만인 승자를 패자로 오인**한다. → **이미 파리뮤추얼로 resolve된 마켓이 있으면, 그 마켓들은 롤백해도 이전 방식으로 재계산되지 않는다.** (resolve는 1회성이라 되돌릴 수 없음)

2. **escrow 컬럼을 DROP하면** 롤백 후엔 문제없지만, 다시 파리뮤추얼로 되돌아올 때 백필을 재실행해야 한다.

**결론:** 아직 **파리뮤추얼로 resolve한 마켓이 없다면 롤백이 완전히 안전**하다. 이미 resolve한 마켓이 있다면 그 마켓들은 손대지 말고(이미 지급 진행 중), 코드 롤백은 "앞으로의 resolve"에만 영향을 주도록 신중히 한다.

**롤백 전 확인 쿼리:**
```sql
-- 파리뮤추얼로 resolve된 마켓이 있는가? (배당이 0도 1도 아닌 값)
SELECT id, resolved_outcome, pool_at_resolution, winners_total_shares
FROM markets
WHERE is_resolved = true AND pool_at_resolution IS NOT NULL;
```
- 결과가 **비어있으면** → 롤백 완전 안전 (섹션 2)
- 결과가 **있으면** → 섹션 3(부분 롤백) 참고

---

## 2. 완전 롤백 (파리뮤추얼 resolve 이력이 없을 때 — 안전)

### 2-1. 코드 되돌리기

**옵션 A — revert (권장, 이력 보존):**
```bash
cd /e/Work_Data/01_PredictPix
git revert --no-edit 3b7110f    # 먼저 매도가(최신)
git revert --no-edit c9b97db    # 그다음 정산 회계
git push origin master        # 또는 push online master
```
`revert`는 새 커밋으로 변경을 역적용하므로 이력이 남아 안전하다.

**옵션 B — 특정 파일만 이전 상태로:**
```bash
git checkout 4559cec -- \
  backend/app/models/tables/market.py \
  backend/app/core/market.py \
  backend/app/routes/api/pi.py \
  backend/app/routes/api/positions.py \
  backend/app/repositories/admin.py \
  frontend/src/lib/copy/trade.ts \
  frontend/src/components/market/ResultBadge.tsx
git commit -m "revert: roll back pari-mutuel escrow to fixed shares*1 payout"
git push origin master
```
> 마이그레이션 파일(`b7e2c4f918a3_*.py`)과 bin 스크립트는 **지우지 말 것** — 아래 2-2에서 alembic downgrade에 필요하다. downgrade 후 지워도 된다.

### 2-2. DB 마이그레이션 되돌리기 (서버)
```bash
cd /var/predictpix/picoinpolymarket/backend
source .venv/bin/activate
alembic downgrade a4c82f1e9b7d     # b7e2c4f918a3 → a4c82f1e9b7d (escrow 컬럼 제거)
alembic current                    # a4c82f1e9b7d (head) 확인
```
이 downgrade는 `escrow_pool` 등 5개 컬럼을 DROP한다.

### 2-3. 서버 재배포
```bash
git pull                                  # revert 커밋 받기
sudo systemctl restart predictpix-api
cd ../frontend && npm run build && sudo systemctl restart predictpix-web
```

### 2-4. 검증
```bash
alembic current                           # a4c82f1e9b7d
grep -n "final_price >= Decimal" app/repositories/admin.py   # 이전 판정 복구 확인
```
프론트에서 "Max Return (varies)"가 다시 "Estimated Return"으로, 승자 지급이 shares×1로 돌아왔는지 확인.

---

## 3. 부분 롤백 (파리뮤추얼로 이미 resolve한 마켓이 있을 때 — 주의)

이미 파리뮤추얼 배당으로 resolve/지급된 마켓이 있으면, **그 마켓들은 건드리지 않는다**(지급이 이미 그 배당 기준으로 진행됨). 코드만 이전으로 되돌리되:

- **컬럼은 DROP하지 말 것.** 이미 resolve된 마켓의 `pool_at_resolution` 등이 감사 기록으로 필요하다.
- 대신 **코드만 revert**(2-1 옵션 A)하고 **alembic downgrade는 하지 않는다**. escrow 컬럼은 남겨두되, 이전 코드는 그 컬럼을 안 쓰므로 무해하다.
- 단, 이전 코드의 승자 판정(`final_price >= 1`)이 파리뮤추얼 배당(1 미만)을 패자로 오인하므로, **미지급 상태인 파리뮤추얼 승자가 있으면 그들은 지급 큐에서 사라진다.** 이 경우 수동 지급(DB에서 해당 포지션 확인 후 처리)이 필요하다.

**권고:** 파리뮤추얼로 resolve한 마켓이 있으면 **완전 롤백보다는 그대로 두는 것**이 안전하다. 롤백이 꼭 필요하면 그 마켓들의 미지급 승자를 먼저 정리한 뒤 코드만 revert한다.

---

## 4. 롤백 후 다시 파리뮤추얼로 복구하려면

```bash
git revert --no-edit <revert커밋>     # revert를 다시 revert
# 또는 c9b97db를 cherry-pick
alembic upgrade head                  # b7e2c4f918a3 재적용
python bin/backfill_escrow_pool.py --commit   # escrow 재구성
sudo systemctl restart predictpix-api
```

---

## 5. 요약 체크리스트

**완전 롤백 (안전):**
- [ ] `pool_at_resolution IS NOT NULL` 마켓 없음 확인
- [ ] `git revert 3b7110f` 그다음 `git revert c9b97db` + push (최신부터)
- [ ] 서버 `alembic downgrade a4c82f1e9b7d`
- [ ] api 재시작 + 프론트 재빌드
- [ ] 이전 동작(shares×1, Estimated Return) 복구 확인

**부분 롤백 (resolve 이력 있음):**
- [ ] 파리뮤추얼 resolve 마켓 목록화 (건드리지 않음)
- [ ] 미지급 파리뮤추얼 승자 수동 정리
- [ ] 코드만 revert (alembic downgrade 안 함)
- [ ] api 재시작 + 프론트 재빌드

---

## 부록: 핵심 해시

| 항목 | 값 |
|---|---|
| 파리뮤추얼 커밋 | `c9b97db` |
| 직전(롤백 기준) 커밋 | `4559cec` |
| 마이그레이션 | `b7e2c4f918a3` |
| 마이그레이션 직전 head | `a4c82f1e9b7d` |
| 검증 도구 | `bin/sim_house_pnl.py` (house==+fees 확인) |
| 백필 도구 | `bin/backfill_escrow_pool.py` |
