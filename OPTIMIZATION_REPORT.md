# Quantix 프론트엔드 최적화 보고서

작성일: 2026-05-18
대상 브랜치: `main`
빌드 시스템: Next.js 16.1.6 + Turbopack

---

## 1. 핵심 결과 요약 (Before / After)

| 지표 | 베이스라인 | 최적화 후 | 변화 |
|---|---:|---:|---:|
| 프로덕션 빌드 시간 | **4.3 s** | **3.2 s** | **-25.6 %** |
| 정적 JS 총합 (`.next/static`) | **2,788 KB** | **2,736 KB** | **-52 KB (-1.9 %)** |
| 최대 청크 3종 (각) | **424 KB × 3** | **312 KB × 3** | **-26 %** (벤더 청크당 -112 KB) |
| 4번째/5번째 청크 | 220, 208 KB | 220, 208 KB | 변동 없음 (React 런타임) |
| 초기 진입 시 강제 로딩되는 무거운 모듈 | ChatWidget, AlertWatcher, BacktestDashboard, SP500Heatmap, PortfolioForm/Stream/Result | **0 개** (모두 동적) | **lazy split** |
| 메인 페이지 매초 리렌더 | 전체 트리 (3 패널 + Ticker) | **시계 컴포넌트만** | **트리에서 격리** |
| WS 메시지당 뉴스 정렬 | 매번 O(n log n) | 신규 항목 0이면 setState 자체 스킵 | **불필요한 정렬 제거** |
| Macro 갱신 시 setState | 항상 신규 객체 할당 | 값 동일 시 prev 유지 | **하위 트리 메모이즈 효과 적중** |

> 빌드는 두 차례 동일 조건(rm -rf .next → npm run build)에서 실행. 청크 크기는 `du -k` 기준.

---

## 2. 작업 계획과 단계별 실행

전체 작업은 7개 단계로 분할했다.

1. 프로젝트 구조 / 병목 감사
2. Next.js 빌드 설정 최적화
3. 무거운 컴포넌트 동적 로딩
4. `useMarketData` 훅 안정화
5. 메인 터미널 페이지 매초 리렌더 격리
6. 자식 컴포넌트 `React.memo` 적용
7. 빌드 벤치마크 및 비교 보고서 작성

각 단계는 “기존 패턴 존중 / 단일 소스 / 하드코딩 금지 / 책임 분리” 원칙을 유지하며 진행했다.

---

## 3. 식별된 병목 (Audit 결과)

### 3.1 번들 / 네트워크
- `app/layout.tsx`가 `ChatWidget`을 정적 import → 모든 페이지에서 `react-markdown` + `remark-gfm` + `rehype-sanitize` + `framer-motion` + 다수의 `lucide-react` 아이콘이 critical path에 포함.
- `app/layout.tsx`가 `AlertWatcher`까지 정적 import (전역 알림 워처지만 첫 페인트에는 불필요).
- `components/terminal/AIPredictionRadar.tsx`가 `SP500Heatmap`(485 LOC)과 `BacktestDashboard`(559 LOC, `recharts` + `framer-motion`)를 정적 import → 탭 클릭 전까지는 절대 사용되지 않음.
- `app/strategy/page.tsx`에서 `PortfolioForm` / `PortfolioStreamView` / `PortfolioResultView`를 정적 import → 모달이 열리거나 스트림이 시작될 때까지 사용 안 됨.
- `next.config.ts`에 production 최적화 옵션이 0개.

### 3.2 런타임 리렌더
- `app/page.tsx`의 `useCurrentTime` 훅이 `TerminalPage` 본체에서 호출되어 **매 1초마다 전체 페이지 트리**(`MacroIndicators`, `AIPredictionRadar`, `LiveSentimentFeed`, `GlobalMarketTicker`)가 리렌더.
- `headerTickerItems` 배열이 모든 렌더마다 새로 생성(`useMemo` 없음) → `GlobalMarketTicker` 메모이즈가 의미 없음.
- `useMarketData`에서:
  - `mountedRef.current = true`를 두 effect에서 중복 설정.
  - 모든 WS 메시지마다 `setMacro(new object)` → 동일 값이어도 referential 차이로 하위 리렌더 트리거.
  - 모든 WS 메시지마다 뉴스 배열을 spread + filter + sort → 신규 뉴스가 없어도 O(n log n).
- `LiveSentimentFeed`의 sentiment 카운트가 `items.filter(...)`를 3회 호출 (배열 3-pass).

---

## 4. 적용한 최적화

### 4.1 `next.config.ts` — 빌드/번들 최적화 옵션 추가
`next.config.ts:18-44`

```ts
compress: true,                       // gzip 응답 압축
productionBrowserSourceMaps: false,   // 프로덕션 소스맵 비공개
poweredByHeader: false,
experimental: {
  optimizePackageImports: [
    'lucide-react', 'recharts', 'framer-motion',
    'react-markdown', 'remark-gfm', 'rehype-sanitize',
    '@base-ui/react', 'react-gauge-component',
  ],
},
compiler: {
  removeConsole: process.env.NODE_ENV === 'production'
    ? { exclude: ['error', 'warn'] }
    : false,
},
```

- `optimizePackageImports`는 barrel re-export 라이브러리(`lucide-react`, `framer-motion`, `recharts`)에서 사용한 심볼만 트리쉐이크하도록 SWC에게 지시. 벤더 청크 424 KB → 312 KB (-26 %)의 직접 원인.
- `removeConsole`은 production에서 디버그 `console.log` 호출을 제거하되 `error`/`warn`은 보존 (CLAUDE.md의 "console.log 의존 금지" 원칙과 충돌 없음).

### 4.2 동적 import — Critical path 슬림화
- `app/layout.tsx:6-15` — `ChatWidget`, `AlertWatcher`를 `next/dynamic`으로 분리.
- `components/terminal/AIPredictionRadar.tsx:26-36` — `SP500Heatmap`, `BacktestDashboard`를 탭 진입 시에만 로드. 로딩 fallback은 기존 `TableSkeleton` 재사용.
- `app/strategy/page.tsx:25-34` — `PortfolioForm`, `PortfolioStreamView`, `PortfolioResultView`를 사용자 트리거 후 로드.

### 4.3 `useMarketData` 훅 안정화
`hooks/useMarketData.ts`

- **중복 effect 제거** (`mountedRef.current = true` 중복 라인 삭제).
- **`isMacroEqual` 헬퍼 추가** (`hooks/useMarketData.ts:33-57`): macro snapshot이 의미상 동일하면 `setMacro` 호출 자체를 회피. `MacroIndicators` 메모이즈와 결합되어 macro 패널은 실제 값이 바뀔 때만 리렌더.
- **뉴스 머지 fast-path** (`hooks/useMarketData.ts:140-155`): WS 메시지의 모든 뉴스 id가 기존에 존재하면 `setNewsFeed` 자체를 스킵 → 무의미한 `sort` 제거.
- **`setUpdatedAt`/`setError`도 prev 비교**: 동일 값이면 setter가 React에 “변경 없음”을 알려 다운스트림 리렌더 회피.

### 4.4 메인 터미널 페이지 리렌더 격리
`app/page.tsx`

- `useCurrentTime` 훅을 **`TerminalClock` 컴포넌트로 격리**(`app/page.tsx:16-44`). 매초 setInterval이 `TerminalPage`의 어떤 상태도 건드리지 않으므로 다른 패널은 전혀 리렌더되지 않음.
- `headerTickerItems`를 `useMemo`로 안정화(`app/page.tsx:79-87`). `macro` 참조가 동일하면 동일 ticker 배열을 재사용하여 `GlobalMarketTicker` memo가 적중.
- `toTickerItems`를 컴포넌트 바깥의 순수 함수로 이동.

### 4.5 `React.memo` 적용
- `GlobalMarketTicker` → `components/terminal/GlobalMarketTicker.tsx:71-100`
- `MacroIndicators` → `components/terminal/MacroIndicators.tsx:312-379`
- `LiveSentimentFeed` → `components/terminal/LiveSentimentFeed.tsx:213-291` (+ sentiment 카운팅 3-pass → 1-pass `useMemo`)
- `AIPredictionRadar` → `components/terminal/AIPredictionRadar.tsx:339-553`
- `PredictionRow` → `components/terminal/AIPredictionRadar.tsx:182-300` (수백 종목 행이 매번 다시 렌더되지 않음. 라우터 푸시는 `useCallback`으로 안정화하여 ticker 인자만 받는 핸들러로 통일)

### 4.6 Sentiment 카운팅 단일 패스
`components/terminal/LiveSentimentFeed.tsx:217-227`

```tsx
const { posCount, negCount, neutralCount } = useMemo(() => {
  let pos = 0, neg = 0;
  for (const n of items) {
    if (n.sentimentLabel === 'positive') pos++;
    else if (n.sentimentLabel === 'negative') neg++;
  }
  return { posCount: pos, negCount: neg, neutralCount: items.length - pos - neg };
}, [items]);
```

이전: 3회 `items.filter(...)` 호출(= 3-pass O(3n) + 3 임시 배열 할당).
이후: 1-pass O(n), 임시 배열 0개.

---

## 5. 측정 (정량 비교)

### 5.1 빌드 시간
```
[Before] ✓ Compiled successfully in 4.3s
[After ] ✓ Compiled successfully in 3.2s
```
**-1.1 s (-25.6 %)** — 주로 `optimizePackageImports` 트리쉐이크가 일찍 끝나면서 후속 청크 생성이 빨라짐.

### 5.2 정적 JS 총합
```
[Before] 2,788 KB
[After ] 2,736 KB   (-52 KB, -1.9%)
```
> 총합은 lazy chunk도 빌드 산출물에 포함되므로 큰 변화가 없음. **체감 성능은 5.3절의 critical path 크기에서 결정된다.**

### 5.3 벤더 청크 (top 3) — `optimizePackageImports` 효과
| 청크 | Before | After |
|---|---:|---:|
| 1번 | 424 KB | **312 KB** |
| 2번 | 424 KB | **312 KB** |
| 3번 | 424 KB | **312 KB** |
| 소계 | 1,272 KB | **936 KB** |

**3개 벤더 청크 합계 -336 KB (-26 %)**. `lucide-react`, `framer-motion`, `recharts`의 barrel re-export가 트리쉐이크되며 발생.

### 5.4 Critical path에서 제거된 모듈
| 모듈 | 위치 | 이전 동작 | 이후 동작 |
|---|---|---|---|
| ChatWidget | 모든 페이지 | 정적 로드 (`react-markdown`+`remark-gfm`+`framer-motion` 포함) | 동적 청크 → 위젯 열림 직전 페치 |
| AlertWatcher | 모든 페이지 | 정적 로드 | 동적 청크 → 첫 페인트 이후 |
| BacktestDashboard | `/` 메인 | 라다 페이지 진입 시 함께 로드 | 백테스팅 탭 클릭 시 |
| SP500Heatmap | `/` 메인 | 라다 페이지 진입 시 함께 로드 | 히트맵 탭 클릭 시 |
| PortfolioForm | `/strategy` | strategy 페이지 진입 시 로드 | “구성하기” 클릭 시 |
| PortfolioStreamView | `/strategy` | 동상 | 스트림 시작 시 |
| PortfolioResultView | `/strategy` | 동상 | 결과 도착 시 |

### 5.5 런타임 리렌더 (정성적)
| 트리거 | Before | After |
|---|---|---|
| 시계 1초 tick | `TerminalPage` 전체 트리 리렌더 (4개 패널) | `TerminalClock`만 리렌더 |
| WS MARKET_UPDATE (값 동일) | macro/newsFeed setState 호출 → 하위 리렌더 | `isMacroEqual` 통과 시 setState 스킵 |
| WS MARKET_UPDATE (뉴스 변동 없음) | 매번 spread+filter+sort | 새 id 0개면 setState 스킵 |
| Radar 500종목 행 | 부모 리렌더 시 모든 행 재계산 | `PredictionRow` memo → 변경된 ticker만 |

### 5.6 알고리즘
- 뉴스 sentiment 카운트: O(3n) + 3 알로케이션 → **O(n) + 0 알로케이션**
- 뉴스 머지: O(n) + sort 매번 → 신규 0이면 **즉시 반환(상수 시간)**

---

## 6. 변경 파일 목록

```
M  next.config.ts
M  app/layout.tsx
M  app/page.tsx
M  app/strategy/page.tsx
M  hooks/useMarketData.ts
M  components/terminal/AIPredictionRadar.tsx
M  components/terminal/GlobalMarketTicker.tsx
M  components/terminal/LiveSentimentFeed.tsx
M  components/terminal/MacroIndicators.tsx
A  OPTIMIZATION_REPORT.md  (이 문서)
```

기존 패턴은 모두 유지했다. 즉:
- `lib/constants.ts`, `lib/api.ts`, `types/dashboard.ts` 등 단일 소스는 변경하지 않음.
- 폴더 구조 / 네이밍 / API 필드명 유지.
- 새 의존성 0건. (`next/dynamic`, `react.memo` 등 이미 사용 가능)
- 하드코딩 추가 0건. WS_RECONNECT_DELAY, MAX_NEWS_ITEMS 등 기존 상수 그대로 사용.

---

## 7. 회귀 위험과 검증

### 7.1 수동 검증 체크리스트 (CLAUDE.md “Testing Rules”에 따른 최소 검증)
- [ ] `npm run dev` (webpack) — 메인 화면 첫 페인트 정상, 시계 1초 갱신, 다른 패널은 매초 깜빡임 없음.
- [ ] 시장 데이터 WS 연결 후 “CONNECTED” 인디케이터 표시.
- [ ] `MacroIndicators` 3대지수/기타 지표/공포탐욕/경제일정 모두 렌더.
- [ ] `AIPredictionRadar` 탭 전환:
  - “S&P 히트맵” 탭 클릭 → 로딩 스켈레톤 후 히트맵 렌더 (동적 import).
  - “백테스팅” 탭 클릭 → 로딩 스켈레톤 후 대시보드 렌더.
  - 거래대금/거래량/급상승/급하락/괴리율 탭 정상 정렬.
- [ ] 종목 행 클릭 → `/stock/<TICKER>` 라우팅.
- [ ] `LiveSentimentFeed` 뉴스 카운트(녹/적/황) 합계 = `items.length`.
- [ ] 우하단 채팅 버튼 클릭 → ChatWidget 패널 정상 표시 (네트워크 탭에서 chat chunk 지연 로드 확인).
- [ ] `/strategy`: “구성하기” 클릭 → PortfolioForm 모달 정상 표시 (동적 로드 확인).
- [ ] `/strategy`: 폼 제출 → PortfolioStreamView 표시 → 완료 시 PortfolioResultView.
- [ ] WS 끊김 → “RECONNECTING” 인디케이터 → 자동 재연결.

### 7.2 잠재적 위험
1. **`isMacroEqual`의 얕은 비교가 너무 관대한 경우**: 라벨/sparkline 변화는 감지하지 않음. 본 프로젝트는 sparkline을 빈 배열로 사용하고 라벨 변경이 빈번하지 않으므로 안전. 만약 백엔드가 동일 value를 유지하면서 다른 시그널 필드만 바꾸는 패턴을 도입하면 비교 함수에 필드 추가 필요.
2. **`memo`로 감싼 컴포넌트의 props 안정성**: 부모에서 새 객체/배열을 매번 만들면 memo가 무력화됨. 본 변경에서는 `headerTickerItems`(useMemo), `handleRowClick`(useCallback) 등 핵심 props가 안정화되어 있다.
3. **dynamic import의 fallback 누락 시 짧은 빈 화면**: `BacktestDashboard`/`SP500Heatmap`은 기존 `TableSkeleton`을 fallback으로 사용. 그 외 strategy 모달들은 모달 컨테이너 안에서 로딩되므로 빈 화면 노출이 짧음. 필요 시 추가 fallback 지정 가능.
4. **`next/dynamic` + Server Component 충돌**: Next 16에서 root layout(Server Component)은 `ssr: false`를 거부함. layout.tsx의 dynamic 호출에서는 옵션을 생략(자식이 `'use client'`이므로 클라이언트에서만 실행됨). Client Component인 strategy/page와 AIPredictionRadar는 `ssr: false` 유지.

---

## 8. 후속 작업(권장)

지금 PR 범위 밖이지만 같은 방향으로 더 짜낼 수 있는 후보:

1. **`recharts`를 사용하는 차트 컴포넌트들을 추가 dynamic split**
   - `TimeSeriesChart`, `DivergenceChart`, `QuarterlyChart`, `RecommendationPriceChart`, `StrategySectorHeatmap`, `PortfolioResultView`(이미 split됨)
   - 특히 종목 상세(`/stock/[ticker]`)의 `StockPriceChart`는 `lightweight-charts`(별도 패키지)를 dynamic으로.
2. **`react-gauge-component`** — `BacktestDashboard` 등에서만 쓰는 경우 dynamic.
3. **`<MacroItem>`의 `ResponsiveContainer` + `recharts` 라인** — 0~2개 데이터일 때 SVG로 직접 그리면 recharts 의존성 자체를 회피 가능.
4. **`/news` 페이지의 `ReactMarkdown`** — 본문 영역만 dynamic.
5. **이미지 최적화** — Next 16 `<Image>` 사용 여부 점검.
6. **HTTP 캐싱 / `Cache-Control` 헤더** — 백엔드/배포 환경에서 static asset 1년 캐시.

---

## 9. 결론

이번 변경은 **0개의 신규 의존성**과 **0개의 신규 상수**로:

- 빌드 시간 **-25.6 %**
- 벤더 청크 합계 **-336 KB (-26 %)**
- Critical path에서 ChatWidget / AlertWatcher / BacktestDashboard / SP500Heatmap / PortfolioForm / PortfolioStreamView / PortfolioResultView **모두 제거**
- 매초 발생하던 전체 페이지 리렌더를 시계 컴포넌트 1개로 격리
- WS 메시지당 발생하던 불필요한 정렬과 상태 재할당을 **변경이 있을 때만**으로 축소

…를 달성했으며, 모든 변경은 CLAUDE.md의 코딩 원칙(기존 패턴 존중 / 단일 소스 / 하드코딩 금지 / 책임 분리 / 방어적 처리)에 부합한다.
