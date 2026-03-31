# CLAUDE.md

## Project Overview
이 프로젝트는 **주식/매크로/뉴스 감성 기반의 “QuantAI Trading Terminal” 프론트엔드(Next.js App Router)** 입니다.

- 목적: **실시간(WS) + 주기적(API) 시장 데이터**, 뉴스 감성, 경제일정, 종목 상세/리포트를 한 화면에서 제공
- 주요 사용자: **시장/종목 모니터링이 필요한 개인 투자자/트레이더(데스크형 터미널 UI)**
- 현재 상태: **개발 진행 중(MVP~고도화 단계)** *(정확한 상태가 있으면 여기만 갱신)*

## Tech Stack
- Language: **TypeScript (strict)**
- Framework: **Next.js (App Router), React 19**
- Styling: **Tailwind CSS v4**
- UI libs: **shadcn**, **@base-ui/react**, **framer-motion**, **lucide-react**
- Data viz: **recharts**, **react-gauge-component**
- Markdown: **react-markdown**, **remark-gfm**, **rehype-sanitize**
- State Management: **React state/hooks 기반(별도 Zustand 사용 없음)**
- Backend: **별도 API 서버 + WebSocket**
  - `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
  - `NEXT_PUBLIC_WS_URL` (default `ws://localhost:8000/ws/market`)
- Testing: **현재 테스트 러너 설정 없음** → 변경 시 최소 수동 검증 절차를 제시

## Claude – Project Coding Rules (필수 준수)
이 규칙들은 Claude(또는 AI)가 이 프로젝트에서 코드를 생성/수정할 때 반드시 지켜야 하는 기준입니다.  
아래 모든 규칙을 **엄격히 준수**해야 합니다.

### 1. 기존 프로젝트 패턴 존중
Claude는 프로젝트의 기존 관례(폴더 구조, 디자인 패턴, 네이밍 규칙, 리팩토링 표준, CRUD 관례 등)를 무시하면 안 됩니다.  
생성되는 코드는 프로젝트가 이미 정의한 아키텍처/코딩 스타일에 맞아야 합니다.

새 코드를 작성하기 전, Claude는 현재 프로젝트 구조와 구현 패턴을 먼저 분석하여 **새 코드가 기존 패턴에 자연스럽게 녹아들도록** 해야 하며, 임의로 새로운 규칙/구조를 도입하면 안 됩니다.

AI가 생성한 코드는 최종적으로 **개발자가 검토**하여, 프로젝트 규칙을 준수하는지 확인해야 합니다.

### 2. 단일 소스 오브 트루스(Single Source of Truth) 원칙 준수
Claude는 핵심 모델/타입/상수/설정값을 여러 파일에 중복 정의하면 안 됩니다.  
공유 의미를 갖는 값/타입(예: Product 모델)은 전용 “단일 소스” 위치(예: 모델 파일, 설정 모듈, 공용 타입)에 **정확히 한 번만** 정의되어야 합니다.

그 외 모든 모듈은 이를 **import 해서 재사용**해야 하며, 의미 있는 정의를 중복하는 행위는 금지됩니다.

### 3. 상수/상태 값 하드코딩 금지
Claude는 숫자 리터럴, 문자열 상태값, 반복되는 값들을 코드 곳곳에 흩뿌리면 안 됩니다.  
값이 의미를 갖거나 여러 곳에서 반복된다면, 반드시 전역 config/constants 모듈에 정의하고 import 해서 재사용해야 합니다.

하드코딩은 불일치/누락/정책 충돌을 유발하므로 금지됩니다.

### 4. 견고한 에러/예외 처리 구현
Claude는 “정상 동작(해피 패스)”만 가정한 코드를 작성하면 안 됩니다.  
모든 함수/컴포넌트/네트워크 상호작용은 아래 상황을 반드시 고려해야 합니다.

- 잘못된 사용자 입력
- 빠른 연속 실행(중복 클릭/중복 요청)
- 네트워크 요청 실패
- 예기치 않은 서버 응답
- 리소스/권한/가용성 문제

에러 처리는 try/catch, fallback 로직, safeguard, 에러 바운더리, 사용자 피드백(토스트/알럿/disabled 상태 등)을 포함해야 합니다.  
`console.log`에 의존하는 방식은 허용되지 않으며, `any`는 임시 회피 수단으로 남용하면 안 됩니다.

**성공이 아니라 실패를 기본으로 설계**해야 합니다.

### 5. 책임 분리(Separation of Responsibilities) 유지
하나의 함수는 하나의 책임만 수행해야 합니다.  
Claude는 UI, 데이터 패칭, 비즈니스 로직이 한 파일에 섞인 “갓 컴포넌트”를 만들면 안 됩니다.

아래 분리를 엄격히 따릅니다.
- UI 컴포넌트 → 렌더링 & 인터랙션
- Hooks/Services → 데이터 패칭, 비즈니스 규칙, 사이드이펙트
- Utility 모듈 → 재사용 가능한 공용 로직

Claude는 코드를 역할별로 작고 명확한 단위로 분해해, 경계가 분명하도록 구성해야 합니다.

### 6. 공용 코드 중앙화 및 재사용
재사용 가능한 유틸/공용 컴포넌트/헬퍼/어댑터/훅은 파일마다 복사해서 만들면 안 됩니다.  
반드시 프로젝트의 shared(또는 동등한) 위치에 중앙화하고 import로 재사용해야 합니다.

유사 로직/중복 구현은 금지되며, 공용 모듈은 “재사용 가능한 빌딩 블록”으로 유지되어야 합니다.

### 요약(반드시 준수)
Claude가 코드를 생성/수정할 때 반드시:
- 기존 프로젝트 규칙/아키텍처 패턴을 따른다.
- 공용 값/타입은 단일 소스로 유지한다.
- 하드코딩/중복을 피하고 상수화를 한다.
- 방어적인 에러/예외 처리를 구현한다.
- UI / 데이터 / 비즈니스 로직 책임을 분리한다.
- 공용 코드를 중앙화하여 재사용한다.

이 규칙을 위반한 코드는 이 프로젝트에서 **허용되지 않습니다**.

## Coding Rules (프로젝트 적용 규칙)
- 기존 프로젝트의 폴더 구조, 네이밍, 디자인 패턴을 반드시 따른다.
- 새로운 코드를 작성하기 전에 현재 구조와 구현 패턴을 먼저 파악한다.
- 공통 모델, 타입, 상수, 설정값은 한 곳에서만 정의하고 import 해서 사용한다.
  - 타입 단일 소스: `types/dashboard.ts`
  - 상수 단일 소스: `lib/constants.ts`
  - API/변환 단일 소스: `lib/api.ts`
- 의미 있는 값이나 반복되는 값은 하드코딩하지 않고 `lib/constants.ts`로 분리한다.
- 성공 케이스만 가정하지 말고, 입력 오류, 중복 실행, 요청 실패, 예외 응답, 권한 문제를 항상 처리한다.
- `console.log`에 의존한 에러 처리나 `any` 남용을 지양한다. (`unknown` 후 narrowing 우선)
- UI, 데이터 처리, 비즈니스 로직을 한 파일에 섞지 않고 역할별로 분리한다.
  - UI: `components/`
  - 데이터/사이드이펙트: `hooks/` (예: `hooks/useMarketData.ts`)
  - API/변환/포맷/에러: `lib/api.ts`
- 재사용 가능한 유틸, 훅, 헬퍼, 공통 컴포넌트는 중앙화하여 중복 없이 관리한다.
- AI가 생성한 코드도 최종적으로 개발자가 검토하고 프로젝트 규칙 준수 여부를 확인한다.

이 원칙을 지키지 않은 코드는 허용되지 않는다.

## Naming Conventions
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 파일명/폴더: **현재 레포 관례 유지**(예: `useMarketData.ts`, `MacroIndicators.tsx`)
- API 필드명: **백엔드 스펙 그대로 유지**(예: `updated_at`, `cache_ttl_sec` 등) → UI용 타입은 변환해서 사용

## UI / UX Principles
- 기존 터미널 UI 스타일을 우선 유지한다. (`app/page.tsx`의 Terminal 레이아웃/톤)
- 새 UI를 만들기 전에 `components/` 내 기존 컴포넌트 재사용 여부를 확인한다.
- 반응형/스크롤 컨테이너(3-column layout)에서 overflow 깨짐이 없도록 한다.
- 접근성: 버튼/링크/입력 요소에 필요한 aria/label을 누락하지 않는다.
- 사용자 피드백: 로딩/에러/빈 상태를 분명히 표시한다.

## API / Data Rules
- API 스펙 변경이 필요한 경우 먼저 영향 범위를 점검한다. (특히 `types/dashboard.ts`의 API Response Types)
- 에러 핸들링을 반드시 포함한다.
  - `lib/api.ts`의 `ApiError` 패턴 및 사용자 메시지 준수
- null/undefined 케이스를 항상 고려한다.
  - 변환 함수는 “깨지지 않는” 방어적 변환을 우선한다. (예: `apiMacroToDisplay`, `apiEconomicCalendarToDisplay`)
- 데이터 패칭/실시간:
  - 초기 로드: `fetchLatest()`
  - 실시간 업데이트: `WS_URL`로 `MARKET_UPDATE` 처리 (`hooks/useMarketData.ts` 패턴 유지)
  - 경제일정: TTL 기반 자동 리프레시 + 수동 refresh 지원
- 외부 API 호출은 타임아웃/취소/cleanup을 고려한다. (언마운트 시 상태 업데이트 방지 포함)

## Testing Rules
- 핵심 로직 변경 시 **최소 수동 검증 절차**를 반드시 제시한다. (이 레포는 테스트 러너가 기본 구성되어 있지 않음)
- 버그 수정 시 재현 시나리오/재발 방지 체크리스트를 우선 작성한다.

## Git / Change Rules
- 한 번에 너무 많은 파일을 변경하지 않는다.
- 관련 없는 변경은 섞지 않는다.
- 큰 변경 전에는 작업 계획을 먼저 제시한다.
- 위험한 명령어(리셋/포스푸시 등)는 실행 전 의도를 다시 점검한다.

## Before You Code
작업 전에 아래를 확인한다.
1. 요구사항을 짧게 요약
2. 영향을 받는 파일 식별 (`app/`, `components/`, `hooks/`, `lib/`, `types/`)
3. 기존 패턴 확인 (특히 `lib/api.ts`, `lib/constants.ts`, `types/dashboard.ts`, `hooks/useMarketData.ts`)
4. 최소 변경으로 해결 가능한지 검토

## When Making Changes
- 먼저 기존 구현 방식을 조사한다.
- 유사한 컴포넌트/함수/패턴을 재사용한다.
- 새 의존성 추가는 꼭 필요할 때만 한다. (이미 `shadcn`, `@base-ui/react`, `recharts`, `react-markdown` 등이 있음)
- 성능, 보안, 유지보수성을 함께 고려한다.
  - 뉴스 본문/마크다운은 sanitize 흐름 유지(`rehype-sanitize` 사용 맥락 존중)

## Output Style
응답 시 다음 형식을 선호한다.
- 무엇을 변경했는지
- 왜 그렇게 했는지
- 영향 받는 파일
- 확인 방법
- 남은 리스크 또는 후속 작업

## Do Not
- 요청하지 않은 대규모 리팩토링 금지
- 승인 없는 의존성 대거 추가 금지
- 비밀값/환경변수 하드코딩 금지
- 테스트/검증 절차 없이 핵심 로직을 크게 변경 금지

## Project-Specific Notes
- 라우팅/페이지: `app/` (예: 터미널 메인 `app/page.tsx`, 뉴스 `app/news/page.tsx`)
- 데이터 훅: `hooks/useMarketData.ts` (초기 fetch + WS + 경제일정 자동 리프레시/수동 리프레시)
- API/변환/에러: `lib/api.ts` (`ApiError`, `fetchLatest`, `fetchStockDetail`, `fetchNewsDetail`, `fetchEconomicCalendar` 등)
- 상수: `lib/constants.ts` (poll interval, limit, threshold, 탭 구성 등)
- 타입: `types/dashboard.ts` (API Response Types + UI Display Types)
- “하드코딩 값”을 추가해야 한다면 **우선 `lib/constants.ts`에 기존 값이 있는지 확인**하고, 없으면 거기에 추가 후 import 한다.
- Next dev 실행은 기본 `next dev --webpack`이며, 필요 시 `npm run dev:turbo` 사용 (`next.config.ts` 참고)

## Definition of Done
다음 조건을 만족하면 작업 완료로 본다.
- 요구사항 반영 완료
- 타입 오류 없음(TypeScript strict 기준)
- 주요 예외 처리 포함(네트워크/빈 데이터/언마운트/WS 끊김 등)
- 필요한 테스트/검증 방법 제시(최소 수동 검증 포함)
- 변경 내용이 명확히 설명됨

## 커밋 규칙
항상 작업을 끝내고 난 뒤에 본인이 한 작업에 대해서 커밋을 한후 푸쉬를 진행한다.
커밋 메세지는 한눈에 알아볼수있으면서 짧게 작성한다.