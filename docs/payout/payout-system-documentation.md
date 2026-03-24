# PredictPix Payout System Documentation

## Overview

This document provides a comprehensive guide to understanding how market outcomes are stored, how winners are identified, how payouts are calculated, and how to manually verify payouts in the PredictPix system.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Market Resolution Storage](#market-resolution-storage)
3. [Querying Positions for Resolved Markets](#querying-positions-for-resolved-markets)
4. [Identifying Winners vs Losers](#identifying-winners-vs-losers)
5. [Calculating Totals Per Side](#calculating-totals-per-side)
6. [Payout Calculation Logic](#payout-calculation-logic)
7. [User Payout Distribution](#user-payout-distribution)
8. [Manual Verification Queries](#manual-verification-queries)
9. [Operational Procedures](#operational-procedures)

---

## Database Schema

### Key Tables

#### `markets` Table
Stores market information and resolution status.

**Key Columns:**
- `id` (uuid): Primary key
- `question` (text): Market question (NOT NULL)
- `title` (text): Generated column, always equals `question` (STORED)
- `category` (text): Market category (nullable)
- `creator_id` (uuid): User who created the market (nullable)
- `tier` (text): Market tier (nullable)
- `status` (text): Market status ('open', 'resolved', 'cancelled') (default 'open')
- `created_at` (timestamptz): When market was created (default now())
- `end_date` (timestamptz): Market end date (nullable)
- `closes_at` (timestamptz): Market closing time (nullable)
- `close_at` (timestamptz): Alternative closing time field (nullable)
- `liquidity` (numeric): Market liquidity amount (nullable)
- `seed_total` (numeric): Seed funding total (default 0)
- `description` (text): Market description (nullable)
- `rules` (text): Market rules (nullable)
- `sources` (jsonb): Array of source objects (default '[]')
- `tags` (text[]): Array of tags (default '{}')
- `resolution_criteria` (text): Criteria for resolution (nullable)
- `resolution_source` (text): Source for resolution (nullable)
- `resolved` (bool): Whether market is resolved (default false, NOT NULL)
- `resolved_outcome` (text): Final outcome ('yes' or 'no') (nullable)
- `resolved_at` (timestamp): When market was resolved (nullable)
- `resolved_by_user_id` (uuid): User who resolved the market (nullable)
- `resolved_by_username` (varchar): Username of resolver (nullable)
- `outcome_reason` (text): Reason for the outcome (nullable)
- `is_archived` (bool): Whether market is archived (default false)
- `payout_status` (varchar): Payout status (nullable)
- `checklist_resolution_clarity` (bool): Resolution clarity checklist (default true, NOT NULL)
- `checklist_restricted_topics` (bool): Restricted topics checklist (default true, NOT NULL)
- `checklist_verifiable_outcome` (bool): Verifiable outcome checklist (default true, NOT NULL)

#### `trades` Table
Stores all trading activity including buys, sells, and payouts.

**Key Columns:**
- `id` (uuid): Primary key
- `user_id` (uuid): User who made the trade (nullable)
- `market_id` (uuid): Market ID (nullable)
- `type` (text): Trade type ('buy', 'sell', 'payout') (nullable)
- `side` (text): Side of trade ('yes' or 'no') (nullable)
- `pi_amount` (numeric): PI amount of the trade (nullable)
- `fee_pi` (numeric): Fee deducted (default 0, NOT NULL)
- `net_pi` (numeric): Calculated as `pi_amount - fee_pi` (generated column, STORED)
- `invalid` (bool): Whether trade is invalid/claimed (default false, NOT NULL)
- `kind` (text): Trade kind ('buy', 'sell', 'refund') (default 'buy')
- `amount` (numeric): Ticket amount purchased with PI coins (nullable)
- `created_at` (timestamptz): When trade was created (default now())

#### `positions` Table
Stores user positions in markets.

**Key Columns:**
- `id` (uuid): Primary key
- `user_id` (uuid): User ID (nullable)
- `market_id` (uuid): Market ID (nullable)
- `side` (text): Position side ('yes' or 'no') (nullable)
- `amount` (numeric): Ticket amount purchased with PI coins (nullable)
- `pi_amount` (numeric): PI amount paid to the position (nullable)
- `created_at` (timestamptz): When position was created (default now())

#### `users` Table
Stores user information and balances.

**Key Columns:**
- `id` (uuid): Primary key
- `pi_username` (text): Pi Network username (nullable)
- `created_at` (timestamptz): When user was created (default now())
- `referral_code` (text): User's referral code (nullable)
- `referred_by` (text): User ID who referred this user (nullable)
- `status` (varchar): User status ('active', 'suspended', 'banned', etc.) (nullable)
- `balance` (numeric): User's current balance (default 0, NOT NULL)
- `role_id` (int4): User role ID (default 3, NOT NULL) - references roles table (1=superadmin, 2=admin, 3=user)

#### `transactions` Table
Stores transaction history.

**Key Columns:**
- `id` (uuid): Primary key
- `user_id` (uuid): User ID (NOT NULL)
- `market_id` (uuid): Market ID (nullable)
- `amount` (numeric): Transaction amount in position units (nullable)
- `pi_amount` (numeric): PI amount (nullable)
- `type` (varchar): Transaction type ('claim-payouts', 'deposit', 'refund', 'prediction-yes', 'prediction-no', etc.) (nullable)
- `status` (varchar): Transaction status ('completed', etc.) (nullable)
- `details` (varchar): Transaction details/description (nullable)
- `date` (date): Transaction date (nullable)

### Key Views

#### `valid_trades` View
Filters out invalid/claimed trades. Used as the base for most payout calculations.

**Columns:** All columns from `trades` table
**Filter:** `COALESCE(invalid, false) = false`

```sql
SELECT 
    id, user_id, market_id, type, side, pi_amount, created_at,
    fee_pi, net_pi, invalid, kind, amount
FROM trades t
WHERE COALESCE(invalid, false) = false
```

**Usage:** Base view for calculating payouts, volumes, and user statistics.

---

#### `v_portfolio_unclaimed` View
Calculates unclaimed payouts for users from resolved markets.

**Columns:**
- `user_id` (uuid): User ID
- `market_id` (uuid): Market ID
- `question` (text): Market question
- `outcome` (text): Resolved outcome ('yes' or 'no')
- `unclaimed_pi` (numeric): Total unclaimed PI for this user/market

```sql
SELECT u.id AS user_id,
    m.id AS market_id,
    m.question,
    m.resolved_outcome AS outcome,
    sum(vt.amount) AS unclaimed_pi
FROM users u
    JOIN valid_trades vt ON vt.user_id = u.id
    JOIN markets m ON m.id = vt.market_id
WHERE m.status = 'resolved'::text AND m.resolved AND vt.side = m.resolved_outcome
GROUP BY u.id, m.id, m.question, m.resolved_outcome
```

**Usage:** Used by the `/api/account/claim` endpoint to calculate claimable payouts.

---

#### `v_market_snapshots` View
Comprehensive market statistics including volumes, participants, and price percentages.

**Columns:**
- `id` (uuid): Market ID
- `title` (text): Market title
- `created_at` (timestamptz): Market creation time
- `end_date` (timestamptz): Market end date
- `resolved_at` (timestamp): Resolution time
- `status` (text): Market status
- `category` (text): Market category
- `description` (text): Market description
- `total_pi` (numeric): Total PI traded
- `pi_24h` (numeric): PI traded in last 24 hours
- `yes_pi` (numeric): Total PI on YES side
- `no_pi` (numeric): Total PI on NO side
- `total_volume` (numeric): Total volume (position units)
- `volume_24h` (numeric): Volume in last 24 hours
- `yes_volume` (numeric): YES side volume
- `no_volume` (numeric): NO side volume
- `total_participants` (bigint): Number of unique participants
- `yes_pct` (numeric): YES percentage (with smoothing: `round((yes_volume + 50) * 100 / (total_volume + 100))`)
- `no_pct` (numeric): NO percentage (with smoothing: `round((no_volume + 50) * 100 / (total_volume + 100))`)

**Filter:** Markets with status 'open', 'pending', or 'resolved'

**Usage:** Primary view for market listings, admin dashboards, and market detail pages. Used extensively in `/api/admin/markets` and `/api/markets` endpoints.

---

#### `v_portfolio_open_markets` View
User positions in open markets with market totals.

**Columns:**
- `id` (uuid): Market ID (alias for market_id)
- `market_id` (uuid): Market ID
- `position_id` (uuid): Position ID
- `user_id` (uuid): User ID
- `title` (text): Market title
- `market_title` (text): Market title (alias)
- `status` (text): Market status
- `resolved_outcome` (text): Resolved outcome (if resolved)
- `side` (text): Position side ('yes' or 'no')
- `amount` (numeric): Position amount
- `pi_amount` (numeric): PI amount invested
- `created_at` (timestamptz): Position creation time
- `yes` (numeric): Total YES volume for market
- `no` (numeric): Total NO volume for market

**Filter:** Positions with status NULL, 'open', or 'pending'

**Usage:** User portfolio page showing open positions.

---

#### `v_leaderboard` View
User leaderboard with trading volume and success percentage.

**Columns:**
- `user_id` (uuid): User ID
- `username` (text): Username (from users.pi_username or generated from user_id as '@' + first 8 chars)
- `volume` (numeric): Total trading volume (sum of pi_amount from valid_trades)
- `success_pct` (integer): Success percentage (0-100) based on resolved markets

**Calculation:** Success percentage is calculated as the average of wins (1.0) and losses (0.0) across all resolved markets where the user's trade side matches the outcome. Only resolved markets with non-null outcomes are considered.

**Usage:** Leaderboard displays, user statistics.

---

#### `v_market_volumes` View
Simple market volume aggregation.

**Columns:**
- `market_id` (uuid): Market ID
- `total_volume` (numeric): Total PI volume (sum of pi_amount)
- `volume_24h` (numeric): Volume in last 24 hours (filtered by created_at > now() - 24 hours)

**Usage:** Quick volume lookups, market statistics.

---

## Market Resolution Storage

### Where Final Market Outcome is Stored

The final market outcome is stored in the `markets` table:

**Primary Fields:**
- `resolved_outcome`: Contains 'yes' or 'no'
- `resolved`: Boolean flag (true when resolved)
- `resolved_at`: Timestamp of resolution
- `status`: Set to 'resolved' when market is resolved

### Query to Get Resolved Market Outcome

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

### Resolution Process

After logging in with an admin account, go to the admin menu, select the market tab, choose the relevant market, and execute the resolve action.

When a market is resolved via the admin API (`POST /api/admin/markets/{market_id}/resolve/{outcome}`):

1. The `markets` table is updated:
   - `resolved_outcome` = outcome ('yes' or 'no')
   - `resolved` = true
   - `resolved_at` = NOW()
   - `status` = 'resolved'
   - `resolved_by_user_id` and `resolved_by_username` are set

2. All trades for that market are marked as valid (`invalid = false`)

---

## Querying Positions for Resolved Markets

### Get All Positions for a Resolved Market

```sql
-- Get all positions for a resolved market
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

### Get All Trades for a Resolved Market

**Note:** The payout calculation actually uses the `trades` table, not `positions`. This is important!

```sql
-- Get all trades for a resolved market
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

## Identifying Winners vs Losers

### Winner Identification Logic

**Winner Determination Rule:**

After a market is resolved, **all users who have at least one trade** in the `trades` table where:
1. `market_id` matches the resolved market's ID, AND
2. `side` matches the market's `resolved_outcome` ('yes' or 'no')

are considered **winners**, regardless of:
- Net exposure amount (positive or negative)
- Number of trades
- Trade types (buy, sell, etc.)
- Trade amounts

**Key Points:**
- **Simple existence check**: If a user has ANY trade with `side = resolved_outcome` for the resolved market, they are a winner
- **No net exposure requirement**: Unlike some systems, winners are determined by trade existence, not net position
- **Invalid trades excluded**: Only trades where `COALESCE(invalid, false) = false` are considered
- **One trade is enough**: A single matching trade makes the user a winner

**Example:**
- Market resolves with `resolved_outcome = 'yes'`
- User has trades: `(side='yes', type='buy')` and `(side='yes', type='sell')`
- Even if net exposure is zero or negative, user is still a winner because they have trades with `side = 'yes'`

### Query to Identify Winners

**Simple Winner Query:**

```sql
-- Get all winners for a resolved market
SELECT DISTINCT
    t.user_id,
    u.pi_username,
    m.resolved_outcome,
    COUNT(*) AS matching_trades
FROM trades t
JOIN markets m ON m.id = t.market_id
LEFT JOIN users u ON u.id = t.user_id
WHERE t.market_id = '<market_id>'
  AND m.resolved = true
  AND m.resolved_outcome IS NOT NULL
  AND t.side = m.resolved_outcome
  AND COALESCE(t.invalid, false) = false
GROUP BY t.user_id, u.pi_username, m.resolved_outcome
ORDER BY matching_trades DESC;
```

**Detailed Winner Query with Trade Information:**

```sql
-- Get all winners with their trade details
SELECT 
    t.user_id,
    u.pi_username,
    t.id AS trade_id,
    t.type,
    t.side,
    t.pi_amount,
    t.net_pi,
    t.created_at,
    m.resolved_outcome,
    'winner' AS status
FROM trades t
JOIN markets m ON m.id = t.market_id
LEFT JOIN users u ON u.id = t.user_id
WHERE t.market_id = '<market_id>'
  AND m.resolved = true
  AND m.resolved_outcome IS NOT NULL
  AND t.side = m.resolved_outcome
  AND COALESCE(t.invalid, false) = false
ORDER BY t.user_id, t.created_at;
```

**Winner Count Query:**

```sql
-- Count total winners for a resolved market
SELECT 
    COUNT(DISTINCT t.user_id) AS total_winners
FROM trades t
JOIN markets m ON m.id = t.market_id
WHERE t.market_id = '<market_id>'
  AND m.resolved = true
  AND m.resolved_outcome IS NOT NULL
  AND t.side = m.resolved_outcome
  AND COALESCE(t.invalid, false) = false;
```

### Simplified Winner Query (Using View)

The `v_portfolio_unclaimed` view implements this exact logic:

```sql
-- Get winners using the v_portfolio_unclaimed view
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

**Note:** This view filters for:
- `m.status = 'resolved'` AND `m.resolved = true`
- `vt.side = m.resolved_outcome`
- Only valid trades (`COALESCE(invalid, false) = false`)

## Calculating Totals Per Side

### Total PI Per Side (Net Exposure)

The system calculates totals using **net exposure** from the `trades` table:

```sql
-- Calculate total net PI per side for a market
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

### Detailed Breakdown

```sql
-- Detailed breakdown with yes/no totals
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

## Payout Calculation Logic

### Payout Formula

For a resolved market with outcome `'yes'` or `'no'`:

1. **Calculate winning side total:**
   ```sql
   winning_total = SUM(net_pi) for all trades where side = resolved_outcome
   ```

2. **Calculate total pot:**
   ```sql
   total_pot = SUM(net_pi) for all trades (yes + no)
   ```

3. **For each winner, calculate payout:**
   ```sql
   user_payout = (user_winning_exposure / winning_total) * total_pot
   ```

### User Winning Exposure Calculation

```sql
-- Calculate user's winning exposure
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

### Complete Payout Calculation Query

```sql
-- Complete payout calculation for a resolved market
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

## User Payout Distribution

### Current System Flow

1. **Market Resolution**: Admin resolves market via API
2. **Payout Calculation**: System calculates payouts (stored conceptually, not automatically distributed)
3. **User Claims**: Users call `/api/account/claim` endpoint
4. **Balance Update**: User's `balance` in `users` table is updated
5. **Trade Marking**: User's trades are marked as `invalid = true` (claimed)

### Claim Process

When a user claims payouts (`POST /api/account/claim`):

1. System calculates total unclaimed PI from `v_portfolio_unclaimed` view
2. If claimable balance > 0:
   - All user's trades are marked as `invalid = true`
   - Transaction record is created in `transactions` table
   - User's `balance` is updated: `balance = balance + claimable_balance`

### Query User's Claimable Payouts

```sql
-- Get user's claimable payouts
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

### Query User's Total Balance

```sql
-- Get user's current balance and claimable amount
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

### Direct Wallet Payouts

**Current Status:** The system does NOT automatically send payouts to Pi Network wallets. Payouts are:
- Added to user's internal `balance` when claimed
- Users must manually withdraw (if that feature exists)

**To implement direct wallet payouts**
1. Integrate with Pi Network API for payments
2. Create a payout queue/process
3. Handle payment status tracking
4. Implement retry logic for failed payments

---

## Manual Verification Queries

### Verify Market Resolution

```sql
-- Verify a market is properly resolved
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

### Verify Payout Totals Match

```sql
-- Verify that payout calculations are correct
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
        WHEN t.type = 'sell' AND t.side = mi.resolved_outcome THEN -net_pi
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

### Verify Individual User Payout

```sql
-- Verify what a specific user is owed for a market
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
    FROM trades AS t
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

### Audit Trail Query

```sql
-- Get complete audit trail for a resolved market
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

## Operational Procedures

### Before Resolving a Market

1. **Verify Market Status:**
   ```sql
   SELECT id, question, status, resolved, end_date
   FROM markets
   WHERE id = '<market_id>';
   ```

2. **Check Active Positions:**
   ```sql
   SELECT COUNT(*) AS active_positions
   FROM positions
   WHERE market_id = '<market_id>'
     AND (status IS NULL OR status IN ('open', 'pending'));
   ```

3. **Review Total Volume:**
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

### After Resolving a Market

1. **Verify Resolution:**
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

2. **Calculate Expected Payouts:**
   Use the "Complete Payout Calculation Query" from above to generate a payout report.


### Manual Payout Verification Checklist

For each resolved market, verify:

- [ ] Market is marked as `resolved = true`
- [ ] `resolved_outcome` is set correctly ('yes' or 'no')
- [ ] Total pot calculation: `yes_total + no_total` matches sum of all valid trades
- [ ] Winning side total matches sum of winning side trades
- [ ] Each winner's exposure is calculated correctly
- [ ] Each winner's payout = (exposure / winning_total) * total_pot
- [ ] Sum of all payouts = total_pot (or very close due to rounding)
- [ ] Users can see their claimable payouts in `v_portfolio_unclaimed`

### Common Issues and Solutions

**Issue:** Payouts don't match expected amounts
- **Check:** Verify `invalid` flag on trades - claimed trades are marked invalid
- **Check:** Ensure using `net_pi` not `pi_amount` in calculations
- **Check:** Verify market resolution outcome matches trade sides

**Issue:** Users can't claim payouts
- **Check:** Verify market is resolved: `SELECT resolved FROM markets WHERE id = '<market_id>'`
- **Check:** Verify user has winning trades: Query `v_portfolio_unclaimed` for that user
- **Check:** Verify trades are not already invalid: `SELECT invalid FROM trades WHERE user_id = '<user_id>' AND market_id = '<market_id>'`

**Issue:** Totals don't balance
- **Check:** Include both 'buy' and 'sell' trades in calculations
- **Check:** Use `net_pi` (after fees) not `pi_amount`
- **Check:** Filter out invalid trades: `COALESCE(invalid, false) = false`

---

## Appendix: Quick Reference Queries

### Get All Resolved Markets Needing Payouts

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

### Get User's Complete Payout History

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

## Notes

- All monetary values are in PI (Pi Network currency)
- The `net_pi` column is automatically calculated as `pi_amount - fee_pi`
- Trades marked as `invalid = true` are excluded from payout calculations
- Rounding may cause minor discrepancies in payout totals (typically 0.000001 PI)
- The system currently uses internal balances; direct wallet integration would require additional development
