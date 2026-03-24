PredictPix — Production Launch Readiness Framework (Draft)
________________________________________
1. Authentication & Wallet Integrity (Critical)
These systems must be reliable before mainnet exposure.
•	Secure Pi SDK login flow
•	Short-lived JWT access tokens + refresh rotation
•	Removal of client-exposed API keys
•	Wallet ownership verification (signature-based)
•	One wallet per account enforcement
•	Server-side balance validation before prediction submission
•	Rate limiting on authentication endpoints
•	Strict CORS enforcement
•	Secure secret storage (no hardcoded credentials)
________________________________________
2. Market Lifecycle Engine
Markets must behave deterministically and immutably once finalized.
•	Admin-only market creation
•	Clear status transitions: Draft → Active → Locked → Resolved → Finalized
•	Explicit resolution locking (irreversible once finalized)
•	Resolution audit logging
•	Timestamp-based lock enforcement
•	Prevention of post-close predictions
•	Logged admin override capability
________________________________________
3. Position & Exposure Controls
Guardrails must prevent manipulation or destabilization.
•	Capped price movement per trade (e.g., max 5% swing)
•	Per-user exposure limits
•	Per-market exposure limits
•	Whale-prevention logic
•	Double-spend prevention
•	Idempotent transaction submission
•	Race-condition protection
•	Precision and rounding safeguards
________________________________________
4. Reward Distribution System (Level 1 – Semi-Automated)
Minimum viable system must be auditable and deterministic.
•	Admin resolution trigger
•	Deterministic payout calculation engine
•	Transaction queue for distributions
•	Dedicated payout ledger table
•	Idempotent payout processing
•	Manual review checkpoint before send
•	Payout status tracking (pending / sent / failed)
•	Full audit trail
•	Admin wallet balance visibility
________________________________________
5. Database Hardening
•	Properly configured RLS policies
•	No unintended public write access
•	Index optimization
•	Foreign key enforcement
•	Constraint validation
•	Migration tracking
•	Backup configuration
•	Point-in-time recovery enabled
________________________________________
6. Comments & Moderation Stability
Public-facing systems must feel controlled and trustworthy.
•	Single canonical comments table
•	Proper RLS enforcement
•	Rate limiting
•	Soft delete capability
•	Basic moderation tooling
•	Spam prevention controls
________________________________________
7. Admin Control Panel (Minimum Viable)
Administrative clarity is essential.
•	Market create / edit / resolve
•	Reward trigger and monitoring
•	User lookup
•	Exposure view per market
•	Admin audit log visibility
•	Emergency global trading freeze switch
________________________________________
8. Security & Infrastructure
Infrastructure must meet baseline production standards.
•	HTTPS enforcement
•	Firewall configuration
•	SSH key-only access
•	Intrusion protection (e.g., fail2ban or equivalent)
•	Environment variable isolation
•	Log monitoring
•	Error logging system
•	Basic alerting for failures
•	Dependency updates applied
•	No exposed debug endpoints
________________________________________
9. Financial & Risk Controls
•	Separation of platform wallet and operational wallet
•	Fee accounting consistency
•	Gas reserve buffer management
•	Transaction reconciliation process
•	Daily ledger reconciliation capability
________________________________________
10. Transparency & Trust Layer
Launch systems must feel governed and transparent.
•	Public rules page
•	Resolution policy documentation
•	Fee disclosure
•	Reward timing disclosure
•	Terms of use
•	Disclaimer language
•	Versioned update log
________________________________________


This is our current thinking around what a serious launch standard looks like.
We’d value your assessment on:

1.	What is technically required versus aspirational
2.	What order you would implement this in
3.	What you believe is the true minimum viable launch threshold
4.	Rough complexity grouping (low / medium / high effort)

If we’re going to treat this as a production system rather than an experiment, I think this is the right moment to align on the real scope. We are really excited to get this into the hands of users and generating revenue to continue the growth of the app and its possibilities. Another area we are considering is advertising. I would love to hear what you think about that too. 
Looking forward to your thoughts.

I’m currently working through some documentation for contracts outlining exactly how our full agreement will look moving forward. 

Also, I’m not sure if we are operating within the realm of Freelancer anymore, or if we have moved beyond that. If you think its best to continue communication through Freelancer, that is fine, but if you think its time to take our communications and stuff beyond Freelancer, just let me know and we can set that up.

