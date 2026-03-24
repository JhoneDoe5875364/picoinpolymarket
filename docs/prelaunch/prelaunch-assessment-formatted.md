# Prelaunch Assessment — PredictPix

## Executive Summary

PredictPix has a working MVP: Pi auth, markets, trading, internal balance, claim flow, admin panel, comments, geo controls. 
The prelaunch framework is in place. 
This doc splits what we actually need for a safe launch from aspirationals, suggests a phased order, defines the minimum bar for going live, and groups work by effort.

---

## 1. Required vs Aspirational

### Required for Production

**Authentication & Wallet 
- Secure Pi SDK flow, JWT access tokens, no API keys on the client
- Server-side balance validation before prediction submission
- Rate limiting on authentication endpoints
- Secrets stored securely

Without these, users can be exploited and balances manipulated.

**Market Lifecycle Engine**

- Admin-only creation, clear status flow (at least open → resolved)
- No predictions after market close
- Timestamp-based lock

Post-close predictions would mess up payouts.

**Position & Exposure Controls**

- Server-side balance validation before prediction submission
- Double-spend prevention
- Idempotent transaction submission
- Race-condition protection

Current code doesn’t validate balance before POST /positions; races can cause overdrafts.

**Reward Distribution System (Level 1 – Semi-Automated)**

- Deterministic payout (already there)
- Idempotent payout processing
- Payout status tracking
- Audit trail

Payout logic works; we need auditability and status tracking.

**Database Hardening**

- RLS on sensitive tables
- No unintended public writes
- Foreign keys enforced

Standard Supabase/Postgres baseline.

**Comments & Moderation Stability**

- Single comments table (exists)
- Rate limiting
- Basic spam prevention

**Admin Control Panel (Minimum Viable)**

- Market create/edit/resolve (exists)
- User lookup (exists)
- Emergency global trading freeze

The freeze switch matters for incident response.

**Security & Infrastructure**

- HTTPS
- Env vars isolated
- No debug endpoints exposed
- Error logging

**Transparency & Trust Layer**

- Public rules page
- Fee disclosure
- Terms of use
- Disclaimer language

Legal and trust basics for a prediction market.

### Nice-to-HaveAspirationalh)

**Authentication & Wallet Integrity**

- JWT refresh rotation, wallet ownership verification (signature-based), one wallet per account  
→ Better UX/security, not blocking for MVP

**Market Lifecycle Engine**

- Full Draft → Active → Locked → Resolved → Finalized
- Resolution audit logging  
→ Good for governance, add later

**Position & Exposure Controls**

- Capped price movement, per-user/per-market limits, whale-prevention  
→ Important at scale; start simpler

**Reward Distribution System (Level 1 – Semi-Automated)**

- Manual review before send, dedicated payout ledger, admin wallet visibility  
→ Operational control; add incrementally

**Database Hardening**

- Index tuning, migration tracking (Alembic), point-in-time recovery  
→ Performance/ops; not blocking for small launch

**Comments & Moderation Stability**

- Soft delete, full moderation  
→ Basic rate limiting and spam controls are enough for now

**Admin Control Panel**

- Exposure view per market, audit log visibility  
→ Helpful but not blocking

**Security & Infrastructure**

- Firewall, SSH key-only, fail2ban, log monitoring  
→ Infrastructure hardening; can follow launch

**Financial & Risk Controls**

- Platform/operational wallet separation, gas reserve, daily reconciliation  
→ Important at scale; phase in

**Transparency & Trust Layer**

- Resolution policy doc, reward timing disclosure, versioned update log  
→ Trust-building; add post-launch

---

## 2. Suggested Implementation Order

### Phase 1 — Launch Blockers (Weeks 1–3)

**Position & Exposure Controls (Critical)**

- Server-side balance validation before prediction submission
- Idempotent transaction submission (idempotency key)
- Basic race protection (row-level locking or optimistic concurrency)

**Authentication & Wallet Integrity (Critical)**

- Remove client-exposed API keys
- Rate limiting on authentication endpoints
- Verify secure secret storage

**Admin Control Panel**

- Global trading freeze switch

**Transparency & Trust Layer**

- Public rules page
- Fee disclosure (2% is already there; document it)
- Terms and disclaimer (pages exist; make sure they’re complete)

### Phase 2 — Security Hardening (Weeks 4–5)

**Database Hardening**

- RLS on users, positions, trades, transactions, markets
- Confirm no unintended public writes

**Market Lifecycle Engine**

- Block post-close predictions (timestamp lock)
- Status checks before accepting trades

**Comments & Moderation Stability**

- Rate limiting on comment endpoints
- Basic spam prevention (e.g. frequency limits)

**Security & Infrastructure**

- HTTPS enforcement
- No debug endpoints in prod
- Error logging in place

### Phase 3 — Post-Launch (Weeks 6+)

- JWT refresh token rotation
- Wallet ownership verification
- Per-user / per-market exposure limits
- Payout ledger + manual review checkpoint
- Admin exposure view and audit log
- Full market lifecycle (Draft → Finalized)
- Resolution audit logging
- Financial & Risk Controls (wallet separation, reconciliation)

---

## 3. Minimum Viable Launch Threshold

**Definition:** Launch is viable when users can trade safely, winners get paid correctly, and we can stop everything in an emergency.


| #   | Condition                                           | Status  | Action                                                |
| --- | --------------------------------------------------- | ------- | ----------------------------------------------------- |
| 1   | No prediction submission without sufficient balance | Missing | Add server-side balance validation in POST /positions |
| 2   | No double-spend / race-condition overdraft          | At risk | Add idempotency + locking                             |
| 3   | No trades after market close                        | Verify  | Enforce closes_at / end_date before accepting trades  |
| 4   | Payout calculation deterministic and auditable      | Exists  | Document and keep                                     |
| 5   | Admin can freeze all trading                        | Missing | Add global freeze flag, enforce in trade endpoints    |
| 6   | Authentication endpoints rate-limited               | Missing | Add rate limiting (e.g. slowapi)                      |
| 7   | No API keys exposed to client                       | Verify  | Audit frontend and env vars                           |
| 8   | Fees and rules disclosed                            | Partial | Add rules page and fee disclosure                     |
| 9   | RLS prevents unauthorized data access               | Unknown | Audit Supabase RLS                                    |
| 10  | HTTPS in production                                 | Assume  | Confirm in deployment                                 |


**Bottom line:** Finish Phase 1 (items 1–4) and verify 5–10. Phase 2 can overlap with soft launch if risk is acceptable.

---

## 4. Rough Effort Estimates

**Low (1–3 days each)**

- Global trading freeze — Add trading_frozen flag; check in trade endpoints
- Fee disclosure page — Static content; link from footer
- Public rules page — Static content
- Rate limiting on authentication endpoints — slowapi or similar
- Verify no debug endpoints — Config/env audit
- Comment rate limiting — Per-user/IP limits

**Medium (3–7 days each)**

- Server-side balance validation — Check in POST /positions; handle edge cases
- Idempotent transaction submission — Idempotency keys + table
- Block post-close predictions — Validate closes_at / end_date in trade flow
- RLS policies — Define for main tables; test
- Remove client-exposed API keys — Audit and move to backend
- Basic spam prevention — Frequency limits, simple heuristics

**High (1–3 weeks each)**

- Race-condition protection — Row-level locking, optimistic concurrency, or queue
- JWT refresh token rotation — New flow, refresh endpoint, storage
- Wallet ownership verification — Pi SDK, signature verification
- Full market lifecycle (Draft → Finalized) — Schema, new statuses, migration
- Payout ledger + manual review — New tables, admin UI, workflow
- Per-user / per-market exposure limits — Business rules, schema, validation
- Financial & Risk Controls — Architecture and process design

---

## 5. Advertising

**UX:** Prediction markets need focus; intrusive ads hurt engagement. Prefer banners or sponsored sections over interstitials.

**Trust:** Ads can fund growth but shouldn’t undermine trust. Avoid gambling, get-rich-quick, or anything that conflicts with prediction content.

**Tech:** Options include AdSense, custom sponsors, Pi ecosystem partners. Load ads safely (CSP, no malicious scripts).

**Regulatory:** Some regions treat prediction markets as gambling; ad policies may restrict placements. Check Pi Network and platform policies.

**Recommendation**

- Short term: Treat ads as aspirational. Focus on launch and core revenue (fees).
- Post-launch: Add ads gradually — start with one controlled placement (footer/sidebar), use whitelisted advertisers, monitor engagement.
- Alternative: Pi ecosystem partnerships or sponsorships before generic ad networks.

---

## Appendix: Current State


| Area                                                  | Implemented                                    | Gaps                                                                                                              |
| ----------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Authentication & Wallet Integrity                     | Pi SDK login, JWT, /auth/pi, /me               | No refresh rotation, no wallet verification, no balance validation before prediction submission, no rate limiting |
| Market Lifecycle Engine                               | Admin create/resolve, open/resolved/cancelled  | No Draft/Locked/Finalized, no resolution audit, no timestamp lock                                                 |
| Position & Exposure Controls                          | POST /positions, 2% fee                        | No balance validation, no limits, no idempotency, no race protection                                              |
| Reward Distribution System (Level 1 – Semi-Automated) | Claim flow, v_portfolio_unclaimed, payout calc | No payout ledger, no manual review, no status tracking                                                            |
| Database Hardening                                    | Schema, views, functions                       | RLS not in codebase; no migration tracking                                                                        |
| Comments & Moderation Stability                       | comments, market_comments, comments_insert_rpc | No RLS in code, no rate limit, no soft delete, no moderation                                                      |
| Admin Control Panel (Minimum Viable)                  | Market CRUD, resolve, user list, suggestions   | No exposure view, no audit log UI, no global freeze                                                               |
| Security & Infrastructure                             | CORS, env vars                                 | HTTPS/firewall/SSH/alerting not visible in code                                                                   |
| Financial & Risk Controls                             | —                                              | No wallet separation, no gas reserve, no reconciliation                                                           |
| Transparency & Trust Layer                            | Terms, privacy, about                          | No rules page, no resolution policy, no fee disclosure                                                            |


TTPS/firewall/SSH/alerting not visible in code |
| Financial & Risk Controls | — | No wallet separation, no gas reserve, no reconciliation |
| Transparency & Trust Layer | Terms, privacy, about | No rules page, no resolution policy, no fee disclosure |
