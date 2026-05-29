# PredictPix — 구현 현황 및 미구현 Gap 분석
### 감사 기준 문서: `docs/feedbacks/20260502_Audit.md`
**작성일:** 2026-05-26  
**최종 갱신:** 2026-05-29 (섹션 4 Discussion·댓글 관리 구현 반영)  
**분석 범위:** 풀스택 (FastAPI 백엔드 + Next.js 14 프론트엔드)  
**분석 방법:** 감사 문서의 모든 `[ADDED]` 항목을 기준으로 컴포넌트·라우트·모델·스키마를 파일 단위로 직접 점검

---

## 범례

| 기호 | 의미 |
|------|------|
| ✅ | 완전히 구현되어 코드에서 검증 가능 |
| ⚠️ | 부분 구현 — 존재하나 미완성이거나 엣지 케이스 누락 |
| ❌ | 미구현 |

---

## 섹션 1 — 마켓 목록

| 감사 요구사항 | 상태 | 근거 |
|--------------|------|------|
| 마켓 카드에 "Trending," "New," "Hot," "Ending Soon" 라벨 표시 | ✅ | `MarketCard.tsx`: `labels[]` 배열에 `labelColorClass()`로 라벨별 색상 배지 렌더링 |
| 활동 신호: "오늘 24건 거래," "댓글 12개," "거래량 38% 상승" | ✅ | `MarketCard.tsx` L222–230: `trades_24h`, `comments_24h`, `price_move_24h` 신호 행에 모두 렌더링 |
| 마켓 카드에 미니 스파크라인 추가 | ✅ | `MarketCard.tsx` L73–102: `MiniSparkline` SVG 폴리라인 컴포넌트가 `market.sparkline[]` 렌더링 |
| 마켓 목록 상단에 Featured Market / 회전 카드 | ✅ | `FeaturedMarketCard.tsx`: 가격 히스토리 차트 + 라이브 댓글 캐러셀 포함한 풀 카드 |
| "Ending Soon" 필터 | ✅ | `market-categories.ts` L20: `{ key: "ending_soon", slug: "ending-soon" }` 탐색 가능 라우트 |
| "Most Discussed" 필터 | ✅ | `market-categories.ts` L21: `{ key: "most_discussed", slug: "most-discussed" }` 라우트 정의됨 |
| Trending을 누적 볼륨이 아닌 최근 활동 기준으로 산정 | ⚠️ | `Market` 모델에 라벨 필드가 있고 `market_stats_updator.py`에서 계산하지만, 감사 정의(§1.4)와 맞는 알고리즘(최근 24h vs 전체 기간)이 실제로 적용되는지 미검증 |
| 북마크(Watchlist) 기능 | ✅ | `WatchlistContext.tsx`, `MarketWatchlistButton.tsx`, 백엔드 `watchlist.py` 라우트 + 모델 |
| "이 마켓 공유" CTA | ✅ | `MarketShareButton.tsx`, `lib/share/shareMarket.ts` |
| 탐색 카테고리: Trending / New / Hot / Ending Soon / Sports / Crypto / Politics / Entertainment / Community | ⚠️ | 탐색 메뉴는 존재; `market-categories.ts`의 `MARKET_CATEGORIES`에 Sports·Crypto는 있으나 "Entertainment"·"Community" 카테고리 없음 |

---

## 섹션 2 — 마켓 규칙 / 결과 판정 명확성

| 감사 요구사항 | 상태 | 근거 |
|--------------|------|------|
| "Resolution Rules" 카드: 질문 / Yes 기준 / No 기준 / 출처 / 마감 시간 / 결과 시간 / 예외 상황 | ✅ | `MarketRules.tsx` L390–: 아이콘 포함 7개 필드 완전 렌더링; 백엔드 `Market` 모델 컬럼: `yes_criteria`, `no_criteria`, `resolution_source`, `edge_cases` |
| 규칙 카드를 거래 패널과 시각적으로 분리 | ✅ | `markets/[id]/page.tsx`: `<MarketRules>`는 왼쪽 컬럼의 `<MarketParticipants>` 위에, `<PredictionPanel>`은 별도 고정 우측 컬럼에 배치 |
| "Admin Note" / "Market Clarification" 기능 | ✅ | `MarketAdminClarification.tsx`, 어드민 라우트 `POST /admin/markets/{id}/clarification` |
| 관리자 공지를 유저용 Discussion 최상단에 고정 표시 | ✅ | `DiscussionPinnedNotes.tsx` → `MarketCommentsList.tsx` 상단: `admin_clarification` amber 고정 카드 ("Official Clarification") |
| "마켓 컨텍스트" / "이것이 중요한 이유" 중립 문단 | ✅ | `MarketRules.tsx`: `RulesMarketContext` — `market.market_context` 필드를 "Market Context" 레이블 카드로 렌더링 |

---

## 섹션 3 — 거래 패널

| 감사 요구사항 | 상태 | 근거 |
|--------------|------|------|
| 용어: Amount / Fee / Total Cost / Estimated Return / Net Result / Loss if Incorrect | ✅ | `lib/copy/trade.ts` + `lib/trade/tradeTerms.ts`: 6개 용어 상수로 정의; `PredictionPanel.tsx`에서 일관 사용 |
| "potential profit"을 안전한 대안 표현으로 교체 | ✅ | `TRADE_COPY`는 "Estimated Return"과 "Net Result"만 사용; 거래 UI에 "profit" 없음 |
| 금지 표현 사용 금지: deposit / withdraw / balance / profit / investment / trading / bankroll / yield | ⚠️ | `ProfileOverview.tsx` L586–598: 비활성화된 "Receive Pi" 버튼(`ArrowUpFromLine` 아이콘)이 출금 CTA처럼 보임; "Positions Value" 레이블이 잔액(balance) 표현과 유사 |
| 확정 전 비용 분해 내역 표시 (Amount + Fee + Total Cost + Estimated Return + Net Result + Loss) | ✅ | `PredictionPanel.tsx` L241–292: `BreakdownRow`가 감사 레이블 6줄 전부 렌더링 |
| 마켓 카드·거래 패널·프로필·어드민 간 계산 일관성 | ✅ | 단일 소스: `tradeTerms.ts`의 `calculateTradeBreakdown()` → `executeBuyTrade.ts` 사용; `buildTradePaymentPayload()`가 주문·결제·포지션 3개 API 호출에 모두 사용됨 |
| 거래 후 확인 화면: 마켓명, 선택 측, 금액, 수수료, 참조 ID, 지갑 상태, 결과 예정일, 프로필 링크 | ✅ | `PredictionPanel.tsx` L306–323: 모든 필드 포함한 확인 카드; `/profile` 링크 |
| 로딩 상태 5단계: Preparing payment → Awaiting Pi confirmation → Payment detected → Position recorded → Prediction confirmed | ✅ | `executeBuyTrade.ts` L27–32: `TradeProgressStage` 유니온; `PredictionPanel.tsx` L294–298: 단계 레이블 실시간 렌더링 |
| 실패 상태 5가지 + 복구 안내: 결제 취소 / 보류 / 결제 감지됐으나 포지션 미기록 / 포지션 기록됐으나 확인 지연 / 네트워크 오류 | ✅ | `executeBuyTrade.ts`의 `TradeFailureReason` 유니온; `PredictionPanel.tsx` L115–123의 `failureGuideMap`에 실패 유형별 사용자 안내 |

---

## 섹션 4 — 댓글 섹션

| 감사 요구사항 | 상태 | 근거 |
|--------------|------|------|
| 거래 패널 외부(아래)에 Discussion 섹션 배치 | ✅ | `markets/[id]/page.tsx`: `MarketComment.tsx` — Rules 아래·Participants 위 독립 Discussion 섹션 |
| 거래 패널 근처에 댓글 수 표시 | ✅ | `MarketCard.tsx`: `comments_24h` 신호; `FeaturedMarketCard.tsx`: 라이브 댓글 캐러셀; `MarketComment.tsx` 헤더에 총 댓글 수 |
| 권장 페이지 레이아웃: 질문 → 차트 → 거래 패널 → 규칙 → Discussion → 관련 마켓 | ⚠️ | 현재: Summary → Chart → Rules → `MarketComment`(Discussion) → Participants — "관련 마켓" 섹션만 누락 (G-5 참조) |
| 댓글 신고 / 관리자 숨김 | ✅ | `POST /api/comments/{id}/report` (compliance_logs 기록); `DELETE /api/comments/{id}` 소프트 삭제; `CommentActionMenu.tsx` "Hide comment" |
| 관리자 패널에서 사용자 뮤트 / 차단 | ✅ | `UserManager.tsx`, `POST /api/users/status` (admin·superadmin); `user_id` int 파싱 |
| 댓글 컨텍스트에서 인라인 사용자 뮤트 / 차단 (관리자 패널이 아닌 댓글에서 직접) | ✅ | `CommentActionMenu.tsx`: 관리자용 Mute user (`SUSPENDED`)·Ban user (`BANNED`); 댓글·답글 모두 `⋯` 메뉴 |
| 사용자 댓글 위에 관리자 공지 고정 표시 | ✅ | `DiscussionPinnedNotes.tsx`: Discussion 목록 최상단 Pin+Shield amber 카드, `admin_clarification`·작성자·게시 시각 |
| 관리자의 "공식 결과 확인 노트"를 Discussion에서 표시 | ✅ | `DiscussionPinnedNotes.tsx`: `is_resolved` 시 emerald "Official Resolution Note" — outcome·`resolved_at`·`resolved_by_username`·`resolution_source` |

---

## 섹션 5 — 어드민 패널

| 감사 요구사항 | 상태 | 근거 |
|--------------|------|------|
| 마켓 지표: 총 거래량 / Yes·No 거래량 / 고유 사용자 수 / 예측 수 / 평균 예측 규모 / 최대 예측 / 마감일 / 결과 상태 | ✅ | `admin_repo.get_admin_metrics()`에서 반환; `TrustSafetyManager.tsx`·`PaymentManager.tsx` 렌더링 |
| 미해결 마켓 / 분쟁 마켓 | ✅ | `TrustSafetyManager.tsx`: `unresolved_edge_cases` 섹션 |
| 사용자 지표: 전체 / 활성 / 오픈 포지션 보유 / 정산 완료 / 재방문 / 활동량 상위 / 결제 실패 / 플래그 사용자 | ✅ | 백엔드 `GET /admin/trust-safety` 반환; `TrustSafetyManager.tsx` 렌더링 |
| 결제 지표: 수신 / 지급 완료 / 보류 / 실패 / 수동 큐 / 지갑 연결 여부 / 불일치 경고 | ✅ | `PaymentManager.tsx`: `manual_payout_queue` 건수 + 총 Pi + 범위 노트 |
| Payout Queue 행별 테이블: 사용자 / 마켓 / 결과 / 지급 예정액 / 지갑 / 상태 / txid / 관리자 액션 | ❌ | `PaymentManager.tsx`는 집계 수치(건수 + 총 Pi)만 표시. 행별 지급 테이블 및 액션 버튼 없음 |
| 감사 로그: 마켓 생성·수정·결과 처리 / 지급 생성·완료 / 사용자 차단 / 댓글 삭제 / 규칙 변경 등 모든 관리자 행위 기록 | ⚠️ | `core/compliance_logger.py`·`repositories/compliance.py`에서 백엔드 기록은 존재하나, **어드민 UI 페이지가 없음** |
| 어드민 패널 내 감사 로그 열람 UI | ❌ | `admin/audit-log/page.tsx` 또는 동등한 컴포넌트 없음. 백엔드 compliance 로그 데이터가 어드민 프론트엔드에 노출되지 않음 |
| 수동 오버라이드 이력 | ❌ | 미구현 |

---

## 섹션 6 — 프로필 대시보드

| 감사 요구사항 | 상태 | 근거 |
|--------------|------|------|
| 예측 이력 모델 (내부 잔액 아님) | ✅ | 프로필에 Predictions 탭 + Payment History 탭; 내부 원장 잔액 없음 |
| 진행 중 예측: 마켓 / 선택 측 / 금액 / 수수료 / 총 비용 / 예상 환급 / 마감일 / 상태 | ⚠️ | `ProfilePositionsTab.tsx`: 마켓·결과·평균가·주식 수·PnL 표시; 수수료·총 비용·예상 환급·마감일은 미표시 |
| 정산 완료 예측: 마켓 / 선택 측 / 결과 / 베팅 금액 / 환급 금액 / 순 결과 / 트랜잭션 참조 / 결과 출처 | ❌ | 종료 포지션 탭: 마켓·결과·현재가·PnL 표시; 승패 배지·환급된 Pi 금액·txid·결과 출처는 미표시 |
| 결제 이력: Pi 전송 / Pi 환급 / 트랜잭션 ID / 보류·완료·실패 상태 | ⚠️ | `ProfilePaymentHistoryTab.tsx` 존재; 백엔드는 결제 레코드·상태 제공, 실제 표시 필드 전체 검증 미완 |
| 지갑 섹션: Pi 사용자명 / 지갑 참조 / 지급 대상지 / 마지막 인증일 | ✅ | `ProfileOverview.tsx` L530–583: pi_username, pi_uid, payout_destination, last_pi_verified_at 완전 표시 |
| "내부 잔액" 미표시 | ⚠️ | "Positions Value" 통계가 잔액처럼 읽힐 수 있음; 비활성화된 "Receive Pi" 버튼이 출금 기능 암시 |
| PnL / 순 결과 차트 + 기간 선택 | ✅ | `ProfilePnlChart`: 1D / 1W / 1M / ALL 기간 선택기 포함 |
| Activity 탭 | ⚠️ | `ProfileActivityTab.tsx` 존재하나 프로덕션에서 탭 숨김 처리 (`className="hidden"`) |

---

## 섹션 7 — 비에스크로 Pi 결제 흐름

| 감사 요구사항 | 상태 | 근거 |
|--------------|------|------|
| 예측당 결제 → 검증 → 포지션 기록 → 당첨 시 직접 지급 | ✅ | `executeBuyTrade.ts`: Pi SDK 결제 → `/pi/payments/approve` → `/pi/payments/complete` → `/positions` |
| 금지 표현 사용 금지: deposit / withdraw / balance / investment / portfolio / cash out | ⚠️ | ProfileOverview에 비활성화된 "Receive Pi" 버튼(출금 스타일 아이콘); "Positions Value"가 balance 표현에 가까움 |
| 안전한 표현 사용: prediction amount / send Pi / return / payout status / activity history | ✅ | `TRADE_COPY`·`TRADE_TERMS` 상수가 거래 UI 전반에서 모든 안전 표현 사용 |

---

## 전체 Gap 요약

### ❌ 미구현 항목 — 5개

| # | Gap | 감사 섹션 | 우선순위 |
|---|-----|-----------|---------|
| G-1 | 어드민 감사 로그 UI (모든 관리자 행위 열람) | §5.3 | P5 |
| G-2 | Payout Queue 행별 상세 테이블 | §5.3 | P5 |
| G-3 | 정산 완료 포지션: 결과·환급액·txid·결과 출처 미표시 | §6.2 | P1 |
| G-5 | 마켓 상세 페이지의 "관련 마켓" 섹션 | §4.1 | P4 |
| G-7 | 어드민 수동 오버라이드 이력 | §5.3 | P5 |

### ⚠️ 부분 구현 항목 — 5개 (후속 작업 필요)

| # | Gap | 감사 섹션 | 비고 |
|---|-----|-----------|------|
| P-1 | Trending 알고리즘이 감사 정의(최근 24h 기준)와 일치하는지 미검증 | §1.2 | 백엔드 updator 검증 필요 |
| P-2 | "Entertainment"·"Community" 카테고리 누락 | §1.3 | `market-categories.ts`의 `MARKET_CATEGORIES` |
| P-3 | 진행 중 포지션 행: 수수료·총 비용·예상 환급·마감일 미표시 | §6.2 | `ProfilePositionsTab.tsx` |
| P-5 | ProfileActivityTab이 프로덕션에서 숨김 처리됨 | §6 | `className="hidden"` |
| P-6 | "Receive Pi" 버튼·"Positions Value" 표현이 내부 잔액 암시 | §7.2 | ProfileOverview |

---

## 구현 계획 — 감사 우선순위 순서

---

### Phase 1 — Priority 1 (신뢰도 / 계산 정확성)
**대상: G-3, P-3**

#### TASK 1.1 — 정산 완료 포지션: 결과·환급액·txid·결과 출처 추가
**수정 파일:**
- `frontend/src/components/profile/ProfilePositionsTab.tsx`
- `backend/app/repositories/users.py` (종료 포지션 쿼리)
- `backend/app/routes/api/users.py` (txid, amount_returned, resolution_source 노출)

**구현 상세:**
1. **백엔드:** 종료 포지션 쿼리에서 `payments` 테이블을 `user_id + market_id`로 JOIN하여 `txid` 가져오기; `markets` 테이블을 JOIN하여 `resolution_source` 가져오기. `amount_returned` 컬럼(결과 확정 후 지급된 Pi) 추가.
2. **프론트엔드:** `ProfilePositionsTab.tsx`에서 `status === 'closed'` 행에 다음 컬럼 추가:
   - **결과 배지**: 초록 "Won" / 빨간 "Lost" / 회색 "Void"
   - **환급 금액**: 돌려받은 Pi
   - **순 결과**: amount_returned − total_cost (현재 `pnl`로 부분 계산됨)
   - **트랜잭션 참조**: 복사 버튼이 있는 단축 txid
   - **결과 출처**: URL이면 링크, 텍스트면 일반 표시

#### TASK 1.2 — 진행 중 포지션 행: 수수료·총 비용·예상 환급·마감일 추가
**수정 파일:**
- `frontend/src/components/profile/ProfilePositionsTab.tsx`

**구현 상세:**
`PositionRow` 타입과 테이블을 확장하여 다음 항목 추가:
- `fee`: 포지션 생성 시 저장됨 (`market_positions` 테이블의 `fee` 컬럼)
- `total_cost`: 이미 저장됨
- `estimated_return`: 주식 수 (결과 확정 가격 1.0 기준 Pi)
- `close_date`: 포지션 쿼리에서 JOIN된 `market.end_date`

---

### Phase 2 — Priority 2 (마켓 규칙 / 결과 판정 명확성)
**대상: ~~P-4, P-7~~ → 완료 (2026-05-29)**

#### TASK 2.1 — 유저용 Discussion 상단에 관리자 공지 고정 표시 ✅ 완료
**구현 파일:**
- `frontend/src/components/market/participants/DiscussionPinnedNotes.tsx`
- `frontend/src/components/market/participants/MarketCommentsList.tsx`

**구현 내용:**
- `market.admin_clarification` 존재 시 Discussion 목록 최상단에 Pin+Shield amber 톤 "Official Clarification" 고정 카드
- 작성자·게시 시각 메타 표시
- `is_resolved` 시 "Official Resolution Note" 카드 (outcome·확정 시각·확정자·`resolution_source`)

#### TASK 2.2 — "Market Context" 중립 문단 섹션 추가 ✅ 완료
**구현 파일:**
- `frontend/src/components/market/MarketRules.tsx` (`RulesMarketContext`)

**구현 내용:**
- `market.market_context` 필드를 "Market Context" 레이블 카드로 렌더링 (Resolution Rules 카드 아래)

---

### Phase 3 — Priority 3 (거래 후 경험)
**대상: P-6, P-5**

#### TASK 3.1 — ProfileOverview의 내부 잔액 스타일 UI 제거 또는 교체
**수정 파일:**
- `frontend/src/components/profile/ProfileOverview.tsx`

**구현 상세:**
1. 비활성화된 "Receive Pi" 버튼 완전 제거 (출금/인출 암시).
2. "Send Pi" 버튼은 유지하되 "Place Prediction"으로 이름 변경하거나, 마켓 레벨 CTA와 중복이면 제거.
3. "Positions Value"를 "Active Positions" 또는 "Prediction Value"로 변경하여 잔액(balance) 뉘앙스 제거.

#### TASK 3.2 — ProfileActivityTab 숨김 해제
**수정 파일:**
- `frontend/src/app/profile/page.tsx`

**구현 상세:**
Activity 탭 트리거와 `TabsContent`에서 `className="hidden"` 제거. 활성화 전 `ProfileActivityTab.tsx`가 정상 동작하는지 먼저 검증. 활동 피드는 사용자에게 자신의 행위가 정상 기록됐다는 신뢰감을 준다.

---

### Phase 4 — Priority 4 (동적 탐색)
**대상: P-1, P-2, G-5**

#### TASK 4.1 — Trending 알고리즘 검증 및 수정 (최근 활동 기준 vs 전체 기간)
**점검·수정 파일:**
- `backend/app/updator/market_stats_updator.py`
- `backend/app/repositories/markets.py`

**구현 상세:**
1. `market_stats_updator.py`를 열어 라벨 부여 로직 점검.
2. "Trending"은 반드시 `trades_24h` 또는 `volume_24h` 델타를 기준으로 해야 함 (누적 `volume` 사용 금지).
3. "Hot"은 다음 조합이어야 함: 높은 `volume_24h` + 높은 `trades_24h` + 최근 `price_move_24h` + 높은 `comments_24h`.
4. "New"는 `created_at`이 48–72시간 이내.
5. "Ending Soon"은 `end_date`가 지금으로부터 24–72시간 이내.
6. `market_stats` 테이블 갱신 주기가 실시간 활동을 반영할 만큼 짧은지 확인 (≤ 15분 권장).

각 라벨 정의 기준표:

| 라벨 | 감사 정의 |
|------|-----------|
| **New** | 최근 48–72시간 내 생성 |
| **Trending** | 이전 기준선 대비 최근 24시간 거래·댓글 활동 높음 |
| **Hot** | 높은 거래량 + 높은 거래 수 + 댓글 활동 + 최근 가격 변동 복합 지표 |
| **Ending Soon** | 마켓이 앞으로 24–72시간 내 마감 |

#### TASK 4.2 — "Entertainment"·"Community" 카테고리 추가
**수정 파일:**
- `frontend/src/lib/market-categories.ts`
- `backend/app/db/seeds.py` (카테고리 시드가 있을 경우)

**구현 상세:**
`MARKET_CATEGORIES`에 `"Entertainment"`·`"Community"` 추가. 백엔드 `/api/markets/categories` 엔드포인트에서 반환되는지 확인하고, `[category]/page.tsx` 라우트에서 정상 처리되는지 확인.

#### TASK 4.3 — 마켓 상세 페이지에 "관련 마켓" 섹션 추가
**생성·수정 파일:**
- `frontend/src/components/market/RelatedMarkets.tsx` (신규 생성)
- `backend/app/routes/api/markets.py` (`GET /markets/{id}/related` 추가)
- `frontend/src/app/markets/[id]/page.tsx`

**구현 상세:**
1. **백엔드:** `GET /markets/{id}/related`에서 동일 카테고리 마켓 3–5개 반환 (현재 마켓 제외), `volume_24h` DESC 정렬.
2. **프론트엔드:** `RelatedMarkets.tsx`에서 컴팩트한 `MarketCard` 형태의 타일을 가로 스크롤 행으로 렌더링.
3. 마켓 상세 페이지의 `<MarketParticipants>` 아래에 `<RelatedMarkets market={market} />` 추가.

---

### Phase 5 — Priority 5 (어드민 제어 / 감사 추적)
**대상: G-1, G-2, ~~G-6~~, G-7**

#### TASK 5.1 — 어드민 감사 로그 UI
**생성·수정 파일:**
- `frontend/src/app/admin/audit-log/page.tsx` (신규 생성)
- `frontend/src/components/admin/AuditLogManager.tsx` (신규 생성)
- `backend/app/routes/api/admin.py` (`GET /admin/audit-log` 추가)
- `backend/app/repositories/admin.py` (감사 로그 쿼리 추가)

**구현 상세:**
1. 백엔드 `compliance_logger.py`는 이미 레코드를 기록함. `GET /admin/audit-log` 엔드포인트 추가: `event_type` / `user_id` / `market_id` / `date_range` 필터 + 페이지네이션.
2. **프론트엔드:** `AuditLogManager.tsx`에서 다음 컬럼의 테이블 렌더링:
   - 타임스탬프
   - 관리자 사용자
   - 액션 유형 (market_created / market_resolved / payout_sent / user_banned / comment_removed / rules_changed)
   - 대상 (마켓명 / 사용자명)
   - 상세 설명
   - IP / 세션 참조
3. 어드민 내비게이션에 "Audit Log" 링크 추가.

**백엔드에서 반드시 기록되어야 할 이벤트:**

| 이벤트 | 트리거 |
|--------|--------|
| `market_created` | `POST /admin/markets` |
| `market_edited` | `PATCH /admin/markets/{id}` |
| `market_closed` | `POST /admin/markets/{id}/close` |
| `market_resolved` | `POST /admin/markets/{id}/resolve` |
| `payout_generated` | Pi payout approve/complete |
| `payout_marked_paid` | 관리자가 지급 완료 처리 |
| `user_banned` | 관리자가 사용자 상태 변경 |
| `comment_removed` | 관리자가 댓글 소프트 삭제 |
| `clarification_posted` | `POST /admin/markets/{id}/clarification` |
| `rules_changed` | 규칙 필드 변경을 포함한 마켓 편집 |

#### TASK 5.2 — Payout Queue 행별 상세 테이블
**수정 파일:**
- `frontend/src/components/admin/PaymentManager.tsx`
- `backend/app/repositories/admin.py` (payout queue 쿼리 확장)
- `backend/app/routes/api/admin.py` (`GET /admin/payout-queue` 추가)

**구현 상세:**
1. **백엔드:** `GET /admin/payout-queue`에서 보류 중 지급 페이지네이션 목록 반환:
   ```
   { user_id, pi_username, market_id, market_question, outcome, amount_owed, wallet_address, payment_status, txid, created_at }
   ```
2. **프론트엔드:** `PaymentManager.tsx`의 요약 통계 아래에 행별 지급 테이블 서브섹션 추가. 각 행에 "Action" 드롭다운: "Mark Paid" / "Flag for Review" / "Export".

#### TASK 5.3 — 댓글 인라인 관리 (댓글에서 직접 뮤트/차단) ✅ 완료
**구현 파일:**
- `frontend/src/components/market/participants/CommentActionMenu.tsx`
- `frontend/src/components/market/participants/MarketCommentsList.tsx`
- `backend/app/routes/api/comments.py` (`POST /comments/{id}/report`)
- `backend/app/repositories/comments.py` (`report_comment`, `list_market_comments` depth=0 루트만)
- `backend/app/routes/api/users.py` (`POST /users/status` — admin 역할·`user_id` int 파싱)

**구현 내용:**
1. 각 댓글·답글에 `⋯` 메뉴 — 일반 사용자: Report; 관리자: Hide comment / Mute user / Ban user
2. `POST /api/comments/{id}/report` → `compliance_logs` (`comment_reported`; 테이블 없을 시 `ensure_compliance_logs` 자동 생성)
3. Hide → `DELETE /api/comments/{id}`; Mute/Ban → `POST /api/users/status`

#### TASK 5.4 — 수동 오버라이드 이력
**생성 파일:**
- `AuditLogManager.tsx`의 `event_type = "manual_override"` 필터 탭으로 포함

**구현 상세:**
감사 로그를 `manual_override` 액션 유형으로 필터링. 관리자가 결과 확정된 마켓의 결과를 변경하거나, 결제를 오버라이드하거나, 결과 확정 후 포지션을 수정할 때마다 필수 `reason` 텍스트 필드와 함께 `manual_override`로 기록.

---

## 전체 Gap 정리표 — Phase 배정 포함

| # | Gap | 우선순위 | Phase | 작업량 | 상태 |
|---|-----|---------|-------|--------|------|
| G-3 | 정산 완료 포지션: 결과·환급 Pi·txid·결과 출처 미표시 | P1 | Phase 1 | 보통 | ❌ |
| P-3 | 진행 중 포지션: 수수료·총 비용·예상 환급·마감일 미표시 | P1 | Phase 1 | 소규모 | ⚠️ |
| ~~P-7~~ | ~~Discussion 관리자 공지 고정 표시~~ | P2 | Phase 2 | 소규모 | ✅ |
| ~~P-4~~ | ~~"Market Context" 중립 문단 섹션~~ | P2 | Phase 2 | 소규모 | ✅ |
| P-6 | "Receive Pi" / "Positions Value" 잔액 표현 정리 | P3 | Phase 3 | 소규모 | ⚠️ |
| P-5 | ProfileActivityTab 숨김 해제 및 검증 | P3 | Phase 3 | 소규모 | ⚠️ |
| P-1 | Trending 알고리즘 감사 (최근 vs 전체 기간) | P4 | Phase 4 | 보통 | ⚠️ |
| P-2 | "Entertainment"·"Community" 카테고리 추가 | P4 | Phase 4 | 소규모 | ⚠️ |
| G-5 | 마켓 상세 페이지 관련 마켓 섹션 | P4 | Phase 4 | 보통 | ❌ |
| G-1 | 어드민 감사 로그 UI | P5 | Phase 5 | 대규모 | ❌ |
| G-2 | Payout Queue 행별 상세 테이블 | P5 | Phase 5 | 보통 | ❌ |
| ~~G-6~~ | ~~댓글 인라인 관리~~ | P5 | Phase 5 | 소규모 | ✅ |
| G-7 | 수동 오버라이드 이력 | P5 | Phase 5 | 소규모 (G-1에 포함) | ❌ |

---

## 이미 완성된 항목 — 추가 작업 불필요

감사 문서의 다음 항목들은 **완전히 올바르게 구현**되어 있어 추가 작업이 필요 없습니다:

- ✅ 마켓 카드 라벨 (New / Trending / Hot / Ending Soon) + 색상 코딩
- ✅ 카드 활동 신호 (trades_24h, comments_24h, price_move_24h)
- ✅ 마켓 카드 미니 스파크라인
- ✅ Featured 마켓 카드 (가격 차트 + 라이브 댓글 캐러셀)
- ✅ 탐색 내비게이션 (Trending / New / Hot / Ending Soon / Most Discussed / Watchlist)
- ✅ Resolution Rules 카드: Yes Criteria / No Criteria / Resolution Source / Edge Cases / 날짜
- ✅ 규칙 카드가 거래 패널과 구조적으로 분리
- ✅ 관리자 공지 게시 도구 (관리자 측) + 유저 Discussion 상단 고정 표시 (`DiscussionPinnedNotes.tsx`)
- ✅ "Market Context" 중립 문단 (`MarketRules.tsx` · `RulesMarketContext`)
- ✅ 거래 용어 표준화: Amount / Fee / Total Cost / Estimated Return / Net Result / Loss if Incorrect
- ✅ "Potential profit" 완전 제거 — 거래 UI에 금지 표현 없음
- ✅ 확인 전 전체 비용 분해 내역 표시
- ✅ 단일 계산 소스 (`calculateTradeBreakdown`) — 주문·결제·포지션에 동일 적용
- ✅ 거래 후 확인 카드 (모든 필수 필드 포함)
- ✅ 5단계 로딩 인디케이터 (preparing → awaiting → detected → recorded → confirmed)
- ✅ 실패 유형별 5개 복구 안내 메시지
- ✅ Pi 결제 라이프사이클: approve / complete / cancel
- ✅ 비에스크로 흐름: 예측당 결제, 직접 지급, 내부 잔액 없음
- ✅ 댓글 시스템: `MarketComment.tsx` + `MarketCommentsList.tsx` (루트 댓글 depth=0만 목록), 댓글 수 신호
- ✅ Discussion 고정 노트: 관리자 공지 + 공식 결과 확인 노트 (`DiscussionPinnedNotes.tsx`)
- ✅ 댓글 인라인 관리: Report / Hide / Mute / Ban (`CommentActionMenu.tsx`, `POST /comments/{id}/report`)
- ✅ Trust & Safety 어드민 대시보드 (모든 필수 지표 포함)
- ✅ 결제 요약 + 수동 Payout Queue 총계
- ✅ 프로필 지갑 섹션 (pi_username, pi_uid, payout_destination, last_verified)
- ✅ PnL 이력 차트 (1D / 1W / 1M / ALL 기간)
- ✅ 예측 이력 모델 (내부 지갑 잔액 모델 아님)

---

*작성: AI가 `20260502_Audit.md` 기준으로 분석. 2026-05-29 섹션 4 Discussion·댓글 관리 구현 반영.*
