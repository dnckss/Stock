/**
 * 뉴스 목록 페이지 전용 도메인 로직 — 시장 영향도 계산, 시간 그룹핑, 시간 포맷.
 * UI(컴포넌트)와 분리해 재사용/테스트가 쉽도록 중앙화한다.
 */
import type { ApiStockNewsItem } from '@/types/dashboard';
import {
  NEWS_IMPACT_RECENCY_HALFLIFE_HOURS,
  NEWS_IMPACT_BAR_SEGMENTS,
} from '@/lib/constants';

export interface ScoredNewsItem extends ApiStockNewsItem {
  /** 0..1 — 시장 영향도(|감성점수| × 신뢰도 × 최신성). */
  impact: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 시장 영향도 = |감성점수| × 신뢰도 × 최신성(반감기 감쇠).
 * - 감성 강도가 크고(호재/악재 명확) 신뢰도가 높으며 최근일수록 1에 가깝다.
 * - 중립(score≈0)·저신뢰·오래된 기사는 0에 수렴 → 이미 반영된 뉴스 디랭크.
 */
export function computeNewsImpact(item: ApiStockNewsItem, nowMs: number): number {
  const strength = clamp01(Math.abs(Number(item.score) || 0));
  const confidence = clamp01(Number(item.confidence) || 0);
  const ageHours = Math.max(0, (nowMs - (Number(item.timestamp) || 0) * 1000) / HOUR_MS);
  const recency = Math.pow(0.5, ageHours / NEWS_IMPACT_RECENCY_HALFLIFE_HOURS);
  return clamp01(strength * confidence * recency);
}

/**
 * 각 항목에 영향도(impact)를 보장한다.
 * - 서버가 내려준 `impact`(0..1)를 우선 사용하고, 없으면 클라이언트에서 계산(폴백).
 * - 정렬은 하지 않는다(피드는 시간순, TOP은 서버 /api/news/top 사용).
 */
export function ensureImpact(items: ApiStockNewsItem[], nowMs: number): ScoredNewsItem[] {
  return items.map((item) => ({
    ...item,
    impact: typeof item.impact === 'number' ? clamp01(item.impact) : computeNewsImpact(item, nowMs),
  }));
}

/** 영향도(0..1) → 막대 채움 세그먼트 수(0..SEGMENTS). 0보다 크면 최소 1칸. */
export function impactBarLevel(impact: number): number {
  const segments = NEWS_IMPACT_BAR_SEGMENTS;
  if (impact <= 0) return 0;
  return Math.min(segments, Math.max(1, Math.round(impact * segments)));
}

export type NewsGroupLabel = '오늘' | '어제' | '이번 주' | '이전';

export interface NewsGroup {
  label: NewsGroupLabel;
  items: ScoredNewsItem[];
}

const GROUP_ORDER: NewsGroupLabel[] = ['오늘', '어제', '이번 주', '이전'];

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * 최신 피드용 — 캘린더 일자 기준으로 오늘/어제/이번 주/이전 버킷으로 그룹핑.
 * 각 그룹 내부는 최신순(timestamp desc) 유지. 비어있는 그룹은 생략.
 */
export function groupNewsByDay(items: ScoredNewsItem[], nowMs: number): NewsGroup[] {
  const today = startOfDay(nowMs);
  const buckets = new Map<NewsGroupLabel, ScoredNewsItem[]>();

  for (const item of items) {
    const day = startOfDay((Number(item.timestamp) || 0) * 1000);
    const diffDays = Math.round((today - day) / DAY_MS);
    const label: NewsGroupLabel =
      diffDays <= 0 ? '오늘' : diffDays === 1 ? '어제' : diffDays <= 7 ? '이번 주' : '이전';
    const list = buckets.get(label);
    if (list) list.push(item);
    else buckets.set(label, [item]);
  }

  return GROUP_ORDER.filter((label) => buckets.has(label)).map((label) => ({
    label,
    items: buckets.get(label)!.sort((a, b) => b.timestamp - a.timestamp),
  }));
}

/** 상대 시간 표기 (방금 전 / N분 전 / N시간 전 / 어제 / 날짜). */
export function formatRelativeTime(ts: number, nowMs: number): string {
  const diff = Math.floor((nowMs - ts * 1000) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 172800) return '어제';
  return new Date(ts * 1000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

/** 풀 날짜·시각 (title 속성 등 hover 표기용). */
export function formatFullDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** 감성 점수 → 부호 포함 표기 (+0.82 / −0.65 / 0.10). */
export function formatSignedScore(score: number): string {
  const v = Number(score) || 0;
  const abs = Math.abs(v).toFixed(2);
  if (v > 0) return `+${abs}`;
  if (v < 0) return `−${abs}`;
  return abs;
}
