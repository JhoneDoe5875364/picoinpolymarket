# PredictPix — Implementation Gap Analysis
### Audit Reference: `docs/feedbacks/20260502_Audit.md`
**Date:** 2026-05-26  
**Last updated:** 2026-05-29 (Section 4 Discussion & comment moderation implemented)  
**Analysis scope:** Full stack (FastAPI backend + Next.js 14 frontend)  
**Method:** File-level inspection of all components, routes, models, and schemas against every `[ADDED]` item in the audit document.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented and verifiable in code |
| ⚠️ | Partially implemented — present but incomplete or missing edge cases |
| ❌ | Not implemented |

---

## Section 1 — Market List

| Audit Requirement | Status | Evidence |
|-------------------|--------|----------|
| "Trending," "New," "Hot," "Ending Soon" labels on market cards | ✅ | `MarketCard.tsx`: `labels[]` array with `labelColorClass()` per label; color-coded badges rendered |
| Activity signals: "24 trades today," "12 comments," "volume up 38%" | ✅ | `MarketCard.tsx` L222–230: `trades_24h`, `comments_24h`, `price_move_24h` all rendered in signal row |
| Mini sparkline on market cards | ✅ | `MarketCard.tsx` L73–102: `MiniSparkline` SVG polyline component renders `market.sparkline[]` |
| Featured Market / rotating card at top of market list | ✅ | `FeaturedMarketCard.tsx`: full card with price history chart + live comments carousel |
| "Ending Soon" filter | ✅ | `market-categories.ts` L20: `{ key: "ending_soon", slug: "ending-soon" }` navigable discovery route |
| "Most Discussed" filter | ✅ | `market-categories.ts` L21: `{ key: "most_discussed", slug: "most-discussed" }` route defined |
| Trending based on recent activity, not lifetime volume | ⚠️ | Labels field exists on `Market` model and background `market_stats_updator.py` computes them, but the exact trending algorithm (last 24h vs lifetime) has not been verified to match the audit definition (§1.4) |
| Watchlist feature | ✅ | `WatchlistContext.tsx`, `MarketWatchlistButton.tsx`, backend `watchlist.py` route + model |
| "Share this market" CTA | ✅ | `MarketShareButton.tsx`, `lib/share/shareMarket.ts` |
| Discovery categories: Trending / New / Hot / Ending Soon / Sports / Crypto / Politics / Entertainment / Community | ⚠️ | Discovery menus exist; `MARKET_CATEGORIES` in `market-categories.ts` includes Sports/Crypto but uses "Politics" (not "Politics / Public Events") and does not include "Entertainment" or "Community" as top-level categories |

---

## Section 2 — Market Rules / Resolution Clarity

| Audit Requirement | Status | Evidence |
|-------------------|--------|----------|
| "Resolution Rules" card with Question, Yes Criteria, No Criteria, Source, Close Time, Resolution Time, Edge Cases | ✅ | `MarketRules.tsx` L390–end: full structured card renders all 7 fields with icons; backend `Market` model columns: `yes_criteria`, `no_criteria`, `resolution_source`, `edge_cases` |
| Rules card visually separated from trade panel | ✅ | `markets/[id]/page.tsx`: `<MarketRules>` is in the left column above `<MarketParticipants>`; `<PredictionPanel>` is in a separate sticky right column |
| "Admin Note" / "Market Clarification" feature | ✅ | `MarketAdminClarification.tsx`, admin route `POST /admin/markets/{id}/clarification` |
| Admin clarification pinned at TOP of user-facing discussion | ✅ | `DiscussionPinnedNotes.tsx` → top of `MarketCommentsList.tsx`: amber pinned card for `admin_clarification` ("Official Clarification") |
| "Market context" / "Why this matters" neutral paragraph | ✅ | `MarketRules.tsx`: `RulesMarketContext` renders `market.market_context` in a dedicated "Market Context" labeled card |

---

## Section 3 — Trade Panel

| Audit Requirement | Status | Evidence |
|-------------------|--------|----------|
| Terminology: Amount / Fee / Total Cost / Estimated Return / Net Result / Loss if Incorrect | ✅ | `lib/copy/trade.ts` + `lib/trade/tradeTerms.ts`: all six terms defined as constants; used uniformly in `PredictionPanel.tsx` |
| "Potential profit" replaced with safe alternatives | ✅ | `TRADE_COPY` uses only "Estimated Return" and "Net Result"; no "profit" in trade UI |
| Avoid: deposit / withdraw / balance / profit / investment / trading / bankroll / yield | ⚠️ | `ProfileOverview.tsx` L586–598: renders disabled "Receive Pi" button with `ArrowUpFromLine` icon which visually resembles a withdraw CTA; "Positions Value" stat label is close to "balance" framing |
| Calculation breakdown before confirmation (Amount + Fee + Total Cost + Estimated Return + Net Result + Loss) | ✅ | `PredictionPanel.tsx` L241–292: `BreakdownRow` renders all six lines with correct audit labels |
| Consistent calculations across market card / trade panel / profile / admin | ✅ | Single source: `calculateTradeBreakdown()` in `tradeTerms.ts` used by `executeBuyTrade.ts`; `buildTradePaymentPayload()` used for all three (order, payment, position) API calls |
| Post-trade confirmation: market name, side, amount, fee, reference ID, wallet status, resolution date, link to profile | ✅ | `PredictionPanel.tsx` L306–323: full confirmation card with all fields; link to `/profile` |
| Loading states: Preparing payment → Awaiting Pi confirmation → Payment detected → Position recorded → Prediction confirmed | ✅ | `executeBuyTrade.ts` L27–32: `TradeProgressStage` union; `PredictionPanel.tsx` L294–298: stage label rendered in real time |
| Failure states with recovery: payment cancelled / pending / payment detected but position not recorded / position recorded but delayed / network error | ✅ | `TradeFailureReason` union in `executeBuyTrade.ts`; `failureGuideMap` in `PredictionPanel.tsx` L115–123 with per-reason user instructions |

---

## Section 4 — Comment Section

| Audit Requirement | Status | Evidence |
|-------------------|--------|----------|
| Discussion section below market details (not inside trade panel) | ✅ | `markets/[id]/page.tsx`: `MarketComment.tsx` — standalone Discussion section below Rules, above Participants |
| Comment count visible near trade panel | ✅ | `MarketCard.tsx`: `comments_24h` signal; `FeaturedMarketCard.tsx`: live comments carousel; `MarketComment.tsx` header shows total comment count |
| Recommended page layout: Question → Chart → Trade panel → Rules → Discussion → Related markets | ⚠️ | Current: Summary → Chart → Rules → `MarketComment` (Discussion) → Participants — only "Related Markets" missing (see G-5) |
| Report comment / hide from admin | ✅ | `POST /api/comments/{id}/report` (logged to `compliance_logs`); `DELETE /api/comments/{id}` soft delete; `CommentActionMenu.tsx` "Hide comment" |
| User mute / ban from admin panel | ✅ | `UserManager.tsx`, `POST /api/users/status` (admin·superadmin); `user_id` parsed as int |
| User mute / ban inline from comment context (not just admin panel) | ✅ | `CommentActionMenu.tsx`: admin Mute user (`SUSPENDED`) / Ban user (`BANNED`); `⋯` menu on root comments and replies |
| Pinned admin clarification above user comments | ✅ | `DiscussionPinnedNotes.tsx`: Pin+Shield amber card at top of Discussion list with `admin_clarification`, author, published time |
| "Official resolution note" from admin visible in discussion | ✅ | `DiscussionPinnedNotes.tsx`: emerald "Official Resolution Note" when `is_resolved` — outcome, `resolved_at`, `resolved_by_username`, `resolution_source` |

---

## Section 5 — Admin Panel

| Audit Requirement | Status | Evidence |
|-------------------|--------|----------|
| Market metrics: total volume, yes/no volume, unique users, prediction count, avg size, largest prediction, close date, resolution status | ✅ | `admin_repo.get_admin_metrics()` returns these; `TrustSafetyManager.tsx` and `PaymentManager.tsx` render them |
| Unresolved markets / markets with disputes | ✅ | `TrustSafetyManager.tsx`: `unresolved_edge_cases` section |
| User metrics: total / active / open positions / resolved / repeat / largest by activity / failed payments / flagged | ✅ | Backend `GET /admin/trust-safety` returns all; `TrustSafetyManager.tsx` renders |
| Payment metrics: received / payouts sent / pending / failed / manual queue / wallet connected/missing / mismatch warnings | ✅ | `PaymentManager.tsx`: `manual_payout_queue` count + total Pi + scope note |
| Payout Queue: per-row table (user, market, outcome, amount owed, wallet, status, txid, admin action) | ❌ | `PaymentManager.tsx` shows only aggregate count + total Pi. No per-row payout table with action buttons |
| Audit log: every admin action recorded (market created/edited/resolved, payout generated/marked paid, user banned, comment removed, rules changed) | ⚠️ | `core/compliance_logger.py` and `repositories/compliance.py` exist for backend logging, but **no admin UI page exists** to view the audit log |
| Audit log view in admin panel | ❌ | No `admin/audit-log/page.tsx` or equivalent component. Backend compliance log data is not exposed to admin frontend |
| Manual override history | ❌ | Not implemented |

---

## Section 6 — Profile Dashboard

| Audit Requirement | Status | Evidence |
|-------------------|--------|----------|
| Prediction history model (not internal balance) | ✅ | Profile has Predictions tab + Payment History tab; no internal ledger balance |
| Open predictions: Market / Side / Amount / Fee / Total Cost / Estimated Return / Close Date / Status | ⚠️ | `ProfilePositionsTab.tsx`: shows market, outcome, avgPrice, shares, pnl — does NOT show fee, total cost per row, estimated return, or close date |
| Resolved predictions: Market / Side / Result / Amount placed / Amount returned / Net result / Transaction reference / Resolution source | ❌ | Closed positions tab shows market, outcome, current price, PnL — does NOT show: win/loss result badge, amount returned (Pi paid out), transaction ID (txid), or resolution source |
| Payment history: Pi sent / Pi returned / Transaction IDs / Pending / Completed / Failed | ⚠️ | `ProfilePaymentHistoryTab.tsx` exists; exact fields shown not fully confirmed but backend provides payment records with status |
| Wallet section: Connected Pi username / wallet reference / payout destination / last verified date | ✅ | `ProfileOverview.tsx` L530–583: full wallet card with pi_username, pi_uid, payout_destination, last_pi_verified_at |
| No "internal balance" display | ⚠️ | "Positions Value" stat in ProfileOverview could be read as a balance; disabled "Receive Pi" button implies withdraw-like feature |
| PnL / Net Result chart with time periods | ✅ | `ProfilePnlChart` with 1D / 1W / 1M / ALL period selector |
| Activity tab | ⚠️ | `ProfileActivityTab.tsx` exists but tab is hidden in production (`className="hidden"`) |

---

## Section 7 — Non-Escrow Pi Flow

| Audit Requirement | Status | Evidence |
|-------------------|--------|----------|
| Pay per prediction → verify → record position → direct payout on win | ✅ | `executeBuyTrade.ts`: Pi SDK payment → `/pi/payments/approve` → `/pi/payments/complete` → `/positions` |
| Avoid language: deposit / withdraw / balance / investment / portfolio / cash out | ⚠️ | ProfileOverview has "Receive Pi" (disabled) button with withdraw-style icon; "Positions Value" is close to balance language |
| Safe wording: prediction amount / send Pi / return / payout status / activity history | ✅ | `TRADE_COPY` and `TRADE_TERMS` constants use all safe terms throughout |

---

## Complete Gap Summary

### ❌ NOT IMPLEMENTED — 5 items

| # | Gap | Audit Section | Priority |
|---|-----|---------------|----------|
| G-1 | Admin Audit Log UI (view all admin actions) | §5.3 | P5 |
| G-2 | Payout Queue per-row detail table | §5.3 | P5 |
| G-3 | Resolved positions: result, amount returned, txid, resolution source | §6.2 | P1 |
| G-5 | Related Markets section on market detail page | §4.1 | P4 |
| G-7 | Manual override history in admin | §5.3 | P5 |

### ⚠️ PARTIALLY IMPLEMENTED — 5 items requiring follow-up

| # | Gap | Audit Section | Notes |
|---|-----|---------------|-------|
| P-1 | Trending algorithm matches audit definition (last 24h activity, not lifetime volume) | §1.2 | Needs backend verification |
| P-2 | Category navigation: "Entertainment" and "Community" categories missing | §1.3 | `MARKET_CATEGORIES` in `market-categories.ts` |
| P-3 | Open positions row: fee / total cost / estimated return / close date not shown | §6.2 | `ProfilePositionsTab.tsx` |
| P-5 | ProfileActivityTab hidden in production | §6 | `className="hidden"` on tab trigger |
| P-6 | "Receive Pi" button / "Positions Value" — could imply internal balance | §7.2 | ProfileOverview |

---

## Implementation Plan — Ordered by Audit Priority

---

### Phase 1 — Priority 1 (Trust / Calculation Accuracy)
**Target: G-3, P-3**

#### TASK 1.1 — Resolved positions: add result, amount returned, txid, resolution source
**Files to modify:**
- `frontend/src/components/profile/ProfilePositionsTab.tsx`
- `backend/app/repositories/users.py` (positions query for closed positions)
- `backend/app/routes/api/users.py` (expose txid, amount_returned, resolution_source)

**Implementation detail:**
1. Backend: extend the closed-positions query to JOIN `payments` table on `user_id + market_id` to fetch `txid`, and JOIN `markets` to fetch `resolution_source`. Add `amount_returned` column (Pi paid back after resolution).
2. Frontend: in `ProfilePositionsTab.tsx`, for `status === 'closed'` rows, render additional columns:
   - **Result** badge: green "Won" / red "Lost" / grey "Void"
   - **Amount Returned**: Pi received back
   - **Net Result**: amount_returned − total_cost (already partially computed as `pnl`)
   - **Transaction Ref**: truncated txid with copy button
   - **Resolution Source**: link if URL, plain text otherwise

#### TASK 1.2 — Open positions row: add fee / total cost / estimated return / close date
**Files to modify:**
- `frontend/src/components/profile/ProfilePositionsTab.tsx`

**Implementation detail:**
Expand the `PositionRow` type and table to include:
- `fee`: stored at position creation time (already in `market_positions` table via `fee` column)
- `total_cost`: already stored
- `estimated_return`: shares (as Pi at resolution price 1.0)
- `close_date`: from `market.end_date` joined in positions query

---

### Phase 2 — Priority 2 (Market Rules / Resolution Clarity)
**Target: ~~P-4, P-7~~ → completed (2026-05-29)**

#### TASK 2.1 — Pinned admin clarification in user-facing discussion ✅ Done
**Implemented in:**
- `frontend/src/components/market/participants/DiscussionPinnedNotes.tsx`
- `frontend/src/components/market/participants/MarketCommentsList.tsx`

**What shipped:**
- When `market.admin_clarification` is set, an amber Pin+Shield "Official Clarification" pinned card appears at the top of the Discussion list
- Author and published-time metadata shown
- When `is_resolved`, an emerald "Official Resolution Note" card shows outcome, resolution time, resolver, and `resolution_source`

#### TASK 2.2 — "Market Context" neutral paragraph section ✅ Done
**Implemented in:**
- `frontend/src/components/market/MarketRules.tsx` (`RulesMarketContext`)

**What shipped:**
- `market.market_context` rendered in a dedicated "Market Context" labeled card below the Resolution Rules card

---

### Phase 3 — Priority 3 (Post-Trade Experience)
**Target: P-6, P-5**

#### TASK 3.1 — Remove or replace internal-balance-style UI in ProfileOverview
**Files to modify:**
- `frontend/src/components/profile/ProfileOverview.tsx`

**Implementation detail:**
1. Remove the disabled "Receive Pi" button entirely (implies withdraw/cashout).
2. Keep "Send Pi" button but rename to "Place Prediction" or remove if redundant with market-level CTAs.
3. Rename "Positions Value" to "Active Positions" or "Prediction Value" to avoid balance connotation.

#### TASK 3.2 — Unhide ProfileActivityTab
**Files to modify:**
- `frontend/src/app/profile/page.tsx`

**Implementation detail:**
Remove `className="hidden"` from the Activity tab trigger and `TabsContent`. Verify `ProfileActivityTab.tsx` is functional before enabling. The activity feed gives users confidence their actions are recorded.

---

### Phase 4 — Priority 4 (Dynamic Discovery)
**Target: P-1, P-2, G-5**

#### TASK 4.1 — Verify and fix Trending algorithm (recent activity vs lifetime volume)
**Files to inspect and modify:**
- `backend/app/updator/market_stats_updator.py`
- `backend/app/repositories/markets.py`

**Implementation detail:**
1. Open `market_stats_updator.py` and inspect the label-assignment logic.
2. "Trending" must use `trades_24h` or `volume_24h` delta against baseline, NOT cumulative `volume`.
3. "Hot" should combine: high `volume_24h` + high `trades_24h` + recent `price_move_24h` + high `comments_24h`.
4. "New" should be: `created_at` within 48–72 hours.
5. "Ending Soon" should be: `end_date` within 24–72 hours from now.
6. Verify the `market_stats` table refresh interval is short enough (≤ 15 min) to reflect real activity.

#### TASK 4.2 — Add "Entertainment" and "Community" categories
**Files to modify:**
- `frontend/src/lib/market-categories.ts`
- `backend/app/db/seeds.py` (if category seeds exist)

**Implementation detail:**
Add `"Entertainment"` and `"Community"` to `MARKET_CATEGORIES`. Ensure the backend `/api/markets/categories` endpoint returns them and the `[category]/page.tsx` route handles them.

#### TASK 4.3 — Related Markets section on market detail page
**Files to create/modify:**
- `frontend/src/components/market/RelatedMarkets.tsx` (new)
- `backend/app/routes/api/markets.py` (add `GET /markets/{id}/related`)
- `frontend/src/app/markets/[id]/page.tsx`

**Implementation detail:**
1. Backend: `GET /markets/{id}/related` returns 3–5 markets sharing the same category (excluding current), ordered by `volume_24h` DESC.
2. Frontend: `RelatedMarkets.tsx` renders a horizontal scroll row of compact `MarketCard`-like tiles.
3. Add `<RelatedMarkets market={market} />` at the bottom of the market detail page, after `<MarketParticipants>`.

---

### Phase 5 — Priority 5 (Admin Control / Audit Trail)
**Target: G-1, G-2, ~~G-6~~, G-7**

#### TASK 5.1 — Admin Audit Log UI
**Files to create/modify:**
- `frontend/src/app/admin/audit-log/page.tsx` (new)
- `frontend/src/components/admin/AuditLogManager.tsx` (new)
- `backend/app/routes/api/admin.py` (add `GET /admin/audit-log`)
- `backend/app/repositories/admin.py` (add audit log query)

**Implementation detail:**
1. Backend `compliance_logger.py` already writes records. Add a `GET /admin/audit-log` endpoint that queries the compliance log table with filters: `event_type`, `user_id`, `market_id`, `date_range`, pagination.
2. Frontend: `AuditLogManager.tsx` renders a table with columns:
   - Timestamp
   - Admin user
   - Action type (market_created / market_resolved / payout_sent / user_banned / comment_removed / rules_changed)
   - Subject (market name / user name)
   - Detail (brief description)
   - IP / session reference
3. Add link in admin nav: "Audit Log"

**Logged events to ensure backend captures:**

| Event | Trigger |
|-------|---------|
| `market_created` | `POST /admin/markets` |
| `market_edited` | `PATCH /admin/markets/{id}` |
| `market_closed` | `POST /admin/markets/{id}/close` |
| `market_resolved` | `POST /admin/markets/{id}/resolve` |
| `payout_generated` | Pi payout approve/complete |
| `payout_marked_paid` | Admin marks payout done |
| `user_banned` | Admin changes user status |
| `comment_removed` | Admin soft-deletes comment |
| `clarification_posted` | `POST /admin/markets/{id}/clarification` |
| `rules_changed` | Any admin market edit with rule fields changed |

#### TASK 5.2 — Payout Queue per-row detail table
**Files to modify:**
- `frontend/src/components/admin/PaymentManager.tsx`
- `backend/app/repositories/admin.py` (expand payout queue query)
- `backend/app/routes/api/admin.py` (add `GET /admin/payout-queue`)

**Implementation detail:**
1. Backend: Add `GET /admin/payout-queue` returning paginated list of pending payouts:
   ```
   { user_id, pi_username, market_id, market_question, outcome, amount_owed, wallet_address, payment_status, txid, created_at }
   ```
2. Frontend: Add a sub-section in `PaymentManager.tsx` below the summary stats: a table with one row per pending payout. Each row has an "Action" dropdown: "Mark Paid" / "Flag for Review" / "Export".

#### TASK 5.3 — Inline comment moderation (mute/ban from comment context) ✅ Done
**Implemented in:**
- `frontend/src/components/market/participants/CommentActionMenu.tsx`
- `frontend/src/components/market/participants/MarketCommentsList.tsx`
- `backend/app/routes/api/comments.py` (`POST /comments/{id}/report`)
- `backend/app/repositories/comments.py` (`report_comment`, `list_market_comments` root-only `depth=0`)
- `backend/app/routes/api/users.py` (`POST /users/status` — admin role + `user_id` int parsing)

**What shipped:**
1. `⋯` menu on each root comment and reply — users: Report; admins: Hide comment / Mute user / Ban user
2. `POST /api/comments/{id}/report` → `compliance_logs` (`comment_reported`; `ensure_compliance_logs` creates table if missing)
3. Hide → `DELETE /api/comments/{id}`; Mute/Ban → `POST /api/users/status`

#### TASK 5.4 — Manual override history
**Files to create:**
- Include as a tab in `AuditLogManager.tsx` filtered to `event_type = "manual_override"`

**Implementation detail:**
Filter the audit log by `manual_override` action type. Any time an admin changes a resolved market outcome, overrides a payment, or modifies a position post-resolution, log it as `manual_override` with a required `reason` text field.

---

## Summary Table — All Gaps with Phase Assignment

| # | Gap | Priority | Phase | Effort | Status |
|---|-----|----------|-------|--------|--------|
| G-3 | Resolved positions: result, returned Pi, txid, resolution source | P1 | Phase 1 | Medium | ❌ |
| P-3 | Open positions: fee / total cost / estimated return / close date | P1 | Phase 1 | Small | ⚠️ |
| ~~P-7~~ | ~~Pinned admin clarification in Discussion~~ | P2 | Phase 2 | Small | ✅ |
| ~~P-4~~ | ~~"Market context" neutral paragraph section~~ | P2 | Phase 2 | Small | ✅ |
| P-6 | "Receive Pi" / "Positions Value" balance-language cleanup | P3 | Phase 3 | Small | ⚠️ |
| P-5 | ProfileActivityTab hidden — unhide and verify | P3 | Phase 3 | Small | ⚠️ |
| P-1 | Trending algorithm audit (recent vs lifetime) | P4 | Phase 4 | Medium | ⚠️ |
| P-2 | Add "Entertainment" and "Community" categories | P4 | Phase 4 | Small | ⚠️ |
| G-5 | Related Markets section on market detail page | P4 | Phase 4 | Medium | ❌ |
| G-1 | Admin Audit Log UI | P5 | Phase 5 | Large | ❌ |
| G-2 | Payout Queue per-row detail table | P5 | Phase 5 | Medium | ❌ |
| ~~G-6~~ | ~~Inline comment moderation~~ | P5 | Phase 5 | Small | ✅ |
| G-7 | Manual override history | P5 | Phase 5 | Small (piggyback on G-1) | ❌ |

---

## What Is Already Solid — No Action Required

The following audit items are **fully and correctly implemented** and require no additional work:

- ✅ Market card labels (New / Trending / Hot / Ending Soon) with color coding
- ✅ Activity signals on cards (trades_24h, comments_24h, price_move_24h)
- ✅ Mini sparkline on market cards
- ✅ Featured market card with price chart + live comments carousel
- ✅ Discovery navigation (Trending / New / Hot / Ending Soon / Most Discussed / Watchlist)
- ✅ Resolution Rules card: Yes Criteria / No Criteria / Resolution Source / Edge Cases / Dates
- ✅ Rules card structurally separated from trade panel in page layout
- ✅ Admin clarification posting tool (admin-side) + pinned display in user Discussion (`DiscussionPinnedNotes.tsx`)
- ✅ "Market Context" neutral paragraph (`MarketRules.tsx` · `RulesMarketContext`)
- ✅ Trade terminology standardized: Amount / Fee / Total Cost / Estimated Return / Net Result / Loss if Incorrect
- ✅ "Potential profit" fully replaced — no prohibited language in trade UI
- ✅ Full calculation breakdown before confirmation
- ✅ Single calculation source (`calculateTradeBreakdown`) used for order, payment, and position
- ✅ Post-trade confirmation card with all required fields
- ✅ 5-stage loading indicator (preparing → awaiting → detected → recorded → confirmed)
- ✅ 5 failure states with per-reason user recovery instructions
- ✅ Pi payment lifecycle: approve / complete / cancel
- ✅ Non-escrow flow: pay per prediction, direct payout, no internal balance
- ✅ Comment system: `MarketComment.tsx` + `MarketCommentsList.tsx` (root comments only, `depth=0`), comment count signals
- ✅ Discussion pinned notes: admin clarification + official resolution note (`DiscussionPinnedNotes.tsx`)
- ✅ Inline comment moderation: Report / Hide / Mute / Ban (`CommentActionMenu.tsx`, `POST /comments/{id}/report`)
- ✅ Trust & Safety admin dashboard with all required metrics
- ✅ Payment summary with manual payout queue total
- ✅ Wallet section in profile (pi_username, pi_uid, payout_destination, last_verified)
- ✅ PnL history chart with 1D / 1W / 1M / ALL periods
- ✅ Prediction history model (not internal wallet balance model)

---

*Document prepared by: AI analysis against `20260502_Audit.md`. Updated 2026-05-29 to reflect Section 4 Discussion & comment moderation implementation.*
