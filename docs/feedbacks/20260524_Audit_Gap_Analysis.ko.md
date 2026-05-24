# PredictPix 감사 피드백 대비 구현 갭 분석

**기준 문서:** [20260502_Audit.md](./20260502_Audit.md)  
**분석 일자:** 2026-05-24  
**분석 방법:** 감사 문서의 **[ADDED]** 항목 및 §9 우선순위를 기준으로, 현재 `frontend/`·`backend/` 코드베이스를 대조

---

## 1. 요약

감사 문서가 요구하는 **신뢰·정확성(P1)**, **규칙 명확성(P2)**, **거래 후 경험(P3)**, **동적 디스커버리(P4)**, **관리자 안전 센터(P5)** 중 상당 부분이 **UI·데이터 모델 수준에서 착수**되었으나, **핵심 비즈니스 플로우(결제 금액 일치, 정산 후 지갑 직접 지급, 감사 로그, 댓글 모더레이션)** 는 아직 미완성이거나 placeholder 상태다.

| 상태 | 의미 | 대략적 비중 |
|------|------|-------------|
| ✅ 구현됨 | 감사 요구를 실사용 가능한 수준으로 충족 | ~48% |
| 🟡 부분 구현 | UI·API·스키마 중 일부만 존재하거나 placeholder/용어 불일치 | ~33% |
| ❌ 미구현 | 코드·스키마·화면 모두 없음 | ~19% |

**가장 시급한 갭 (감사 §10 원칙 위반 가능성 높음)**

1. **Pi 결제 금액 vs UI 계산 불일치** — 거래 패널은 `price × shares + fee`를 보여주지만, 실제 Pi 결제·포지션 기록은 `shares`만 사용 (`executeBuyTrade.ts`).
2. **비권장 용어 잔존** — "Deposit", "Profit/Loss", "shares", "Trade" 등 감사 §7.2·§3.3에서 피하라고 한 표현이 다수 UI·토스트·about 페이지에 남아 있음.
3. **정산 후 App→User 직접 지급 미구현** — `is_claimed` DB 필드만 존재, 온체인 지급·프로필 payout 이력 추적 없음.
4. **관리자 감사 로그(audit log) 없음** — `AdminAudit` Pydantic 스키마만 있고 테이블·기록·UI 없음.

**최근 반영 (2026-05-24):**
- 마켓별 **`market_context` 사용자 노출** — `MarketRules` → `RulesMarketContext` (Show/Hide callout). §2.2·§3 Priority 2 참고.
- **Admin Note / Market Clarification** — `markets.admin_clarification*` 컬럼, `PUT /admin/markets/{id}/clarification`, admin `MarketAdminClarification` UI, 사용자 `RulesAdminClarification` (Rules 영역·댓글과 분리). §2.2·§2.4·§3 Priority 2 참고.
- **Watchlist** — `market_watchlist` 테이블, `POST/GET /api/watchlist`, `GET /api/markets?discovery=watchlist`, 목록·상세·Featured 카드 ☆ 토글, `/watchlist` 페이지, 햄버거 메뉴(Leaderboard↔Profile 사이). §2.1·§2.8·§3 P4 참고.
- **Share this market CTA** — `shareMarket` (Web Share API + 클립보드 fallback), 마켓 카드·상세·Featured ↗ 버튼. §2.1·§2.8·§3 P4 참고.

---

## 2. 영역별 상세 갭

### 2.1 마켓 리스트 · 디스커버리 (감사 §1, §8)

| 감사 항목 | 상태 | 현재 구현 | 갭 |
|-----------|------|-----------|-----|
| Trending / New / Hot / Ending Soon 라벨 | ✅ | `markets.py` `_build_market_labels`, `MarketCard` 배지 | — |
| 24h 거래·댓글·가격 변동 신호 | ✅ | `trades_24h`, `comments_24h`, `price_move_24h` on card | "volume up 38%" 형태의 **거래량 변화율** 신호는 없음 |
| 미니 스파크라인 | ✅ | `MiniSparkline`, API `sparkline` | 데이터 없는 마켓은 빈 상태 |
| Featured / 회전 캐러셀 | 🟡 | `FeaturedMarketCard`, `MarketsFeed` — **Trending 페이지에서만** 노출 | 다른 discovery 탭·홈 전역 하이라이트 미적용 |
| Ending Soon / Most Discussed 필터 | ✅ | `MARKET_DISCOVERY_MENUS`, API `discovery` 파라미터 | — |
| 카테고리 구조 (Sports, Crypto, Politics/Public Events, Entertainment, Community) | 🟡 | `Politics`, `Sports`, `Crypto`, `Culture` 등 **다른 taxonomy** | 감사 §1.3 제안 카테고리와 1:1 대응 아님 |
| 카테고리를 discovery path로 확장 | 🟡 | 카테고리 + discovery 조합 조회 가능 | "정적 필터 → discovery path" UX는 미흡 |
| Recently resolved markets | ❌ | — | §8.1 항목 없음 |
| Watchlist | ✅ | DB `market_watchlist`; `POST /api/watchlist/{id}/toggle`, `GET /api/watchlist`; `discovery=watchlist` + `viewer_is_watchlisted` on list/detail; `MarketWatchlistButton` + `WatchlistContext`; 카드(타이틀 행 ☆)·상세(`MarketActions`)·Featured; `/watchlist` + 햄버거 메뉴(수평 discovery 탭에는 미노출) | Ending Soon 알림·이메일 등 **push/reminder** 없음 |
| Share this market CTA | ✅ | `lib/share/shareMarket.ts` (Web Share → clipboard); `MarketShareButton` on 카드·상세·Featured | 공유 **이벤트 집계·UTM** 없음 |
| Admin-picked market of the day | ❌ | — | Featured는 알고리즘 기반, 관리자 지정 없음 |
| Community poll / prediction prompt | ❌ | — | — |
| 저작권 없는 이미지 정책 | 🟡 | `MarketImagePickerField`, default icon | 사용 이미지 provenance·정책 enforcement 없음 |

**관련 파일:** `frontend/src/components/market/MarketCard.tsx`, `MarketCardActions.tsx`, `MarketActions.tsx`, `MarketWatchlistButton.tsx`, `MarketShareButton.tsx`, `MarketsFeed.tsx`, `FeaturedMarketCard.tsx`, `MarketSummary.tsx`, `frontend/src/context/WatchlistContext.tsx`, `frontend/src/lib/share/shareMarket.ts`, `frontend/src/lib/watchlist.ts`, `frontend/src/components/app/AppHeader.tsx`, `backend/app/models/tables/market_watchlist.py`, `backend/app/repositories/watchlist.py`, `backend/app/routes/api/watchlist.py`, `backend/app/repositories/markets.py`, `frontend/src/lib/market-categories.ts`

---

### 2.2 마켓 규칙 · 컨텍스트 (감사 §2)

| 감사 항목 | 상태 | 현재 구현 | 갭 |
|-----------|------|-----------|-----|
| Resolution Rules 카드 (Question, Yes/No, Source, Close/Resolution Time, Edge Cases) | ✅ | `MarketRules.tsx` 구조화 UI | — |
| 거래 영역과 규칙 시각적 분리 | ✅ | 마켓 상세: 차트·규칙·Discussion vs 우측 `PredictionPanel` | 모바일은 하단 sheet — acceptable |
| 관리자 폼 필드 (yes/no criteria, edge cases, resolution source) | ✅ | `MarketCreator`, `MarketEditor` Zod 검증 | **기존 마켓** legacy `rules`만 있는 경우 fallback |
| "Why this matters" / 중립 Market context | ✅ | `RulesWhyItMatters` + Show/Hide; DB `market_context` → `RulesMarketContext` (값 있을 때만) | — |
| Admin Note / Market Clarification (댓글과 분리) | ✅ | DB `admin_clarification`(+ `_at`, `_by_*`); `PUT /admin/markets/{id}/clarification`; admin `MarketAdminClarification` (`MarketEditor`, `admin/markets/detail/[id]`); 사용자 `RulesAdminClarification` (Resolution Rules 아래, Discussion 위) | **댓글 탭 pinned clarification** 은 미구현 (Rules 영역 공식 노트만) |
| Official resolution note from admin | ❌ | `ResolutionsManager`는 해결 이력 목록만 | 사용자-facing 공식 해결 노트 없음 |
| 모든 오픈 마켓 규칙 완비 강제 | 🟡 | 신규/편집 시 필수 | 레거시 마켓·시드 외 실데이터 completeness 미검증 |

**관련 파일:** `frontend/src/components/market/MarketRules.tsx`, `frontend/src/components/admin/MarketAdminClarification.tsx`, `backend/app/models/tables/market.py`, `backend/app/routes/api/admin.py`, `backend/alembic/versions/d7f3a91c4e2b_add_market_admin_clarification.py`, `frontend/src/app/markets/[id]/page.tsx`

---

### 2.3 거래 패널 · 계산 · 용어 (감사 §3, Priority 1)

| 감사 항목 | 상태 | 현재 구현 | 갭 |
|-----------|------|-----------|-----|
| Amount / Fee / Total Cost / Estimated Return / Net Result / Loss if Incorrect | ✅ | `tradeTerms.ts`, `PredictionPanel`, `QuickBuyModal` | — |
| 확인 전 계산 breakdown | ✅ | 패널·모달에 브레이크다운 표시 | 별도 **confirm step** 없이 Trade 버튼 즉시 실행 |
| 결제 단계 UI (Preparing → Awaiting Pi → …) | ✅ | `TradeProgressStage`, stage/failure UI | Stepper UX는 텍스트 한 줄 수준 |
| 성공 확인 상태 (마켓명, side, amount, fee, ref ID, resolution date, profile link) | ✅ | `tradeResult?.success` 블록 | `total cost` 행 누락 |
| 실패·부분 성공 복구 안내 | ✅ | `failureGuideMap` 5종 | — |
| **Pi 결제 금액 = UI Total Cost 일치** | ❌ | UI: `price×shares+fee`; Pi/API: **`amount: shares`** | **P1 신뢰 이슈 — 감사 최우선 항목 미충족** |
| 서버 측 fee·총액 재검증 | 🟡 | `positions.py`에서 fee 계산 | 주문·결제·포지션 cross-check 400 reject 미확인 |
| 용어 통일 (Deposit → Send Pi 등) | ❌ | `TRADE_TERMS`는 정렬됨 | `executeBuyTrade.ts` toast/memo **"Deposit to Pi Predict"**, "Deposit Failed/Successful" 잔존 |
| "potential profit" 제거 | ✅ | Estimated Return 사용 | Profile/Leaderboard **"Profit/Loss"** 잔존 |
| 마켓 카드·프로필·관리자 숫자 일관성 | 🟡 | 공통 `calculateTradeBreakdown` | 프로필은 shares/PnL 중심, fee·total cost 열 없음 |

**관련 파일:** `frontend/src/lib/trade/executeBuyTrade.ts`, `tradeTerms.ts`, `PredictionPanel.tsx`, `backend/app/routes/api/positions.py`

---

### 2.4 댓글 · Discussion (감사 §4)

| 감사 항목 | 상태 | 현재 구현 | 갭 |
|-----------|------|-----------|-----|
| Discussion을 trade panel 밖 별도 섹션 | ✅ | `MarketParticipants` Comments 탭 | 감사 권장 레이아웃 순서: Rules → Discussion → Related — **Related markets 없음** |
| Trade panel 근처 comment count | 🟡 | Comments 탭 헤더에 count | **데스크톱 PredictionPanel 옆** count 미표시 |
| 댓글 작성·답글·좋아요 | ✅ | `CommentsTabContent`, API | — |
| Report comment | ❌ | `MoreHorizontal` 버튼 UI만, handler 없음 | — |
| Hide/delete (admin) | 🟡 | API `DELETE /comments/{id}` (admin) | **프론트 admin 댓글 관리 UI 없음** |
| User mute/ban (댓글 맥락) | 🟡 | `UserManager` 계정 suspend/ban | 댓글 전용 mute·per-market ban 없음 |
| Pinned admin clarification | ❌ | — | Discussion 탭 내 **고정(pin) UI** 없음; Rules 영역 `RulesAdminClarification`은 별도 구현됨 |
| Admin Note (댓글과 분리) | ✅ | `RulesAdminClarification` + admin publish API/UI | 댓글 스레드와 UI·데이터 모두 분리 |

**관련 파일:** `frontend/src/components/market/MarketParticipants.tsx`, `participants/CommentsTabContent.tsx`, `backend/app/routes/api/comments.py`

---

### 2.5 관리자 패널 (감사 §5, Priority 5)

| 감사 항목 | 상태 | 현재 구현 | 갭 |
|-----------|------|-----------|-----|
| 마켓 메트릭 (volume, users, predictions, avg/largest size, resolution status) | 🟡 | `admin/markets/detail/[id]` UI | **yes/no volume, numPredictions, largestPrediction = placeholder** (코드 주석 명시) |
| 사용자 메트릭 (active, open/resolved positions, failed payments, repeat users) | 🟡 | `UserManager` 요약 카드 | **Flagged users** 전용 지표·UI 없음 |
| Payment / wallet 메트릭 | 🟡 | `PaymentManager` overview cards | 대부분 집계됨 |
| Trust / safety 메트릭 | 🟡 | `TrustSafetyManager` (disputes, high comments, duplicates, large trades, edge cases, manual overrides) | "Suspicious activity"는 개별 신호로 분산 |
| **Payout Queue (user, market, outcome, amount owed, wallet, status, admin action)** | 🟡 | `manual_payout_queue` **count·total만** | 감사 §5.3 요구 **행 단위 큐·admin action UI 없음**; App→User payout DB 미추적 |
| **Audit log** (market created/edited/resolved, payout, ban, comment removed, rules changed) | ❌ | `AdminAudit` schema only; `compliance_logs`는 geo 전용 | §5.3 핵심 미구현 |
| Resolution notes | 🟡 | Admin resolution workflow | 사용자-facing official note 없음 |
| Unresolved markets 목록 | 🟡 | Trust safety edge cases | 전용 "unresolved markets" 대시보드 없음 |

**관련 파일:** `frontend/src/components/admin/PaymentManager.tsx`, `TrustSafetyManager.tsx`, `UserManager.tsx`, `backend/app/repositories/admin.py`

---

### 2.6 프로필 대시보드 (감사 §6)

| 감사 항목 | 상태 | 현재 구현 | 갭 |
|-----------|------|-----------|-----|
| Open predictions (amount, fee, total cost, estimated return, close date, status) | 🟡 | `ProfilePositionsTab` active filter | **Fee, Total cost, Estimated return, Close date** 열 없음 — shares·PnL 중심 |
| Resolved predictions (result, amount returned, net result, tx ref, resolution source) | 🟡 | closed filter + PnL | **Result, Amount returned, Resolution source** 없음 |
| Payment history (Pi sent/returned, tx IDs, status) | 🟡 | `ProfilePaymentHistoryTab` | user→app 위주; **정산 후 Pi returned** 실데이터 연동 없음 |
| Wallet (username, payout destination, last verified) | ✅ | `ProfileOverview` wallet card | payout destination = leaderboard row 기반 (제한적) |
| Internal balance 회피 | 🟡 | "Positions Value" 표시 | escrow wallet은 없으나 **mark-to-market positions value**는 custody 느낌 잔존 가능 |
| Prediction history 중심 UX | 🟡 | 탭명 "Predictions" | Overview PnL chart·Profit/Loss 용어는 감사 방향과 부분 불일치 |
| Trades 탭 | 🟡 | `ProfileActivityTab` 존재 | UI에서 **hidden** |

**관련 파일:** `frontend/src/app/profile/page.tsx`, `ProfileOverview.tsx`, `ProfilePositionsTab.tsx`, `ProfilePaymentHistoryTab.tsx`

---

### 2.7 Non-Escrow Pi Flow (감사 §7)

| 감사 단계 | 상태 | 갭 |
|-----------|------|-----|
| 1–7 User chooses → confirms → Pi verified → position created | 🟡 | BUY flow 존재 | 결제 amount 정책 불일치 (§2.3) |
| 8 Market resolves | 🟡 | Admin resolution, `is_resolved` | — |
| 9 **Correct 시 wallet 직접 payout** | ❌ | `app_to_user_payouts_sent` tracking_note: **DB에 없음** | non-escrow 모델의 **핵심 미구현** |
| 10 Profile full transaction history | 🟡 | payment + positions | payout leg 미기록 |
| 위험 용어 회피 (deposit, withdraw, balance, profit, trading…) | ❌ | 다수 UI/about/help에 deposit, profit, trade, shares, secondary market 언급 | §7.2 legal copy 정렬 필요 |

**관련 파일:** `frontend/src/lib/trade/executeBuyTrade.ts`, `backend/app/repositories/admin.py` (payments overview), `frontend/src/app/about/page.tsx`

---

### 2.8 전체 제품 feel · 부가 기능 (감사 §8)

| 항목 | 상태 |
|------|------|
| Featured carousel | 🟡 Trending only |
| Recently created (New discovery) | ✅ |
| Recently resolved feed | ❌ |
| Most discussed | ✅ |
| Biggest movement today | 🟡 price_move_24h on cards only |
| New suggestion submitted surfacing | ❌ |
| Watchlist | ✅ |
| Share market | ✅ |
| Secondary market (sell shares) | ❌ UI 없음 (about 페이지만 언급; backend SELL enum 존재) |

---

## 3. 감사 §9 우선순위 대비 체크리스트

### Priority 1 — Trust and calculation accuracy

| 항목 | 상태 |
|------|------|
| Exact cost / fee / estimated return / net result | 🟡 UI 표시 O, **체인·DB amount 불일치** |
| Consistent terms | ❌ Deposit/Profit 등 혼재 |
| Transaction confirmation | ✅ |
| Payment status / error states | ✅ |
| Profile records aligned | ❌ fee·total cost·payout leg 미정렬 |

### Priority 2 — Market rules / resolution clarity

| 항목 | 상태 |
|------|------|
| Yes / No / Source / Resolution date / Edge cases | ✅ UI+스키마 |
| Admin clarification | ✅ | `admin_clarification` on `markets`; admin 게시·수정·삭제; 사용자 indigo callout + 작성자·시각 메타 | 댓글 pinned variant 미구현 |
| market_context per market | ✅ | `MarketRules` → `RulesMarketContext` (teal callout, Show/Hide) | 값 없는 레거시 마켓은 섹션 미표시 |
| All open markets populated | 🟡 신규만 강제 |

### Priority 3 — Post-trade experience

| 항목 | 상태 |
|------|------|
| Payment started → completed → position → view position | ✅ |
| Pending / failed states | ✅ |
| **Payout state after resolution** | ❌ |

### Priority 4 — Dynamic discovery

| 항목 | 상태 |
|------|------|
| Trending / New / Hot / Ending soon | ✅ |
| Featured carousel | 🟡 |
| Movement indicators / comment counts / activity signals | 🟡 |
| Watchlist | ✅ |
| Share market CTA | ✅ |
| Related markets | ❌ |

### Priority 5 — Admin control and audit trail

| 항목 | 상태 |
|------|------|
| Payout queue (detailed) | 🟡 count only |
| Audit log | ❌ |
| Resolution notes (public) | ❌ |
| Failed payment tracking | ✅ |
| User risk flags | 🟡 partial |
| Disputed markets | ✅ |
| Manual override history | ✅ (read-only list) |

---

## 4. 이미 구현된 주요 항목 (갭 분석 보완용)

다음은 감사 대비 **상당히 진척**된 영역으로, 추가 작업 시 regression 방지 대상이다.

- 마켓 카드: 라벨, 24h activity signals, sparkline, Quick Buy
- Discovery API: `trending`, `new`, `hot`, `ending_soon`, `most_discussed`
- Resolution Rules UI 및 admin structured fields
- **Market Context 사용자 노출:** `RulesMarketContext` — per-market `market_context`, Show/Hide callout
- **Admin Clarification:** `admin_clarification*` 필드 + `PUT /admin/markets/{id}/clarification` + `MarketAdminClarification` (admin) + `RulesAdminClarification` (마켓 상세 Rules, 댓글과 분리)
- **Watchlist:** `market_watchlist` + toggle/list API + `viewer_is_watchlisted` enrich + 카드/상세/Featured ☆ + `/watchlist` discovery feed + 햄버거 메뉴 진입
- **Share market CTA:** Web Share / clipboard + 카드·상세·Featured ↗ 버튼
- Trade breakdown + progress/failure/success states
- Comments CRUD + likes + replies
- Admin: payments overview, trust & safety dashboard, user metrics, resolutions list
- Profile: wallet info, payment history tab, positions with open/closed filter

---

## 5. 권장 후속 작업 (우선순위)

1. **P1 — 결제·표시·포지션 단일 금액 소스**  
   `calculateTradeBreakdown` 결과를 orders, Pi `createPayment`, positions POST에 일관 적용. 서버 검증 추가.

2. **P1 — 용어 일괄 정리**  
   `lib/copy/trade.ts` 등 단일 상수로 Deposit/Profit/Trade → Send Pi / Net Result / Place prediction 치환.

3. **P1 — 정산 payout ledger + App→User flow**  
   `is_claimed` → 실제 Pi payout API + admin payout queue 행 UI + profile "Pi returned".

4. ~~**P2 — Admin Clarification 모델**~~ **(완료, 2026-05-24)**  
   `markets.admin_clarification*`, admin API/UI, 사용자 `RulesAdminClarification`. **잔여:** Discussion 탭 pinned clarification, clarification 변경 **audit log** hook.

5. **P5 — `admin_audit_log` 테이블 + admin UI**  
   market/resolution/payment/moderation 이벤트 hook.

6. ~~**P4 — Share CTA + Watchlist**~~ **(완료, 2026-05-24)**  
   Share: `shareMarket` + `MarketShareButton` (카드·상세·Featured). Watchlist: `market_watchlist` + toggle/list API + `/watchlist` + ☆ UI + 햄버거 메뉴. **잔여:** Related/recently resolved feed, watchlist Ending Soon 알림(선택).

7. **P4 — Related markets, recently resolved**  
   마켓 상세 하단 discovery 확장.

8. **P4/P5 — Comment report + admin moderation UI**  
   MoreHorizontal 메뉴 wiring, report queue.

9. **Admin market detail — placeholder metrics 제거**  
   yes/no volume, prediction count, largest bet용 backend endpoint.

---

## 6. 참고

- 이전 실행 계획 초안: [20260502_Audit_Implementation_Plan.ko.md](./20260502_Audit_Implementation_Plan.ko.md) — **2026-05-24 기준 다수 항목이 이미 반영**되어 해당 문서 §1 "현재 상태" 표는 outdated.
- 본 문서는 **감사 원문 대비 현재 코드 snapshot**이며, 배포 환경·DB seed 데이터 completeness는 별도 QA가 필요하다.
- Watchlist DB 마이그레이션: `backend/alembic/versions/c4e8b2f1a903_add_market_watchlist.py` (`alembic upgrade head` 또는 `python bin/alembic-upgrade.py`).

---

## Legend

| Tag | Meaning |
|-----|---------|
| ✅ | Implemented to audit intent |
| 🟡 | Partial / placeholder / terminology mismatch |
| ❌ | Not implemented |
