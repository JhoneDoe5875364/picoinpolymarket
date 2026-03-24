# PredictPix 지급 시스템 문서

## 개요

이 문서는 PredictPix 시스템에서 시장 결과가 저장되는 방식, 승자 식별 방법, 지급 계산 방법, 수동 검증 방법에 대한 포괄적인 가이드를 제공합니다.

## 목차

1. [데이터베이스 스키마](#데이터베이스-스키마)
2. [시장 해결 저장](#시장-해결-저장)
3. [해결된 시장의 포지션 조회](#해결된-시장의-포지션-조회)
4. [승자 vs 패자 식별](#승자-vs-패자-식별)
5. [측별 총액 계산](#측별-총액-계산)
6. [지급 계산 로직](#지급-계산-로직)
7. [사용자 지급 배분](#사용자-지급-배분)
8. [수동 검증 쿼리](#수동-검증-쿼리)
9. [운영 절차](#운영-절차)

---

## 데이터베이스 스키마

### 주요 테이블

#### `markets` 테이블
시장 정보 및 해결 상태를 저장합니다.

**주요 컬럼:**
- `id` (uuid): 기본 키
- `question` (text): 시장 질문
- `status` (text): 시장 상태 ('open', 'resolved', 'cancelled')
- `resolved` (bool): 시장이 해결되었는지 여부
- `resolved_outcome` (text): 최종 결과 ('yes' 또는 'no')
- `resolved_at` (timestamptz): 시장이 해결된 시간
- `resolved_by_user_id` (uuid): 시장을 해결한 사용자
- `resolved_by_username` (text): 해결자 사용자명

#### `trades` 테이블
구매, 판매, 지급을 포함한 모든 거래 활동을 저장합니다.

**주요 컬럼:**
- `id` (uuid): 기본 키
- `user_id` (uuid): 거래를 한 사용자
- `market_id` (uuid): 시장 ID
- `type` (text): 거래 유형 ('buy', 'sell', 'payout')
- `side` (text): 거래 측면 ('yes' 또는 'no')
- `pi_amount` (numeric): 거래의 PI 금액
- `fee_pi` (numeric): 공제된 수수료 (기본값 0)
- `net_pi` (numeric): `pi_amount - fee_pi`로 계산됨 (생성된 컬럼)
- `invalid` (bool): 거래가 무효/청구되었는지 여부 (기본값 false)
- `created_at` (timestamptz): 거래가 생성된 시간

#### `positions` 테이블
시장에서의 사용자 포지션을 저장합니다.

**주요 컬럼:**
- `id` (uuid): 기본 키
- `user_id` (uuid): 사용자 ID
- `market_id` (uuid): 시장 ID
- `side` (text): 포지션 측면 ('yes' 또는 'no')
- `amount` (numeric): 포지션 금액
- `pi_amount` (numeric): 투자된 PI 금액
- `status` (text): 포지션 상태

#### `users` 테이블
사용자 정보 및 잔액을 저장합니다.

**주요 컬럼:**
- `id` (uuid): 기본 키
- `pi_username` (text): Pi Network 사용자명
- `balance` (numeric): 사용자의 현재 잔액 (기본값 0)

#### `transactions` 테이블
거래 내역을 저장합니다.

**주요 컬럼:**
- `id` (uuid): 기본 키
- `user_id` (uuid): 사용자 ID
- `market_id` (uuid): 시장 ID (nullable)
- `amount` (numeric): 거래 금액
- `pi_amount` (numeric): PI 금액
- `type` (text): 거래 유형 ('claim-payouts' 등)
- `status` (text): 거래 상태
- `date` (date): 거래 날짜

### 주요 뷰

#### `valid_trades` 뷰
무효한 거래를 필터링합니다:
```sql
SELECT * FROM trades WHERE COALESCE(invalid, false) = false
```

#### `v_portfolio_unclaimed` 뷰
사용자의 미청구 지급을 계산합니다:
```sql
SELECT 
    u.id AS user_id,
    m.id AS market_id,
    m.question,
    m.resolved_outcome AS outcome,
    sum(vt.amount) AS unclaimed_pi
FROM users u
JOIN valid_trades vt ON vt.user_id = u.id
JOIN markets m ON m.id = vt.market_id
WHERE m.status = 'resolved' 
  AND m.resolved 
  AND vt.side = m.resolved_outcome
GROUP BY u.id, m.id, m.question, m.resolved_outcome
```

---

## 시장 해결 저장

### 최종 시장 결과가 저장되는 위치

최종 시장 결과는 `markets` 테이블에 저장됩니다:

**주요 필드:**
- `resolved_outcome`: 'yes' 또는 'no' 포함
- `resolved`: 불린 플래그 (해결되면 true)
- `resolved_at`: 해결 타임스탬프
- `status`: 시장이 해결되면 'resolved'로 설정

### 해결된 시장 결과 조회 쿼리

```sql
SELECT 
    id,
    question,
    resolved_outcome,
    resolved,
    resolved_at,
    resolved_by_username,
    status
FROM markets
WHERE id = '<market_id>'
  AND resolved = true;
```

### 해결 프로세스

관리자 API를 통해 시장이 해결될 때 (`POST /api/admin/markets/{market_id}/resolve/{outcome}`):

1. `markets` 테이블이 업데이트됩니다:
   - `resolved_outcome` = 결과 ('yes' 또는 'no')
   - `resolved` = true
   - `resolved_at` = NOW()
   - `status` = 'resolved'
   - `resolved_by_user_id` 및 `resolved_by_username`이 설정됨

2. 해당 시장의 모든 거래가 유효한 것으로 표시됩니다 (`invalid = false`)

---

## 해결된 시장의 포지션 조회

### 해결된 시장의 모든 포지션 조회

```sql
-- 해결된 시장의 모든 포지션 조회
SELECT 
    p.id AS position_id,
    p.user_id,
    u.pi_username,
    p.side,
    p.amount,
    p.pi_amount,
    p.created_at,
    m.resolved_outcome,
    CASE 
        WHEN p.side = m.resolved_outcome THEN 'winner'
        ELSE 'loser'
    END AS position_status
FROM positions p
JOIN markets m ON m.id = p.market_id
LEFT JOIN users u ON u.id = p.user_id
WHERE p.market_id = '<market_id>'
  AND m.resolved = true
ORDER BY p.side, p.amount DESC;
```

### 해결된 시장의 모든 거래 조회

**참고:** 지급 계산은 실제로 `positions` 테이블이 아닌 `trades` 테이블을 사용합니다. 이것이 중요합니다!

```sql
-- 해결된 시장의 모든 거래 조회
SELECT 
    t.id AS trade_id,
    t.user_id,
    u.pi_username,
    t.type,
    t.side,
    t.pi_amount,
    t.fee_pi,
    t.net_pi,
    t.invalid,
    t.created_at,
    m.resolved_outcome,
    CASE 
        WHEN t.side = m.resolved_outcome AND t.type IN ('buy', 'payout') THEN 'winner'
        WHEN t.side != m.resolved_outcome AND t.type = 'buy' THEN 'loser'
        ELSE 'neutral'
    END AS trade_status
FROM trades t
JOIN markets m ON m.id = t.market_id
LEFT JOIN users u ON u.id = t.user_id
WHERE t.market_id = '<market_id>'
  AND COALESCE(t.invalid, false) = false
ORDER BY t.created_at;
```

---

## 승자 vs 패자 식별

### 승자 식별 로직

**승자**는 다음 조건을 만족하는 사용자입니다:
1. `side`가 `resolved_outcome`과 일치하는 거래를 보유
2. 승리 측면에서 순 노출이 양수
3. `invalid`로 표시되지 않은 거래를 보유

### 승자 식별 쿼리

```sql
-- 해결된 시장의 모든 승자 조회
WITH user_exposures AS (
    SELECT 
        t.user_id,
        t.side,
        SUM(CASE 
            WHEN t.type = 'buy' THEN t.net_pi
            WHEN t.type = 'sell' THEN -t.net_pi
            ELSE 0
        END) AS net_exposure
    FROM trades t
    WHERE t.market_id = '<market_id>'
      AND COALESCE(t.invalid, false) = false
    GROUP BY t.user_id, t.side
),
market_outcome AS (
    SELECT resolved_outcome
    FROM markets
    WHERE id = '<market_id>'
      AND resolved = true
)
SELECT 
    ue.user_id,
    u.pi_username,
    ue.side,
    ue.net_exposure,
    mo.resolved_outcome,
    CASE 
        WHEN ue.side = mo.resolved_outcome AND ue.net_exposure > 0 THEN 'winner'
        WHEN ue.side != mo.resolved_outcome AND ue.net_exposure > 0 THEN 'loser'
        ELSE 'neutral'
    END AS status
FROM user_exposures ue
CROSS JOIN market_outcome mo
LEFT JOIN users u ON u.id = ue.user_id
WHERE ue.net_exposure != 0
ORDER BY ue.net_exposure DESC;
```

### 간소화된 승자 쿼리 (뷰 사용)

```sql
-- v_portfolio_unclaimed 뷰를 사용하여 승자 조회
SELECT 
    user_id,
    market_id,
    question,
    outcome,
    unclaimed_pi
FROM v_portfolio_unclaimed
WHERE market_id = '<market_id>'
ORDER BY unclaimed_pi DESC;
```

---

## 측별 총액 계산

### 측별 총 PI (순 노출)

시스템은 `trades` 테이블의 **순 노출**을 사용하여 총액을 계산합니다:

```sql
-- 시장의 측별 총 순 PI 계산
SELECT 
    side,
    SUM(CASE 
        WHEN type = 'buy' THEN net_pi
        WHEN type = 'sell' THEN -net_pi
        ELSE 0
    END) AS total_net_pi,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(*) AS total_trades
FROM trades
WHERE market_id = '<market_id>'
  AND COALESCE(invalid, false) = false
GROUP BY side
ORDER BY side;
```

### 총 팟 (Yes + No 합계)

```sql
-- 총 팟 계산 (양측 합계)
WITH side_totals AS (
    SELECT 
        side,
        SUM(CASE 
            WHEN type = 'buy' THEN net_pi
            WHEN type = 'sell' THEN -net_pi
            ELSE 0
        END) AS total_net_pi
    FROM trades
    WHERE market_id = '<market_id>'
      AND COALESCE(invalid, false) = false
    GROUP BY side
)
SELECT 
    COALESCE(SUM(total_net_pi), 0) AS total_pot
FROM side_totals;
```

### 상세 분석

```sql
-- yes/no 총액이 포함된 상세 분석
WITH agg AS (
    SELECT 
        side,
        SUM(CASE 
            WHEN type = 'buy' THEN net_pi
            WHEN type = 'sell' THEN -net_pi
            ELSE 0
        END) AS net_side_pi
    FROM trades
    WHERE market_id = '<market_id>'
      AND COALESCE(invalid, false) = false
    GROUP BY side
)
SELECT 
    COALESCE(MAX(CASE WHEN side = 'yes' THEN net_side_pi END), 0) AS yes_total,
    COALESCE(MAX(CASE WHEN side = 'no' THEN net_side_pi END), 0) AS no_total,
    COALESCE(SUM(net_side_pi), 0) AS total_pot
FROM agg;
```

---

## 지급 계산 로직

### 지급 공식

결과가 `'yes'` 또는 `'no'`인 해결된 시장의 경우:

1. **승리 측면 총액 계산:**
   ```sql
   winning_total = side = resolved_outcome인 모든 거래의 SUM(net_pi)
   ```

2. **총 팟 계산:**
   ```sql
   total_pot = 모든 거래의 SUM(net_pi) (yes + no)
   ```

3. **각 승자에 대한 지급 계산:**
   ```sql
   user_payout = (user_winning_exposure / winning_total) * total_pot
   ```

### 사용자 승리 노출 계산

```sql
-- 사용자의 승리 노출 계산
SELECT 
    user_id,
    SUM(CASE 
        WHEN type = 'buy' AND side = '<resolved_outcome>' THEN net_pi
        WHEN type = 'sell' AND side = '<resolved_outcome>' THEN -net_pi
        ELSE 0
    END) AS winning_exposure
FROM trades
WHERE market_id = '<market_id>'
  AND COALESCE(invalid, false) = false
GROUP BY user_id
HAVING SUM(CASE 
    WHEN type = 'buy' AND side = '<resolved_outcome>' THEN net_pi
    WHEN type = 'sell' AND side = '<resolved_outcome>' THEN -net_pi
    ELSE 0
END) > 0;
```

### 완전한 지급 계산 쿼리

```sql
-- 해결된 시장의 완전한 지급 계산
WITH market_info AS (
    SELECT resolved_outcome
    FROM markets
    WHERE id = '<market_id>' AND resolved = true
),
side_totals AS (
    SELECT 
        side,
        SUM(CASE 
            WHEN type = 'buy' THEN net_pi
            WHEN type = 'sell' THEN -net_pi
            ELSE 0
        END) AS net_side_pi
    FROM trades
    WHERE market_id = '<market_id>'
      AND COALESCE(invalid, false) = false
    GROUP BY side
),
pot_calc AS (
    SELECT 
        COALESCE(MAX(CASE WHEN side = 'yes' THEN net_side_pi END), 0) AS yes_total,
        COALESCE(MAX(CASE WHEN side = 'no' THEN net_side_pi END), 0) AS no_total
    FROM side_totals
),
user_exposures AS (
    SELECT 
        t.user_id,
        SUM(CASE 
            WHEN t.type = 'buy' AND t.side = mi.resolved_outcome THEN t.net_pi
            WHEN t.type = 'sell' AND t.side = mi.resolved_outcome THEN -t.net_pi
            ELSE 0
        END) AS user_winning_exposure
    FROM trades t
    CROSS JOIN market_info mi
    WHERE t.market_id = '<market_id>'
      AND COALESCE(t.invalid, false) = false
    GROUP BY t.user_id
)
SELECT 
    ue.user_id,
    u.pi_username,
    ue.user_winning_exposure,
    CASE 
        WHEN mi.resolved_outcome = 'yes' THEN pc.yes_total
        ELSE pc.no_total
    END AS winning_side_total,
    pc.yes_total + pc.no_total AS total_pot,
    ROUND(
        (ue.user_winning_exposure / 
         CASE 
             WHEN mi.resolved_outcome = 'yes' THEN NULLIF(pc.yes_total, 0)
             ELSE NULLIF(pc.no_total, 0)
         END) * (pc.yes_total + pc.no_total),
        6
    ) AS calculated_payout
FROM user_exposures ue
CROSS JOIN market_info mi
CROSS JOIN pot_calc pc
LEFT JOIN users u ON u.id = ue.user_id
WHERE ue.user_winning_exposure > 0
ORDER BY calculated_payout DESC;
```

---

## 사용자 지급 배분

### 현재 시스템 흐름

1. **시장 해결:** 관리자가 API를 통해 시장 해결
2. **지급 계산:** 시스템이 지급을 계산함 (개념적으로 저장되며 자동 배분되지 않음)
3. **사용자 청구:** 사용자가 `/api/account/claim` 엔드포인트 호출
4. **잔액 업데이트:** `users` 테이블의 사용자 `balance`가 업데이트됨
5. **거래 표시:** 사용자의 거래가 `invalid = true`로 표시됨 (청구됨)

### 청구 프로세스

사용자가 지급을 청구할 때 (`POST /api/account/claim`):

1. 시스템이 `v_portfolio_unclaimed` 뷰에서 총 미청구 PI를 계산합니다
2. 청구 가능한 잔액 > 0인 경우:
   - 사용자의 모든 거래가 `invalid = true`로 표시됨
   - `transactions` 테이블에 거래 기록이 생성됨
   - 사용자의 `balance`가 업데이트됨: `balance = balance + claimable_balance`

### 사용자의 청구 가능한 지급 조회

```sql
-- 사용자의 청구 가능한 지급 조회
SELECT 
    user_id,
    market_id,
    question,
    outcome,
    unclaimed_pi
FROM v_portfolio_unclaimed
WHERE user_id = '<user_id>'
ORDER BY unclaimed_pi DESC;
```

### 사용자의 총 잔액 조회

```sql
-- 사용자의 현재 잔액 및 청구 가능한 금액 조회
SELECT 
    u.id,
    u.pi_username,
    u.balance AS current_balance,
    COALESCE(SUM(vpu.unclaimed_pi), 0) AS claimable_payouts,
    u.balance + COALESCE(SUM(vpu.unclaimed_pi), 0) AS total_available
FROM users u
LEFT JOIN v_portfolio_unclaimed vpu ON vpu.user_id = u.id
WHERE u.id = '<user_id>'
GROUP BY u.id, u.pi_username, u.balance;
```

### 직접 지갑 지급

**현재 상태:** 시스템은 자동으로 Pi Network 지갑으로 지급을 보내지 않습니다. 지급은:
- 청구 시 사용자의 내부 `balance`에 추가됨
- 사용자가 수동으로 인출해야 하거나 (해당 기능이 있는 경우) 잔액이 향후 거래에 사용됨

**직접 지갑 지급을 구현하려면:**
1. Pi Network API와 통합하여 결제 처리
2. 지급 대기열/프로세스 생성
3. 결제 상태 추적 처리
4. 실패한 결제에 대한 재시도 로직 구현

---

## 수동 검증 쿼리

### 시장 해결 검증

```sql
-- 시장이 올바르게 해결되었는지 검증
SELECT 
    m.id,
    m.question,
    m.resolved,
    m.resolved_outcome,
    m.resolved_at,
    m.resolved_by_username,
    COUNT(DISTINCT t.user_id) AS total_participants,
    COUNT(*) AS total_trades
FROM markets m
LEFT JOIN trades t ON t.market_id = m.id AND COALESCE(t.invalid, false) = false
WHERE m.id = '<market_id>'
GROUP BY m.id, m.question, m.resolved, m.resolved_outcome, m.resolved_at, m.resolved_by_username;
```

### 지급 총액 일치 검증

```sql
-- 지급 계산이 올바른지 검증
WITH market_info AS (
    SELECT resolved_outcome
    FROM markets
    WHERE id = '<market_id>' AND resolved = true
),
side_totals AS (
    SELECT 
        side,
        SUM(CASE 
            WHEN type = 'buy' THEN net_pi
            WHEN type = 'sell' THEN -net_pi
            ELSE 0
        END) AS net_side_pi
    FROM trades
    WHERE market_id = '<market_id>'
      AND COALESCE(invalid, false) = false
    GROUP BY side
),
pot_calc AS (
    SELECT 
        COALESCE(MAX(CASE WHEN side = 'yes' THEN net_side_pi END), 0) AS yes_total,
        COALESCE(MAX(CASE WHEN side = 'no' THEN net_side_pi END), 0) AS no_total
    FROM side_totals
),
user_payouts AS (
    SELECT 
        t.user_id,
        SUM(CASE 
            WHEN t.type = 'buy' AND t.side = mi.resolved_outcome THEN t.net_pi
            WHEN t.type = 'sell' AND t.side = mi.resolved_outcome THEN -t.net_pi
            ELSE 0
        END) AS user_winning_exposure
    FROM trades t
    CROSS JOIN market_info mi
    WHERE t.market_id = '<market_id>'
      AND COALESCE(t.invalid, false) = false
    GROUP BY t.user_id
    HAVING SUM(CASE 
        WHEN t.type = 'buy' AND t.side = mi.resolved_outcome THEN t.net_pi
        WHEN t.type = 'sell' AND t.side = mi.resolved_outcome THEN -t.net_pi
        ELSE 0
    END) > 0
)
SELECT 
    COUNT(*) AS total_winners,
    SUM(user_winning_exposure) AS total_winning_exposure,
    (SELECT yes_total + no_total FROM pot_calc) AS total_pot,
    CASE 
        WHEN (SELECT resolved_outcome FROM market_info) = 'yes' 
        THEN (SELECT yes_total FROM pot_calc)
        ELSE (SELECT no_total FROM pot_calc)
    END AS winning_side_total
FROM user_payouts
CROSS JOIN market_info mi
CROSS JOIN pot_calc pc;
```

### 개별 사용자 지급 검증

```sql
-- 특정 사용자가 시장에서 받을 지급 검증
WITH market_info AS (
    SELECT resolved_outcome
    FROM markets
    WHERE id = '<market_id>' AND resolved = true
),
side_totals AS (
    SELECT 
        side,
        SUM(CASE 
            WHEN type = 'buy' THEN net_pi
            WHEN type = 'sell' THEN -net_pi
            ELSE 0
        END) AS net_side_pi
    FROM trades
    WHERE market_id = '<market_id>'
      AND COALESCE(t.invalid, false) = false
    GROUP BY side
),
pot_calc AS (
    SELECT 
        COALESCE(MAX(CASE WHEN side = 'yes' THEN net_side_pi END), 0) AS yes_total,
        COALESCE(MAX(CASE WHEN side = 'no' THEN net_side_pi END), 0) AS no_total
    FROM side_totals
),
user_trades AS (
    SELECT 
        type,
        side,
        pi_amount,
        fee_pi,
        net_pi,
        created_at
    FROM trades
    WHERE market_id = '<market_id>'
      AND user_id = '<user_id>'
      AND COALESCE(invalid, false) = false
    ORDER BY created_at
),
user_exposure AS (
    SELECT 
        SUM(CASE 
            WHEN type = 'buy' AND side = mi.resolved_outcome THEN net_pi
            WHEN type = 'sell' AND side = mi.resolved_outcome THEN -net_pi
            ELSE 0
        END) AS winning_exposure
    FROM user_trades
    CROSS JOIN market_info mi
)
SELECT 
    '<user_id>' AS user_id,
    (SELECT resolved_outcome FROM market_info) AS market_outcome,
    (SELECT winning_exposure FROM user_exposure) AS user_winning_exposure,
    CASE 
        WHEN (SELECT resolved_outcome FROM market_info) = 'yes' 
        THEN (SELECT yes_total FROM pot_calc)
        ELSE (SELECT no_total FROM pot_calc)
    END AS winning_side_total,
    (SELECT yes_total + no_total FROM pot_calc) AS total_pot,
    CASE 
        WHEN (SELECT winning_exposure FROM user_exposure) > 0
        THEN ROUND(
            (SELECT winning_exposure FROM user_exposure) / 
            NULLIF(
                CASE 
                    WHEN (SELECT resolved_outcome FROM market_info) = 'yes' 
                    THEN (SELECT yes_total FROM pot_calc)
                    ELSE (SELECT no_total FROM pot_calc)
                END,
                0
            ) * (SELECT yes_total + no_total FROM pot_calc),
            6
        )
        ELSE 0
    END AS calculated_payout;
```

### 감사 추적 쿼리

```sql
-- 해결된 시장의 완전한 감사 추적 조회
SELECT 
    'Market Resolution' AS event_type,
    m.resolved_at AS event_time,
    m.resolved_by_username AS actor,
    m.resolved_outcome AS details,
    NULL::numeric AS amount
FROM markets m
WHERE m.id = '<market_id>' AND m.resolved = true

UNION ALL

SELECT 
    'Trade' AS event_type,
    t.created_at AS event_time,
    u.pi_username AS actor,
    t.type || ' ' || t.side AS details,
    t.net_pi AS amount
FROM trades t
LEFT JOIN users u ON u.id = t.user_id
WHERE t.market_id = '<market_id>'
  AND COALESCE(t.invalid, false) = false

UNION ALL

SELECT 
    'Payout Claim' AS event_type,
    tx.date AS event_time,
    u.pi_username AS actor,
    tx.type AS details,
    tx.pi_amount AS amount
FROM transactions tx
LEFT JOIN users u ON u.id = tx.user_id
WHERE tx.market_id = '<market_id>'
  AND tx.type = 'claim-payouts'

ORDER BY event_time;
```

---

## 운영 절차

### 시장 해결 전

1. **시장 상태 확인:**
   ```sql
   SELECT id, question, status, resolved, end_date
   FROM markets
   WHERE id = '<market_id>';
   ```

2. **활성 포지션 확인:**
   ```sql
   SELECT COUNT(*) AS active_positions
   FROM positions
   WHERE market_id = '<market_id>'
     AND (status IS NULL OR status IN ('open', 'pending'));
   ```

3. **총 거래량 검토:**
   ```sql
   SELECT 
       side,
       SUM(net_pi) AS total_net_pi,
       COUNT(*) AS trade_count
   FROM trades
   WHERE market_id = '<market_id>'
     AND COALESCE(invalid, false) = false
   GROUP BY side;
   ```

### 시장 해결 후

1. **해결 확인:**
   ```sql
   SELECT 
       id,
       question,
       resolved_outcome,
       resolved,
       resolved_at,
       resolved_by_username
   FROM markets
   WHERE id = '<market_id>';
   ```

2. **예상 지급 계산:**
   위의 "완전한 지급 계산 쿼리"를 사용하여 지급 보고서 생성

3. **지급 보고서 내보내기:**
   ```sql
   -- CSV 친화적 형식으로 내보내기
   SELECT 
       u.pi_username,
       ue.user_winning_exposure,
       calculated_payout
   FROM (
       -- 여기에 완전한 지급 계산 쿼리 사용
   ) AS payout_data
   ORDER BY calculated_payout DESC;
   ```

### 수동 지급 검증 체크리스트

각 해결된 시장에 대해 다음을 검증합니다:

- [ ] 시장이 `resolved = true`로 표시됨
- [ ] `resolved_outcome`이 올바르게 설정됨 ('yes' 또는 'no')
- [ ] 총 팟 계산: `yes_total + no_total`이 모든 유효한 거래의 합과 일치
- [ ] 승리 측면 총액이 승리 측면 거래의 합과 일치
- [ ] 각 승자의 노출이 올바르게 계산됨
- [ ] 각 승자의 지급 = (노출 / 승리_총액) * 총_팟
- [ ] 모든 지급의 합 = 총_팟 (또는 반올림으로 인해 매우 근접)
- [ ] 사용자가 `v_portfolio_unclaimed`에서 청구 가능한 지급을 볼 수 있음

### 일반적인 문제 및 해결 방법

**문제:** 지급이 예상 금액과 일치하지 않음
- **확인:** 거래의 `invalid` 플래그 확인 - 청구된 거래는 무효로 표시됨
- **확인:** 계산에서 `pi_amount`가 아닌 `net_pi` 사용 확인
- **확인:** 시장 해결 결과가 거래 측면과 일치하는지 확인

**문제:** 사용자가 지급을 청구할 수 없음
- **확인:** 시장이 해결되었는지 확인: `SELECT resolved FROM markets WHERE id = '<market_id>'`
- **확인:** 사용자가 승리 거래를 보유하는지 확인: 해당 사용자에 대해 `v_portfolio_unclaimed` 조회
- **확인:** 거래가 이미 무효가 아닌지 확인: `SELECT invalid FROM trades WHERE user_id = '<user_id>' AND market_id = '<market_id>'`

**문제:** 총액이 균형을 이루지 않음
- **확인:** 계산에 'buy' 및 'sell' 거래 모두 포함 확인
- **확인:** `pi_amount`가 아닌 `net_pi` (수수료 후) 사용 확인
- **확인:** 무효한 거래 필터링: `COALESCE(invalid, false) = false`

---

## 부록: 빠른 참조 쿼리

### 지급이 필요한 모든 해결된 시장 조회

```sql
SELECT 
    m.id,
    m.question,
    m.resolved_outcome,
    m.resolved_at,
    COUNT(DISTINCT vpu.user_id) AS winners_count,
    COALESCE(SUM(vpu.unclaimed_pi), 0) AS total_unclaimed
FROM markets m
LEFT JOIN v_portfolio_unclaimed vpu ON vpu.market_id = m.id
WHERE m.resolved = true
GROUP BY m.id, m.question, m.resolved_outcome, m.resolved_at
ORDER BY m.resolved_at DESC;
```

### 사용자의 완전한 지급 내역 조회

```sql
SELECT 
    m.id AS market_id,
    m.question,
    m.resolved_outcome,
    m.resolved_at,
    vpu.unclaimed_pi,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM trades t 
            WHERE t.user_id = vpu.user_id 
              AND t.market_id = m.id 
              AND COALESCE(t.invalid, true) = true
        ) THEN 'claimed'
        ELSE 'unclaimed'
    END AS status
FROM v_portfolio_unclaimed vpu
JOIN markets m ON m.id = vpu.market_id
WHERE vpu.user_id = '<user_id>'
ORDER BY m.resolved_at DESC;
```

---

## 참고 사항

- 모든 금전적 가치는 PI (Pi Network 통화)로 표시됩니다
- `net_pi` 컬럼은 자동으로 `pi_amount - fee_pi`로 계산됩니다
- `invalid = true`로 표시된 거래는 지급 계산에서 제외됩니다
- 반올림으로 인해 지급 총액에 약간의 불일치가 발생할 수 있습니다 (일반적으로 0.000001 PI)
- 시스템은 현재 내부 잔액을 사용합니다. 직접 지갑 통합에는 추가 개발이 필요합니다
