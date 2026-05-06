# PredictPix 프로젝트 수정 방안 (감사 피드백 대응)

**기준 문서:** [20260502_Audit.md](./20260502_Audit.md)  
**작성 목적:** 현재 코드베이스 상태를 전제로, 감사 항목을 **우선순위·담당 레이어(백엔드/프론트/DB)** 단위로 실행 가능한 수정안으로 정리한다.

---

## 1. 현재 구현과 감사 요구의 간단 대조

| 영역 | 현재 상태 (요약) | 감사 대비 주요 갭 |
|------|------------------|-------------------|
| 마켓 리스트 | `MarketsFeed.tsx`가 카테고리 + `order=volume` 고정 (`buildMarketsQuery`) | Trending / New / Hot / Ending Soon, 활동 라벨·신호, Featured 캐러셀 없음 |
| 마켓 카드 | `MarketCard.tsx`: 질문·확률·Yes/No·거래량·종료일 | 카드별 라벨·24h 거래·댓글 수·스파크라인 없음 |
| 규칙·신뢰 | `MarketRules.tsx`: 단일 `rules` 텍스트 + 요약 통계 | Resolution Rules 카드 구조(Yes/No 기준·출처·엣지 케이스) 미분리 |
| 마켓 상세 레이아웃 | `markets/[id]/page.tsx`: 요약 → 차트 → 규칙 → 참가자 / 우측 `PredictionPanel` | 감사 권장 순서(규칙 카드와 거래 영역 분리·Discussion 위치)와 불일치 |
| 거래 UX | `PredictionPanel.tsx`, `QuickBuyModal.tsx`, `executeBuyTrade.ts` | 확인 전 계산 요약·결제 단계 UI·성공 화면 부족; "Deposit"/"potentialProfit" 등 감사 비권장 용어 |
| Pi 결제 금액 | `executeBuyTrade`에서 `createPayment`의 `amount`가 `shares`와 UI의 `piTotalAmount`와 불일치 가능 | **신뢰(P1):** 주문·결제·포지션·표시 금액의 단일 소스·일치 검증 필요 |
| 프로필 | `ProfilePositionsTab.tsx` 등 | “잔액” 중심이 아닌 거래 이력·용어 정렬은 부분적 |
| 댓글 | `backend/.../comments.py` API 존재 | 마켓 상세에 Discussion 섹션·카드 근처 댓글 수 연동 미흡할 수 있음 |
| 관리자 | `AdminMetricsDashboard.tsx` 등 집계 | Payout Queue·감사 로그·신뢰/안전 지표는 별도 설계 필요 |
| 데이터 모델 | `Market` 테이블: `rules`, `resolution_source` 등 | Yes/No 기준·정산일·엣지 케이스·관리자 클리어링 노트용 필드 분리 없음(또는 규칙만 텍스트) |

---

## 2. 원칙 정렬 (감사 §10)

1. **Pi/비용에 대한 모호함 제거** — UI·API·DB에서 동일 공식으로 금액·수수료·예상 반환·순결과를 노출하고, 결제 금액과 포지션 `amount`를 반드시 일치시킨다.  
2. **결과·규칙에 대한 모호함 제거** — 마켓 생성/편집과 상세 화면에 구조화된 Resolution 정보를 둔다.  
3. **정적인 화면 최소화** — 리스트·상세에 실제 데이터 기반 활동 신호만 추가한다(가짜 거래량 금지).

---

## 3. 우선순위별 수정 방안

아래 번호는 [20260502_Audit.md §9](./20260502_Audit.md)의 Priority 1~5와 대응한다.

### Priority 1 — 신뢰·계산 정확성 (최우선)

**목표:** 마켓 카드, 거래 패널, 프로필, 관리자 화면에서 **같은 정의**의 Amount / Fee / Total cost / Estimated return / Net result가 나오고, 체인상 실제 전송 Pi와 기록이 맞는다.

| 작업 | 제안 구현 |
|------|-----------|
| 1-A. 단일 계산 모듈 | 프론트: `lib/trade/` 또는 `lib/pricing.ts`에 `computeTradeBreakdown({ price, sharesOrAmount, feeRate })`를 두고 `PredictionPanel`, `QuickBuyModal`, (필요 시) `MarketCard`가 동일 함수 사용. |
| 1-B. 결제 금액과 UI 일치 | `executeBuyTrade.ts`: Pi `createPayment`의 `amount`를 **사용자가 확인한 총 비용(수수료 포함)**과 정책에 맞게 통일. 현재 `shares`만 전달하는지 vs UI의 `piTotalAmount`인지 코드 리뷰 후 수정. `/orders` 생성 시에도 동일 수치 사용. |
| 1-C. 백엔드 검증 | `orders.py`, `positions` 관련 저장 시 서버에서 fee·총액 재계산 후 클라이언트와 불일치 시 400. |
| 1-D. 용어 통일 | “Deposit”, “potentialProfit”, “Deposit Failed/Successful” → 감사 권장 표현(예: Estimated return, Send Pi, Payment cancelled 등). `i18n` 또는 상수 파일 `lib/copy/trade.ts`로 한곳 관리. |
| 1-E. 확인 전 계산 요약 | `PredictionPanel` / `QuickBuyModal`: 확인 단계(또는 접이식)에 감사 예시와 같은 줄단위 브레이크다운 표시. |
| 1-F. 프로필·관리자 열 맞추기 | 프로필 테이블 열 이름·숫자를 위 용어집과 동일하게; 관리자 마켓 상세의 거래/포지션 숫자도 동일 공식 표시. |

**주요 파일:** `frontend/src/lib/trade/executeBuyTrade.ts`, `frontend/src/components/market/PredictionPanel.tsx`, `frontend/src/components/market/QuickBuyModal.tsx`, `frontend/src/lib/constants.ts`, `backend/app/routes/api/orders.py`, positions 생성 로직.

---

### Priority 2 — 마켓 규칙·정산 명확성

**목표:** 모든 오픈 마켓에 대해 질문·Yes·No·출처·정산 시점·엣지 케이스가 **항상 같은 UI 블록**으로 보인다.

| 작업 | 제안 구현 |
|------|-----------|
| 2-A. 스키마 확장 | `markets` 테이블에 컬럼 추가(또는 JSONB `resolution_rules` 하나로 묶기): `rules_yes`, `rules_no`, `rules_edge_cases`, `resolution_expected_at`(또는 기존 `end_date`와 역할 분리 명시), `market_context`(중립 문단). Alembic 마이그레이션. |
| 2-B. 기존 `rules` | 마이그레이션 기간: 관리자만 구조 필드 채우고, 비어 있으면 `rules` 전체를 “레거시” 접기 섹션으로 표시. |
| 2-C. `MarketRules` 개편 | `MarketRules.tsx`를 “Resolution Rules” 카드 컴포넌트로 분리: 질문(중복이면 `question`만), Yes/No/출처/마감·정산·엣지 케이스. 모바일 탭은 유지하되 섹션 제목을 감사와 맞춤. |
| 2-D. 관리자 폼 | `MarketEditor.tsx` / `MarketCreator.tsx`에 위 필드 입력(필수 검증: 오픈 마켓은 Yes/No/출처 최소 입력). |
| 2-E. API 응답 | `market_to_dict`에 신규 필드 포함; `frontend/src/lib/types.ts`의 `Market` 타입 갱신. |

**주요 파일:** `backend/app/models/tables/market.py`, `frontend/src/components/market/MarketRules.tsx`, `frontend/src/components/admin/MarketEditor.tsx`, `frontend/src/components/admin/MarketCreator.tsx`.

---

### Priority 3 — 거래 후 경험 (결제·포지션 상태)

**목표:** 클릭 후 사용자가 **어느 단계인지** 항상 알 수 있고, 성공 시 한 화면에서 요약을 본다.

| 작업 | 제안 구현 |
|------|-----------|
| 3-A. 파이프라인 UI 상태 | `executeBuyTrade` 진행 중: `idle → approving → awaiting_wallet → confirming → creating_position → done | error` 등 상태를 `PredictionPanel`에 노출(Stepper 또는 텍스트 단계). |
| 3-B. 성공 확인 화면 | 모달 내 성공 스텝 또는 전용 다이얼로그: 마켓명, Yes/No, 금액·수수료·참조 ID(가능하면 `txid`/`paymentId`), 프로필 링크. `router.refresh()`만으로 끝나지 않도록. |
| 3-C. 실패·부분 성공 카피 | 감사 §3.5 나열에 맞춘 사용자용 문구 + “다음에 할 일”(재시도, 지원 문의 등). |
| 3-D. 백엔드 이벤트 | 결제 완료/포지션 생성 불일치 시 복구용 플래그 또는 관리자 알림(후속 P5와 연결). |

**주요 파일:** `frontend/src/lib/trade/executeBuyTrade.ts`, `frontend/src/components/market/PredictionPanel.tsx`, `QuickBuyModal.tsx`, (필요 시) `backend` Pi payments 완료 훅.

---

### Priority 4 — 역동적 탐색·리스트 “살아 있음”

**목표:** 실제 데이터만으로 Trending·New·Hot·Ending Soon·Featured를 지원한다.

| 작업 | 제안 구현 |
|------|-----------|
| 4-A. API | `GET /markets`에 `discovery` 쿼리 파라미터 추가: `trending` \| `new` \| `hot` \| `ending_soon` \| `default`. `markets_repo.list_markets`에서 SQL/집계 분기(예: Trending = 최근 24h 거래 수·댓글 수 대비 이전 기간 대비 증가율 — `market_trades`, `comment_stat` 활용). |
| 4-B. New / Ending Soon | `created_at` 창, `end_date` NOW()~72h 필터는 단순 조건으로 먼저 구현 가능. |
| 4-C. Hot | 거래량·거래 건수·최근 가격 변동(캔들 또는 `market_price_*`) 복합 점수는 2단계로: 1차는 거래량+거래 수, 2차에 가격 변동 가중. |
| 4-D. 프론트 | `MarketsFeed.tsx` 상단에 discovery 탭 또는 칩; `buildMarketsQuery`에 `discovery` 전달. |
| 4-E. Featured | 관리자가 `featured_rank` 또는 `is_featured` 플래그를 설정하고, 리스트 상단 캐러셀(`carousel.tsx`)로 노출. |
| 4-F. 카드 enrich | `GET /markets` 응답에 `comment_count`, `trades_24h`, `labels: string[]` 등을 포함하거나 N+1 방지용 서브쿼리/뷰. `MarketCard`에 Badge + 한 줄 활동 텍스트. |
| 4-G. 스파크라인 | 카드당 짧은 시계열: 기존 `/markets/prices-history`를 마켓 ID 배치로 줄이거나, 리스트 전용 경량 엔드포인트 추가. |
| 4-H. 이미지 | 감사 NOTE: 업로드·기본 이미지는 라이선스 클리어된 자산만 사용 — `MarketImagePickerField` 가이드 문구 추가. |

**주요 파일:** `backend/app/repositories/markets.py`, `backend/app/routes/api/markets.py`, `frontend/src/components/market/MarketsFeed.tsx`, `frontend/src/components/market/MarketCard.tsx`, (선택) `backend/app/models/tables/market.py` featured 필드.

---

### Priority 5 — 관리자 안전 센터·감사

**목표:** 분쟁·출금·수동 개입을 추적 가능하게 한다.

| 작업 | 제안 구현 |
|------|-----------|
| 5-A. 감사 로그 테이블 | `admin_audit_log`(actor, action, entity_type, entity_id, payload JSON, created_at). 해결·규칙 변경·밴·댓글 삭제·출금 완료 처리 등 훅에서 INSERT. |
| 5-B. Payout Queue | 정산 후 지급 대기 건 테이블 + 관리자 화면: 사용자, 마켓, 결과, 금액, 지갑, 상태, tx id, 액션 버튼. |
| 5-C. 대시보드 확장 | `AdminMetricsDashboard`에 감사 §5.2의 빈 구간 채우기: 실패 결제 수, payout pending, 플래그 유저 등 — 데이터가 없으면 “0”과 함께 수집 계획 표시. |
| 5-D. Admin Note | 마켓별 `admin_clarification` 텍스트(타임스탬프·작성자) + 사용자 댓글과 UI 분리. |

**주요 파일:** 신규 migration + repository, `frontend/src/components/admin/AdminMetricsDashboard.tsx`, 신규 `PayoutQueue.tsx` 등.

---

## 4. 레이아웃·댓글 (감사 §4)

| 작업 | 제안 |
|------|------|
| 마켓 상세 순서 | `markets/[id]/page.tsx`를 권장 순으로 재배치: 질문/요약 → 차트·활동 → **Resolution Rules 카드** → Discussion → 관련 마켓; `PredictionPanel`은 우측(데스크톱) 유지하되 시각적으로 규칙 카드와 구분(카드 테두리·배경). |
| Discussion | `comments` API를 사용하는 클라이언트 섹션 컴포넌트 추가; `PredictionPanel` 근처에 댓글 수 배지. |
| 댓글 정책 | 신고·관리자 숨김 등은 API·RBAC와 함께 단계적 구현. |

---

## 5. 비수탁·표현 (감사 §7)

| 작업 | 제안 |
|------|------|
| 제품 카피 | 앱 전역 검색으로 `deposit`, `withdraw`, `balance`, `profit`(투자 의미) 등을 찾아 감사 “Safer wording”으로 치환. |
| 프로필 | “예측 이력·결제 이력” 중심 카피; 내부 잔액 UI는 법무 검토 전 추가하지 않음. |
| 아키텍처 | 이미 “예측당 결제 → 정산 후 지갑 지급” 방향이면, 백엔드 정산·출금 플로우를 Payout Queue와 문서로 정합성 있게 맞춘다. |

---

## 6. 권장 마일스톤 (일정은 팀에 맞게 조정)

1. **M1 (1~2 스프린트):** P1 전부 + P3 최소(단계 표시 + 성공 요약) + 용어/결제 금액 버그 수정.  
2. **M2:** P2 스키마 + `MarketRules` + 관리자 폼.  
3. **M3:** P4 discovery API + `MarketsFeed` + 카드 라벨·Featured.  
4. **M4:** P5 감사 로그 + Payout Queue 초안 + Discussion UI.  
5. **M5:** 스파크라인·Hot 복합 점수·관리자 지표 고도화.

---

## 7. 참고 코드 위치 (빠른 점프)

- 마켓 리스트 쿼리: `frontend/src/components/market/MarketsFeed.tsx` (`buildMarketsQuery`)  
- 마켓 카드: `frontend/src/components/market/MarketCard.tsx`  
- 마켓 상세 페이지: `frontend/src/app/markets/[id]/page.tsx`  
- 규칙 UI: `frontend/src/components/market/MarketRules.tsx`  
- 거래: `frontend/src/components/market/PredictionPanel.tsx`, `QuickBuyModal.tsx`, `frontend/src/lib/trade/executeBuyTrade.ts`  
- 마켓 API: `backend/app/routes/api/markets.py`, `backend/app/repositories/markets.py`  
- 마켓 모델: `backend/app/models/tables/market.py`  
- 댓글 API: `backend/app/routes/api/comments.py`  
- 관리자 지표: `frontend/src/components/admin/AdminMetricsDashboard.tsx`

---

## 8. 범위 밖·전제

- 규제·법무 판단은 본 문서 범위를 넘는다; 용어·잔액 UI는 **법무 검토 전 보수적** 표현을 기본으로 한다.  
- Trending/Hot 알고리즘의 정확한 수식은 제품·데이터팀에서 튜닝하며, 감사 요지는 “최근 활동 반영”이다.  
- 가짜 거래량·가짜 활동은 구현 대상에서 제외한다.

---

**문서 끝.** 기준 감사본이 갱신되면 본 수정 방안의 섹션 번호와 `20260502_Audit.md` §9를 다시 맞출 것.
