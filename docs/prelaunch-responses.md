I've written answers using the four questions you presented as section headings.

---

## 1. What is technically required versus aspirational?

I think all features you mentioned are requied.

---

## 2. What order you would implement this in?

- Database hardening (5)
- Auth & wallet (1)
- Market lifecycle (2)
- Position & exposure (3)
- Reward distribution (4)
- Security & infra (8)
- Admin panel (7)
- Comments (6)
- Financial controls (9)
- Transparency (10)

---

## 3. What you believe is the true minimum viable launch threshold?

We can launch when:

- Users can log in safely and wallets are verified.
- Markets move through clear states and lock correctly.
- Users can’t over‑expose themselves or the system.
- Payouts are deterministic, auditable, and reviewed before sending.
- Database and infra are hardened enough.

Comments, full reconciliation, and polished docs can follow. The line is: no one loses money because of a bug, and you can operate the system without chaos.

---

## 4. Rough complexity grouping (low / medium / high effort)

**Low:** 
- Transparency docs (10)
- Basic admin UI (7)
- CORS and rate limiting
- Backup config
- Public rules page

**Medium:** 
- Pi SDK integration and wallet verification (1)
- Market lifecycle (2)
- Position controls (3)
- RLS and DB hardening (5)
- Comments and moderation (6)
- Reward queue and ledger (4)
- JWT refresh flow

**High:** 
- Deterministic payout engine with audit trail (4)
- Whale prevention and exposure limits (3)
- Full financial reconciliation (9)

---
