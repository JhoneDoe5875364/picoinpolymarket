# PredictPix Prelaunch Assessment — Response Document
# PredictPix 사전 출시 평가 — 응답 문서

________________________________________
## Document Purpose | 문서 목적
________________________________________

**EN:** Answers to the questions posed in prelaunch.md (lines 108–115), based on analysis of the current PredictPix codebase and production readiness framework.

**KO:** prelaunch.md(108–115행)에서 제기된 질문에 대한 답변으로, 현재 PredictPix 코드베이스 및 프로덕션 준비 프레임워크 분석을 기반으로 작성됨.

________________________________________
## Executive Summary | 경영 요약
________________________________________

**EN:** PredictPix already has a working MVP: Pi auth, markets, trading, internal balance, claim flow, admin panel, comments, and geo controls. The prelaunch framework is well-structured. This assessment separates must-have items for a safe launch from aspirational improvements, proposes a phased implementation order, defines a minimum viable launch threshold, and groups work by complexity.

**KO:** PredictPix는 이미 동작하는 MVP를 보유하고 있음: Pi 인증, 마켓, 거래, 내부 잔액, 청구 플로우, 관리자 패널, 댓글, 지역 제어 기능이 구현되어 있음. 사전 출시 프레임워크는 잘 구성되어 있음. 본 평가는 안전한 출시를 위한 필수 항목과 출시 후 개선 목표를 구분하고, 단계별 구현 순서를 제안하며, 최소 실행 가능 출시 기준을 정의하고, 작업을 복잡도별로 그룹화함.

________________________________________
## 1. Technically Required vs Aspirational
## 1. 기술적 필수 vs 출시 후 개선
________________________________________

### Technically Required (Must-Have for Production)
### 기술적 필수 (프로덕션 필수)

| EN | KO |
|----|-----|
| **Auth & Wallet:** Secure Pi SDK flow, JWT access tokens, removal of client-exposed API keys, server-side balance validation before prediction, rate limiting on auth endpoints, secure secret storage | **인증 및 지갑:** 안전한 Pi SDK 플로우, JWT 액세스 토큰, 클라이언트 노출 API 키 제거, 예측 전 서버 측 잔액 검증, 인증 엔드포인트 속도 제한, 안전한 비밀 저장소 |
| Without these, users can be exploited, balances can be manipulated, and the system is vulnerable to abuse. | 없으면 사용자 악용, 잔액 조작, 시스템 악용 가능. |
| **Market Lifecycle:** Admin-only creation, clear status transitions (at minimum: open → resolved), prevention of post-close predictions, timestamp-based lock | **마켓 생명주기:** 관리자 전용 생성, 명확한 상태 전환(최소: open → resolved), 마감 후 예측 방지, 타임스탬프 기반 잠금 |
| Markets must behave deterministically; post-close predictions would corrupt payouts. | 마켓은 결정적으로 동작해야 함; 마감 후 예측은 지급에 오류 발생. |
| **Position & Exposure:** Server-side balance check before trade, double-spend prevention, idempotent transaction submission, race-condition protection | **포지션 및 노출:** 거래 전 서버 측 잔액 확인, 이중 지출 방지, 멱등 트랜잭션 제출, 경쟁 조건 방지 |
| Current code lacks balance validation before POST /positions; race conditions can cause overdrafts. | 현재 코드는 POST /positions 전 잔액 검증 부재; 경쟁 조건으로 인한 초과 인출 가능. |
| **Reward Distribution:** Deterministic payout calculation (already exists), idempotent payout processing, payout status tracking, audit trail | **보상 분배:** 결정적 지급 계산(기존 존재), 멱등 지급 처리, 지급 상태 추적, 감사 추적 |
| Payout logic is documented and works; needs auditability and status tracking. | 지급 로직은 문서화되어 있고 동작함; 감사 가능성 및 상태 추적 필요. |
| **Database Hardening:** RLS policies on sensitive tables, no unintended public write access, foreign key enforcement | **데이터베이스 강화:** 민감 테이블 RLS 정책, 의도치 않은 공개 쓰기 접근 차단, 외래 키 제약 |
| Supabase/Postgres security baseline; prevents data leakage and unauthorized writes. | Supabase/Postgres 보안 기본; 데이터 유출 및 무단 쓰기 방지. |
| **Comments:** Single canonical comments table (exists), rate limiting, basic spam prevention | **댓글:** 단일 표준 댓글 테이블(존재), 속도 제한, 기본 스팸 방지 |
| Public-facing content must be controllable. | 공개 콘텐츠는 제어 가능해야 함. |
| **Admin Panel:** Market create/edit/resolve (exists), user lookup (exists), emergency global trading freeze | **관리자 패널:** 마켓 생성/편집/해결(존재), 사용자 조회(존재), 긴급 전역 거래 중지 |
| Freeze switch is critical for incident response. | 중지 스위치는 사고 대응에 필수. |
| **Security & Infra:** HTTPS enforcement, environment variable isolation, no exposed debug endpoints, error logging | **보안 및 인프라:** HTTPS 적용, 환경 변수 격리, 디버그 엔드포인트 비노출, 오류 로깅 |
| Baseline production security. | 프로덕션 기본 보안. |
| **Transparency:** Public rules page, fee disclosure, terms of use, disclaimer | **투명성:** 공개 규칙 페이지, 수수료 공개, 이용 약관, 면책 조항 |
| Legal and trust requirements for a prediction market. | 예측 마켓의 법적 및 신뢰 요건. |

### Aspirational (Post-Launch Improvements)
### 출시 후 개선 (Aspirational)

| EN | KO |
|----|-----|
| **Auth:** Short-lived JWT + refresh rotation, wallet ownership verification (signature-based), one wallet per account | **인증:** 단기 JWT + 리프레시 로테이션, 지갑 소유권 검증(서명 기반), 계정당 한 지갑 |
| Improves UX and security but not blocking for MVP; can be phased. | MVP 차단 아님; 단계적 적용 가능. |
| **Market Lifecycle:** Full Draft → Active → Locked → Resolved → Finalized, resolution audit logging, logged admin override | **마켓 생명주기:** Draft → Active → Locked → Resolved → Finalized 전체 흐름, 해결 감사 로깅, 관리자 오버라이드 로깅 |
| Valuable for governance; can be added after launch. | 거버넌스에 유용; 출시 후 추가 가능. |
| **Position & Exposure:** Capped price movement per trade, per-user/per-market exposure limits, whale-prevention logic | **포지션 및 노출:** 거래당 가격 변동 상한, 사용자/마켓별 노출 한도, 거대 참여자 방지 로직 |
| Important for scale; can start with simpler limits. | 규모 확장에 중요; 단순한 한도로 시작 가능. |
| **Reward Distribution:** Manual review checkpoint before send, dedicated payout ledger table, admin wallet balance visibility | **보상 분배:** 전송 전 수동 검토 체크포인트, 전용 지급 원장 테이블, 관리자 지갑 잔액 가시성 |
| Improves operational control; can be added incrementally. | 운영 제어 개선; 점진적 추가 가능. |
| **Database:** Index optimization, migration tracking (e.g. Alembic), point-in-time recovery, backup configuration | **데이터베이스:** 인덱스 최적화, 마이그레이션 추적(예: Alembic), 시점 복구, 백업 설정 |
| Performance and ops improvements; not blocking for small-scale launch. | 성능 및 운영 개선; 소규모 출시에 차단 아님. |
| **Comments:** Soft delete, full moderation tooling | **댓글:** 소프트 삭제, 전체 모더레이션 도구 |
| Nice to have; basic rate limiting and spam controls suffice initially. | 기본 속도 제한 및 스팸 제어로 초기 충분. |
| **Admin:** Exposure view per market, admin audit log visibility | **관리자:** 마켓별 노출 뷰, 관리자 감사 로그 가시성 |
| Improves operations; not blocking. | 운영 개선; 차단 아님. |
| **Security:** Firewall configuration, SSH key-only access, fail2ban, log monitoring, alerting | **보안:** 방화벽 설정, SSH 키 전용 접근, fail2ban, 로그 모니터링, 알림 |
| Infrastructure hardening; can follow initial launch. | 인프라 강화; 초기 출시 후 적용 가능. |
| **Financial Controls:** Separation of platform/operational wallet, gas reserve buffer, daily ledger reconciliation | **재무 통제:** 플랫폼/운영 지갑 분리, 가스 예비 버퍼, 일일 원장 조정 |
| Important for scale and compliance; can be phased. | 규모 및 규정 준수에 중요; 단계적 적용 가능. |
| **Transparency:** Resolution policy documentation, reward timing disclosure, versioned update log | **투명성:** 해결 정책 문서화, 보상 시점 공개, 버전 관리 업데이트 로그 |
| Enhances trust; can be added post-launch. | 신뢰 향상; 출시 후 추가 가능. |

________________________________________
## 2. Recommended Implementation Order
## 2. 권장 구현 순서
________________________________________

### Phase 1 — Launch Blockers (Weeks 1–3)
### Phase 1 — 출시 차단 요소 (1–3주차)

| EN | KO |
|----|-----|
| **Position & Exposure Controls (Critical)** | **포지션 및 노출 (중요)** |
| Server-side balance validation before prediction submission | 예측 제출 전 서버 측 잔액 검증 |
| Idempotent transaction submission (e.g. idempotency key) | 멱등 트랜잭션 제출(예: idempotency key) |
| Basic race-condition protection (e.g. row-level locking or optimistic concurrency) | 기본 경쟁 조건 방지(예: 행 수준 잠금 또는 낙관적 동시성) |
| **Auth & Wallet Integrity (Critical)** | **인증 및 지갑 (중요)** |
| Remove client-exposed API keys | 클라이언트 노출 API 키 제거 |
| Rate limiting on auth endpoints | 인증 엔드포인트 속도 제한 |
| Secure secret storage verification | 안전한 비밀 저장소 검증 |
| **Admin Emergency Controls** | **관리자 긴급 통제** |
| Global trading freeze switch | 전역 거래 중지 스위치 |
| **Transparency (Legal)** | **투명성(법적)** |
| Public rules page | 공개 규칙 페이지 |
| Fee disclosure (2% is already in place; document it) | 수수료 공개(2% 이미 적용됨; 문서화) |
| Terms of use and disclaimer (pages exist; ensure they are complete) | 이용 약관 및 면책 조항(페이지 존재; 완전성 확인) |

### Phase 2 — Security Hardening (Weeks 4–5)
### Phase 2 — 보안 강화 (4–5주차)

| EN | KO |
|----|-----|
| **Database Hardening** | **데이터베이스 강화** |
| RLS policies on users, positions, trades, transactions, markets | users, positions, trades, transactions, markets에 RLS 정책 적용 |
| Verify no unintended public write access | 의도치 않은 공개 쓰기 접근 차단 확인 |
| **Market Lifecycle** | **마켓 생명주기** |
| Prevention of post-close predictions (timestamp-based lock) | 마감 후 예측 방지(타임스탬프 기반 잠금) |
| Clear status checks before accepting trades | 거래 수락 전 명확한 상태 검사 |
| **Comments & Moderation** | **댓글 및 모더레이션** |
| Rate limiting on comment endpoints | 댓글 엔드포인트 속도 제한 |
| Basic spam prevention (e.g. simple frequency limits) | 기본 스팸 방지(예: 단순 빈도 제한) |
| **Security & Infrastructure** | **보안 및 인프라** |
| HTTPS enforcement | HTTPS 적용 |
| Verify no debug endpoints in production | 프로덕션에 디버그 엔드포인트 없음 확인 |
| Error logging in place | 오류 로깅 설정 |

### Phase 3 — Post-Launch Improvements (Weeks 6+)
### Phase 3 — 출시 후 개선 (6주차 이후)

| EN | KO |
|----|-----|
| JWT refresh token rotation | JWT 리프레시 토큰 로테이션 |
| Wallet ownership verification | 지갑 소유권 검증 |
| Per-user / per-market exposure limits | 사용자/마켓별 노출 한도 |
| Payout ledger table and manual review checkpoint | 지급 원장 테이블 및 수동 검토 체크포인트 |
| Admin exposure view and audit log visibility | 관리자 노출 뷰 및 감사 로그 가시성 |
| Resolution audit logging and full market lifecycle (Draft → Finalized) | 해결 감사 로깅 및 전체 마켓 생명주기(Draft → Finalized) |
| Financial controls (wallet separation, reconciliation) | 재무 통제(지갑 분리, 조정) |

________________________________________
## 3. True Minimum Viable Launch Threshold
## 3. 진정한 최소 실행 가능 출시 기준
________________________________________

### Definition | 정의

**EN:** A launch is viable when users can trade safely, winners are paid correctly, and the system can be stopped in an emergency.

**KO:** 사용자가 안전하게 거래하고, 승자가 올바르게 지급받으며, 긴급 시 시스템을 중지할 수 있을 때 출시가 가능함.

### Must Be True Before Launch | 출시 전 필수 조건

| # | EN | KO |
|---|-----|-----|
| 1 | No prediction without sufficient balance — Status: Missing — Action: Add server-side balance check in POST /positions | 잔액 부족 시 예측 불가 — 상태: 미구현 — 조치: POST /positions에 서버 측 잔액 검사 추가 |
| 2 | No double-spend / race-condition overdraft — Status: At risk — Action: Add idempotency + locking | 이중 지출/경쟁 조건 초과 인출 방지 — 상태: 위험 — 조치: 멱등성 + 잠금 추가 |
| 3 | No trades after market close — Status: Verify — Action: Enforce closes_at / end_date before accepting trades | 마켓 마감 후 거래 없음 — 상태: 검증 필요 — 조치: 거래 수락 전 closes_at / end_date 적용 |
| 4 | Payout calculation is deterministic and auditable — Status: Exists — Action: Document and keep as-is | 지급 계산이 결정적이고 감사 가능 — 상태: 존재 — 조치: 문서화 및 유지 |
| 5 | Admin can freeze all trading — Status: Missing — Action: Add global freeze flag and enforce in trade endpoints | 관리자가 모든 거래 중지 가능 — 상태: 미구현 — 조치: 전역 중지 플래그 추가 및 거래 엔드포인트에서 적용 |
| 6 | Auth endpoints are rate-limited — Status: Missing — Action: Add rate limiting (e.g. slowapi or similar) | 인증 엔드포인트 속도 제한 — 상태: 미구현 — 조치: 속도 제한 추가(예: slowapi 등) |
| 7 | No API keys exposed to client — Status: Verify — Action: Audit frontend and env vars | 클라이언트에 API 키 노출 없음 — 상태: 검증 필요 — 조치: 프론트엔드 및 env 변수 감사 |
| 8 | Fees and rules are disclosed — Status: Partial — Action: Add rules page and fee disclosure | 수수료 및 규칙 공개 — 상태: 부분적 — 조치: 규칙 페이지 및 수수료 공개 추가 |
| 9 | RLS prevents unauthorized data access — Status: Unknown — Action: Audit Supabase RLS policies | RLS로 무단 데이터 접근 방지 — 상태: 미확인 — 조치: Supabase RLS 정책 감사 |
| 10 | HTTPS in production — Status: Assume — Action: Confirm in deployment config | 프로덕션 HTTPS — 상태: 가정 — 조치: 배포 설정에서 확인 |

### Summary | 요약

**EN:** Minimum viable launch: Complete Phase 1 (items 1–4 above) and verify items 5–10. Phase 2 can overlap with a soft launch if risk is acceptable.

**KO:** 최소 실행 가능 출시: Phase 1(위 1–4번) 완료 및 5–10번 검증. Phase 2는 위험 수용 가능 시 소프트 출시와 병행 가능.

________________________________________
## 4. Rough Complexity Grouping
## 4. 대략적 복잡도 그룹
________________________________________

### Low Effort (1–3 days each) | 낮은 노력 (각 1–3일)

| EN | KO |
|----|-----|
| Global trading freeze switch — Add trading_frozen flag; check in trade endpoints | 전역 거래 중지 스위치 — trading_frozen 플래그 추가; 거래 엔드포인트에서 확인 |
| Fee disclosure page — Static content; link from footer | 수수료 공개 페이지 — 정적 콘텐츠; 푸터에서 링크 |
| Public rules page — Static content | 공개 규칙 페이지 — 정적 콘텐츠 |
| Rate limiting on auth — Use slowapi or similar middleware | 인증 속도 제한 — slowapi 또는 유사 미들웨어 사용 |
| Verify no debug endpoints — Config/env audit | 디버그 엔드포인트 없음 확인 — config/env 감사 |
| Basic comment rate limiting — Per-user/IP limits on comment endpoints | 기본 댓글 속도 제한 — 댓글 엔드포인트에 사용자/IP별 제한 |

### Medium Effort (3–7 days each) | 중간 노력 (각 3–7일)

| EN | KO |
|----|-----|
| Server-side balance validation — Add check in POST /positions; handle edge cases | 서버 측 잔액 검증 — POST /positions에 검사 추가; 엣지 케이스 처리 |
| Idempotent transaction submission — Idempotency keys; idempotency table | 멱등 트랜잭션 제출 — idempotency 키; idempotency 테이블 |
| Prevention of post-close predictions — Validate closes_at / end_date in trade flow | 마감 후 예측 방지 — 거래 플로우에서 closes_at / end_date 검증 |
| RLS policies — Define policies for main tables; test thoroughly | RLS 정책 — 주요 테이블에 정책 정의; 철저 검증 |
| Remove client-exposed API keys — Audit and move to backend-only | 클라이언트 노출 API 키 제거 — 감사 및 백엔드 전용으로 이동 |
| Basic spam prevention (comments) — Frequency limits, simple heuristics | 기본 스팸 방지(댓글) — 빈도 제한, 단순 휴리스틱 |

### High Effort (1–3 weeks each) | 높은 노력 (각 1–3주)

| EN | KO |
|----|-----|
| Race-condition protection — Row-level locking, optimistic concurrency, or queue | 경쟁 조건 방지 — 행 수준 잠금, 낙관적 동시성 또는 큐 |
| JWT refresh token rotation — New token flow, refresh endpoint, storage | JWT 리프레시 토큰 로테이션 — 새 토큰 플로우, 리프레시 엔드포인트, 저장소 |
| Wallet ownership verification — Pi SDK integration, signature verification | 지갑 소유권 검증 — Pi SDK 통합, 서명 검증 |
| Full market lifecycle (Draft → Finalized) — Schema changes, new statuses, migration | 전체 마켓 생명주기(Draft → Finalized) — 스키마 변경, 새 상태, 마이그레이션 |
| Payout ledger + manual review — New tables, admin UI, workflow | 지급 원장 + 수동 검토 — 새 테이블, 관리자 UI, 워크플로우 |
| Per-user / per-market exposure limits — Business rules, schema, validation logic | 사용자/마켓별 노출 한도 — 비즈니스 규칙, 스키마, 검증 로직 |
| Financial controls (wallet separation, reconciliation) — Architecture and process design | 재무 통제(지갑 분리, 조정) — 아키텍처 및 프로세스 설계 |

________________________________________
## 5. Advertising — Assessment
## 5. 광고 — 평가
________________________________________

### Considerations | 고려사항

| EN | KO |
|----|-----|
| **User Experience:** Prediction markets require focus; intrusive ads can hurt engagement. Prefer non-intrusive placements (e.g. banners, sponsored sections) over interstitials. | **사용자 경험:** 예측 마켓은 집중이 필요함; 침습적 광고는 참여도를 저하시킬 수 있음. 전면 광고보다 배너, 스폰서 섹션 등 비침습적 배치 선호. |
| **Revenue vs Trust:** Ads can fund growth but must not undermine trust. Avoid ads that conflict with prediction content (e.g. gambling, get-rich-quick). | **수익 vs 신뢰:** 광고는 성장 자금을 지원할 수 있으나 신뢰를 해치지 않아야 함. 예측 콘텐츠와 충돌하는 광고(예: 도박, 빠른 부자 되기) 피함. |
| **Technical Integration:** Options include Google AdSense, custom sponsors, Pi Network ecosystem partners. Ensure ads are loaded safely (CSP, no malicious scripts). | **기술 통합:** Google AdSense, 맞춤 스폰서, Pi Network 생태계 파트너 등 옵션. 광고 안전 로드(CSP, 악성 스크립트 없음) 확인. |
| **Regulatory:** Some jurisdictions treat prediction markets as gambling; ad policies may restrict certain placements. Check Pi Network and platform policies on advertising. | **규제:** 일부 관할권은 예측 마켓을 도박으로 간주; 광고 정책이 특정 배치를 제한할 수 있음. Pi Network 및 플랫폼 광고 정책 확인. |

### Recommendation | 권장사항

| EN | KO |
|----|-----|
| **Short term:** Treat advertising as aspirational. Focus on launch and core revenue (e.g. fees). | **단기:** 광고를 출시 후 개선 목표로 취급. 출시와 핵심 수익(예: 수수료)에 집중. |
| **Post-launch:** Introduce ads gradually: | **출시 후:** 광고를 점진적으로 도입: |
| Start with a single, controlled placement (e.g. footer or sidebar) | 단일, 제어된 배치(예: 푸터 또는 사이드바)로 시작 |
| Use whitelisted, relevant advertisers | 화이트리스트된 관련 광고주 사용 |
| Monitor impact on engagement and trust | 참여도 및 신뢰에 미치는 영향 모니터링 |
| **Alternative:** Explore Pi Network ecosystem partnerships or sponsorships as a first revenue stream before generic ad networks. | **대안:** 일반 광고 네트워크 전에 Pi Network 생태계 파트너십 또는 스폰서십을 첫 수익원으로 검토. |

________________________________________
## Appendix: Current Implementation Snapshot
## 부록: 현재 구현 스냅샷
________________________________________

| # | Area / 영역 | Implemented / 구현됨 | Gaps / 부족 사항 |
|---|-------------|---------------------|------------------|
| 1 | Auth & Wallet / 인증 및 지갑 | Pi SDK login, JWT, /auth/pi, /me / Pi SDK 로그인, JWT, /auth/pi, /me | No refresh rotation, no wallet verification, no balance check before trade, no rate limiting / 리프레시 로테이션 없음, 지갑 검증 없음, 거래 전 잔액 검사 없음, 속도 제한 없음 |
| 2 | Market Lifecycle / 마켓 생명주기 | Admin create/resolve, status: open/resolved/cancelled / 관리자 생성/해결, 상태: open/resolved/cancelled | No Draft/Locked/Finalized, no resolution audit, no timestamp lock / Draft/Locked/Finalized 없음, 해결 감사 없음, 타임스탬프 잠금 없음 |
| 3 | Position & Exposure / 포지션 및 노출 | POST /positions, 2% fee / POST /positions, 2% 수수료 | No balance check, no limits, no idempotency, no race protection / 잔액 검사 없음, 한도 없음, 멱등성 없음, 경쟁 방지 없음 |
| 4 | Reward Distribution / 보상 분배 | Claim flow, v_portfolio_unclaimed, payout calc / 청구 플로우, v_portfolio_unclaimed, 지급 계산 | No payout ledger, no manual review, no status tracking / 지급 원장 없음, 수동 검토 없음, 상태 추적 없음 |
| 5 | Database / 데이터베이스 | Schema, views, functions / 스키마, 뷰, 함수 | RLS not in codebase; migration tracking absent / 코드베이스에 RLS 없음; 마이그레이션 추적 부재 |
| 6 | Comments / 댓글 | comments, market_comments, comments_insert_rpc | No RLS in code, no rate limit, no soft delete, no moderation / 코드에 RLS 없음, 속도 제한 없음, 소프트 삭제 없음, 모더레이션 없음 |
| 7 | Admin / 관리자 | Market CRUD, resolve, user list, suggestions / 마켓 CRUD, 해결, 사용자 목록, 제안 | No exposure view, no audit log UI, no global freeze / 노출 뷰 없음, 감사 로그 UI 없음, 전역 중지 없음 |
| 8 | Security / 보안 | CORS, env vars / CORS, env 변수 | HTTPS/firewall/SSH/alerting not visible in code / HTTPS/방화벽/SSH/알림이 코드에 보이지 않음 |
| 9 | Financial Controls / 재무 통제 | — | No wallet separation, no gas reserve, no reconciliation / 지갑 분리 없음, 가스 예비 없음, 조정 없음 |
| 10 | Transparency / 투명성 | Terms, privacy, about / 이용 약관, 개인정보, 소개 | No rules page, no resolution policy, no fee disclosure / 규칙 페이지 없음, 해결 정책 없음, 수수료 공개 없음 |

________________________________________

**EN:** Document generated from codebase analysis. Last updated: March 2025.

**KO:** 문서는 코드베이스 분석 기반으로 생성됨. 마지막 업데이트: 2025년 3월.
