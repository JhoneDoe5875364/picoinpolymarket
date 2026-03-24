# PredictPix Prelaunch Assessment — Response Document

**Document Purpose:** Answers to the questions posed in `prelaunch.md` (lines 108–115), based on analysis of the current PredictPix codebase and production readiness framework.

---

## Executive Summary

PredictPix already has a working MVP: Pi auth, markets, trading, internal balance, claim flow, admin panel, comments, and geo controls. The prelaunch framework is well-structured. This assessment separates **must-have** items for a safe launch from **aspirational** improvements, proposes a phased implementation order, defines a **minimum viable launch threshold**, and groups work by complexity.

---

## 1. Technically Required vs Aspirational

### Technically Required (Must-Have for Production)

| Area | Required Items | Rationale |
|------|----------------|-----------|
| **1. Auth & Wallet** | Secure Pi SDK flow, JWT access tokens, removal of client-exposed API keys, server-side balance validation before prediction, rate limiting on auth endpoints, secure secret storage | Without these, users can be exploited, balances can be manipulated, and the system is vulnerable to abuse. |
| **2. Market Lifecycle** | Admin-only creation, clear status transitions (at minimum: open → resolved), prevention of post-close predictions, timestamp-based lock | Markets must behave deterministically; post-close predictions would corrupt payouts. |
| **3. Position & Exposure** | Server-side balance check before trade, double-spend prevention, idempotent transaction submission, race-condition protection | Current code lacks balance validation before `POST /positions`; race conditions can cause overdrafts. |
| **4. Reward Distribution** | Deterministic payout calculation (already exists), idempotent payout processing, payout status tracking, audit trail | Payout logic is documented and works; needs auditability and status tracking. |
| **5. Database Hardening** | RLS policies on sensitive tables, no unintended public write access, foreign key enforcement | Supabase/Postgres security baseline; prevents data leakage and unauthorized writes. |
| **6. Comments** | Single canonical comments table (exists), rate limiting, basic spam prevention | Public-facing content must be controllable. |
| **7. Admin Panel** | Market create/edit/resolve (exists), user lookup (exists), emergency global trading freeze | Freeze switch is critical for incident response. |
| **8. Security & Infra** | HTTPS enforcement, environment variable isolation, no exposed debug endpoints, error logging | Baseline production security. |
| **10. Transparency** | Public rules page, fee disclosure, terms of use, disclaimer | Legal and trust requirements for a prediction market. |

### Aspirational (Post-Launch Improvements)

| Area | Aspirational Items | Rationale |
|------|--------------------|-----------|
| **1. Auth** | Short-lived JWT + refresh rotation, wallet ownership verification (signature-based), one wallet per account | Improves UX and security but not blocking for MVP; can be phased. |
| **2. Market Lifecycle** | Full Draft → Active → Locked → Resolved → Finalized, resolution audit logging, logged admin override | Valuable for governance; can be added after launch. |
| **3. Position & Exposure** | Capped price movement per trade, per-user/per-market exposure limits, whale-prevention logic | Important for scale; can start with simpler limits. |
| **4. Reward Distribution** | Manual review checkpoint before send, dedicated payout ledger table, admin wallet balance visibility | Improves operational control; can be added incrementally. |
| **5. Database** | Index optimization, migration tracking (e.g. Alembic), point-in-time recovery, backup configuration | Performance and ops improvements; not blocking for small-scale launch. |
| **6. Comments** | Soft delete, full moderation tooling | Nice to have; basic rate limiting and spam controls suffice initially. |
| **7. Admin** | Exposure view per market, admin audit log visibility | Improves operations; not blocking. |
| **8. Security** | Firewall configuration, SSH key-only access, fail2ban, log monitoring, alerting | Infrastructure hardening; can follow initial launch. |
| **9. Financial Controls** | Separation of platform/operational wallet, gas reserve buffer, daily ledger reconciliation | Important for scale and compliance; can be phased. |
| **10. Transparency** | Resolution policy documentation, reward timing disclosure, versioned update log | Enhances trust; can be added post-launch. |

---

## 2. Recommended Implementation Order

### Phase 1 — Launch Blockers (Weeks 1–3)

1. **Position & Exposure Controls (Critical)**
   - Server-side balance validation before prediction submission
   - Idempotent transaction submission (e.g. idempotency key)
   - Basic race-condition protection (e.g. row-level locking or optimistic concurrency)

2. **Auth & Wallet Integrity (Critical)**
   - Remove client-exposed API keys
   - Rate limiting on auth endpoints
   - Secure secret storage verification

3. **Admin Emergency Controls**
   - Global trading freeze switch

4. **Transparency (Legal)**
   - Public rules page
   - Fee disclosure (2% is already in place; document it)
   - Terms of use and disclaimer (pages exist; ensure they are complete)

### Phase 2 — Security Hardening (Weeks 4–5)

5. **Database Hardening**
   - RLS policies on `users`, `positions`, `trades`, `transactions`, `markets`
   - Verify no unintended public write access

6. **Market Lifecycle**
   - Prevention of post-close predictions (timestamp-based lock)
   - Clear status checks before accepting trades

7. **Comments & Moderation**
   - Rate limiting on comment endpoints
   - Basic spam prevention (e.g. simple frequency limits)

8. **Security & Infrastructure**
   - HTTPS enforcement
   - Verify no debug endpoints in production
   - Error logging in place

### Phase 3 — Post-Launch Improvements (Weeks 6+)

9. JWT refresh token rotation  
10. Wallet ownership verification  
11. Per-user / per-market exposure limits  
12. Payout ledger table and manual review checkpoint  
13. Admin exposure view and audit log visibility  
14. Resolution audit logging and full market lifecycle (Draft → Finalized)  
15. Financial controls (wallet separation, reconciliation)

---

## 3. True Minimum Viable Launch Threshold

**Definition:** A launch is viable when users can trade safely, winners are paid correctly, and the system can be stopped in an emergency.

### Must Be True Before Launch

| # | Criterion | Current Status | Action |
|---|-----------|----------------|--------|
| 1 | No prediction without sufficient balance | ❌ Missing | Add server-side balance check in `POST /positions` |
| 2 | No double-spend / race-condition overdraft | ❌ At risk | Add idempotency + locking |
| 3 | No trades after market close | ⚠️ Verify | Enforce `closes_at` / `end_date` before accepting trades |
| 4 | Payout calculation is deterministic and auditable | ✅ Exists | Document and keep as-is |
| 5 | Admin can freeze all trading | ❌ Missing | Add global freeze flag and enforce in trade endpoints |
| 6 | Auth endpoints are rate-limited | ❌ Missing | Add rate limiting (e.g. slowapi or similar) |
| 7 | No API keys exposed to client | ⚠️ Verify | Audit frontend and env vars |
| 8 | Fees and rules are disclosed | ⚠️ Partial | Add rules page and fee disclosure |
| 9 | RLS prevents unauthorized data access | ⚠️ Unknown | Audit Supabase RLS policies |
| 10 | HTTPS in production | ⚠️ Assume | Confirm in deployment config |

### Summary

**Minimum viable launch:** Complete Phase 1 (items 1–4 above) and verify items 5–10. Phase 2 can overlap with a soft launch if risk is acceptable.

---

## 4. Rough Complexity Grouping

### Low Effort (1–3 days each)

| Item | Notes |
|------|-------|
| Global trading freeze switch | Add `trading_frozen` flag; check in trade endpoints |
| Fee disclosure page | Static content; link from footer |
| Public rules page | Static content |
| Rate limiting on auth | Use `slowapi` or similar middleware |
| Verify no debug endpoints | Config/env audit |
| Basic comment rate limiting | Per-user/IP limits on comment endpoints |

### Medium Effort (3–7 days each)

| Item | Notes |
|------|-------|
| Server-side balance validation | Add check in `POST /positions`; handle edge cases |
| Idempotent transaction submission | Idempotency keys; idempotency table |
| Prevention of post-close predictions | Validate `closes_at` / `end_date` in trade flow |
| RLS policies | Define policies for main tables; test thoroughly |
| Remove client-exposed API keys | Audit and move to backend-only |
| Basic spam prevention (comments) | Frequency limits, simple heuristics |

### High Effort (1–3 weeks each)

| Item | Notes |
|------|-------|
| Race-condition protection | Row-level locking, optimistic concurrency, or queue |
| JWT refresh token rotation | New token flow, refresh endpoint, storage |
| Wallet ownership verification | Pi SDK integration, signature verification |
| Full market lifecycle (Draft → Finalized) | Schema changes, new statuses, migration |
| Payout ledger + manual review | New tables, admin UI, workflow |
| Per-user / per-market exposure limits | Business rules, schema, validation logic |
| Financial controls (wallet separation, reconciliation) | Architecture and process design |

---

## 5. Advertising — Assessment

### Considerations

1. **User Experience**
   - Prediction markets require focus; intrusive ads can hurt engagement.
   - Prefer non-intrusive placements (e.g. banners, sponsored sections) over interstitials.

2. **Revenue vs Trust**
   - Ads can fund growth but must not undermine trust.
   - Avoid ads that conflict with prediction content (e.g. gambling, get-rich-quick).

3. **Technical Integration**
   - Options: Google AdSense, custom sponsors, Pi Network ecosystem partners.
   - Ensure ads are loaded safely (CSP, no malicious scripts).

4. **Regulatory**
   - Some jurisdictions treat prediction markets as gambling; ad policies may restrict certain placements.
   - Check Pi Network and platform policies on advertising.

### Recommendation

- **Short term:** Treat advertising as **aspirational**. Focus on launch and core revenue (e.g. fees).
- **Post-launch:** Introduce ads gradually:
  - Start with a single, controlled placement (e.g. footer or sidebar).
  - Use whitelisted, relevant advertisers.
  - Monitor impact on engagement and trust.
- **Alternative:** Explore Pi Network ecosystem partnerships or sponsorships as a first revenue stream before generic ad networks.

---

## Appendix: Current Implementation Snapshot

| Prelaunch Area | Implemented | Gaps |
|----------------|-------------|------|
| 1. Auth & Wallet | Pi SDK login, JWT, `/auth/pi`, `/me` | No refresh rotation, no wallet verification, no balance check before trade, no rate limiting |
| 2. Market Lifecycle | Admin create/resolve, status: open/resolved/cancelled | No Draft/Locked/Finalized, no resolution audit, no timestamp lock |
| 3. Position & Exposure | `POST /positions`, 2% fee | No balance check, no limits, no idempotency, no race protection |
| 4. Reward Distribution | Claim flow, `v_portfolio_unclaimed`, payout calc | No payout ledger, no manual review, no status tracking |
| 5. Database | Schema, views, functions | RLS not in codebase; migration tracking absent |
| 6. Comments | `comments`, `market_comments`, `comments_insert_rpc` | No RLS in code, no rate limit, no soft delete, no moderation |
| 7. Admin | Market CRUD, resolve, user list, suggestions | No exposure view, no audit log UI, no global freeze |
| 8. Security | CORS, env vars | HTTPS/firewall/SSH/alerting not visible in code |
| 9. Financial Controls | — | No wallet separation, no gas reserve, no reconciliation |
| 10. Transparency | Terms, privacy, about | No rules page, no resolution policy, no fee disclosure |

---

*Document generated from codebase analysis. Last updated: March 2025.*
