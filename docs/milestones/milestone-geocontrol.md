PREDICTPIX — GEO-COMPLIANCE & CATEGORY CONTROL SYSTEM
Developer Specification 
For Internal Engineering Use Only
________________________________________
1. SYSTEM PURPOSE
Implement a tiered, configuration-driven geocontrol system that governs:
1.	Region availability
2.	Region-based feature access
3.	Region-based category restrictions
4.	State-level overrides (where applicable)
5.	Logging & attestation
6.	Frontend + backend + edge enforcement
All rules must load from a single configuration file and must not be hardcoded.
________________________________________
2. CORE COMPONENTS
System must include the following modules:
1.	IP Resolver
2.	Region Tier Engine
3.	Category Rules Engine
4.	State-Level Overrides Engine (if applicable)
5.	Backend Enforcement Middleware
6.	Frontend Enforcement Logic
7.	Edge-Layer Enforcement (Cloudflare/Nginx)
8.	Compliance Logging & Attestation System
9.	Admin-Config Module (optional)
Each module must function independently but share configuration.
________________________________________
3. REGION STRUCTURE (ABSTRACTED TIERS)
Define three region tiers:
Tier 1 — Full Block
•	No UI access
•	No registration/login
•	No participation
•	Immediate block at edge and backend
Tier 2 — Limited Access
•	App loads
•	Public data viewable
•	Restricted categories/features blocked
Tier 3 — Full Access
•	Full app access, subject to category restrictions
________________________________________
4. CATEGORY SYSTEM (ABSTRACTED)
System must support multiple forecast categories, each independently controllable.
Each category must support:
•	Global blocks
•	Tier-based blocks
•	Region-based blocks
•	State-level overrides
•	Deterministic allow/deny output
________________________________________
5. CONFIGURATION FILE (POTENTIAL FORMAT)
System must load a primary configuration file:
tiers:
  full_block:
    - <region_code>
  restricted:
    - <region_code>
  allowed_default: true

categories:
  <category_key>:
    global_block: <true/false>
    blocked_regions:
      - <region_code>
    restricted_regions:
      - <region_code>
    allowed_regions:
      - <region_code>
    state_overrides:
      <region_code>:
        blocked_states:
          - <state_code>
        restricted_states:
          - <state_code>
        allowed_states:
          - <state_code>
Region/state codes must be defined in configs, not code.
________________________________________
6. IP RESOLUTION MODULE
The resolver must:
1.	Extract client IP
2.	Map to:
o	region_code
o	state_code (nullable)
3.	Apply strict fallback if unresolvable
4.	Cache lookups for performance
Resolver must return identifiers only and contain no region logic.
________________________________________
7. TIER ENGINE
Given a region_code, the engine must:
1.	Map region → Tier via config
2.	Default to strict Tier 1 if unresolved
3.	Output:
tier
allowed_categories[]
blocked_categories[]
restricted_categories[]
No embedded region rules allowed.
________________________________________
8. CATEGORY RULES ENGINE
Inputs:
•	region_code
•	state_code
•	category_key
Evaluation order:
1.	Global block
2.	Region-level block
3.	Region-level restriction
4.	State override (if applicable)
5.	Tier influence
6.	Default allow
Output:
allowed: true/false
reason: <rule_trigger>
________________________________________
9. BACKEND ENFORCEMENT (FASTAPI)
Middlewares:
A. resolve_region
•	Attach region_code, state_code, tier to request.state
B. geoblock(category_key)
•	If Tier 1 → block
•	If category disallowed → block
•	Else → allow
Apply to:
•	Registration
•	Login
•	Market creation
•	Participation
•	Resolution
•	Rewards
Enforce before DB writes.
________________________________________
10. FRONTEND ENFORCEMENT
On App Load
Call:
GET /api/geo/me
Response includes:
tier
blocked_categories
restricted_categories
allowed_categories
UI Behavior
•	Tier 1 → region-unavailable page
•	Tier 2 → disable restricted categories
•	Tier 3 → normal UI
Frontend must not rely on its own checks alone.
________________________________________
11. EDGE LAYER (Cloudflare/Nginx)
Requirements:
1.	Tier 1 regions must be blocked at edge level
2.	Serve static block page
3.	Log edge blocks
4.	Backend must double-enforce
Region logic must remain in configuration.
________________________________________
12. COMPLIANCE LOGGING
Record for every restricted event:
timestamp
user_id
ip
region_code
state_code
tier
category_key
action_type
result
reason
Stored in compliance_logs table.
________________________________________
13. ATTESTATION SYSTEM
On first login per session:
•	Display mandatory checkbox:
"I confirm that I am not accessing this service from a restricted region."
Store:
•	timestamp
•	user_id
•	ip
•	region_code
•	attestation_version
Participation must require valid attestation.
________________________________________
14. ADMIN CONFIGURATION MODULE
Optional UI or CLI to:
•	Reload config without deployment
•	Modify tier assignments
•	Modify category rules
•	Modify state overrides
•	Validate config integrity
Admin must not expose region names publicly.
________________________________________
