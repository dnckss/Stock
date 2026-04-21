import type {
  SignalType,
  ApiLatestResponse,
  ApiStockDetailResponse,
  ApiReportGenerateResponse,
  ApiStockItem,
  ApiHistoryItem,
  ApiMacroData,
  ApiMacroItem,
  RadarStock,
  ChartDataPoint,
  MacroDisplayData,
  ApiStrategyResponse,
  ApiStockNewsItem,
  ApiNewsDetailResponse,
  RelatedNewsItem,
  ApiEconomicCalendarResponse,
  EconomicCalendarItem,
  ApiChartResponse,
  ApiStockQuote,
  StockQuote,
  ChartBar,
  ChartPeriod,
  ApiStockAnalysisResponse,
  ApiEconEventDetailResponse,
  EconEventDetail,
  ApiPortfolioResponse,
  ApiPortfolioStreamResult,
  PortfolioResult,
  PortfolioFullResult,
  PortfolioStyle,
  PortfolioPeriod,
  StockAnalysis,
  TrendType,
  TechnicalCondition,
  ReboundRating,
  StrategyAction,
  ApiHeatmapResponse,
  HeatmapData,
  HeatmapSector,
  ApiFundamentalsResponse,
  FundamentalsData,
  FundamentalsProfile,
  FundamentalsIndicators,
  FundamentalsEarnings,
  ProfitabilityQuarter,
  GrowthQuarter,
  StabilityQuarter,
  FundamentalsSectionKey,
  ApiPricePerformanceData,
  PricePerformanceItem,
  ChatMessage,
} from '@/types/dashboard';
import { ECON_CALENDAR_DEFAULT_LIMIT } from '@/lib/constants';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/market';

// ── Ticker name lookup ──

const TICKER_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc',
  MSFT: 'Microsoft Corp',
  NVDA: 'NVIDIA Corp',
  TSLA: 'Tesla Inc',
  AMZN: 'Amazon.com',
  META: 'Meta Platforms',
  GOOG: 'Alphabet Inc',
  GOOGL: 'Alphabet Inc',
  AMD: 'AMD Inc',
  NFLX: 'Netflix Inc',
  COIN: 'Coinbase Global',
  BABA: 'Alibaba Group',
  PLTR: 'Palantir Tech',
  SMCI: 'Super Micro Computer',
  ENPH: 'Enphase Energy',
  INTC: 'Intel Corp',
  QCOM: 'Qualcomm Inc',
  AVGO: 'Broadcom Inc',
  CRM: 'Salesforce Inc',
  ORCL: 'Oracle Corp',
  ADBE: 'Adobe Inc',
  PYPL: 'PayPal Holdings',
  SQ: 'Block Inc',
  SHOP: 'Shopify Inc',
  UBER: 'Uber Technologies',
  ABNB: 'Airbnb Inc',
  SNAP: 'Snap Inc',
  ROKU: 'Roku Inc',
  MRVL: 'Marvell Technology',
  MU: 'Micron Technology',
  ARM: 'Arm Holdings',
  PANW: 'Palo Alto Networks',
  CRWD: 'CrowdStrike',
  NET: 'Cloudflare Inc',
  DDOG: 'Datadog Inc',
  SNOW: 'Snowflake Inc',
  MSTR: 'MicroStrategy',
};

export function getTickerName(ticker: string): string {
  return TICKER_NAMES[ticker.toUpperCase()] ?? ticker.toUpperCase();
}

// ── Formatting ──

export function formatReturn(value: number): string {
  const pct = (value * 100).toFixed(2);
  return value >= 0 ? `+${pct}%` : `${pct}%`;
}

export function formatSentiment(value: number): string {
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

export function formatDivergence(value: number): string {
  return value >= 0 ? `+${value.toFixed(3)}` : value.toFixed(3);
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${month}월 ${day}일 ${h}:${m}`;
}

export function formatDDay(dateStr: string): string {
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return dateStr;
  const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

export function formatDateKR(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ── Data Transforms ──

export function apiStockToRadar(
  item: ApiStockItem,
  isTopPick: boolean,
): RadarStock {
  return {
    ticker: item.ticker,
    name: getTickerName(item.ticker),
    price: item.price ?? 0,
    volume: item.volume ?? 0,
    priceReturn: item['return'],
    sentiment: item.sentiment,
    divergence: item.divergence,
    signal: item.signal as SignalType,
    isTopPick,
  };
}

export function formatPrice(value: number): string {
  if (value === 0) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatVolume(value: number): string {
  if (value === 0) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('en-US');
}

export function deriveConfidence(divergence: number): number {
  return Math.min((Math.abs(divergence) / 0.5) * 100, 100);
}

export function apiHistoryToChart(history: ApiHistoryItem[]): ChartDataPoint[] {
  return [...history]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((h) => {
      const d = new Date(h.created_at);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        priceReturn: h.price_return * 100,
        sentiment: h.sentiment,
      };
    });
}

// ── Macro Transform ──

function formatMacroValue(value: number): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  if (Math.abs(n) >= 1000) {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return n.toFixed(2);
}

function formatChangePct(pct: number): string {
  const n = Number(pct);
  if (Number.isNaN(n)) return '—%';
  const val = (n * 100).toFixed(2);
  return n >= 0 ? `+${val}%` : `${val}%`;
}

function safeNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

/**
 * API macro 객체를 UI용으로 변환.
 * marquee/sidebar가 없거나 항목이 문자열/숫자 혼재여도 안전하게 처리.
 */
export function apiMacroToDisplay(macro: ApiMacroData | null | undefined): MacroDisplayData | null {
  if (!macro || typeof macro !== 'object') return null;

  const marqueeRaw = Array.isArray(macro.marquee) ? macro.marquee : [];
  const sidebarRaw = Array.isArray(macro.sidebar) ? macro.sidebar : [];
  const indicesRaw = Array.isArray(macro.indices) ? macro.indices : [];

  const mapToIndicator = (s: ApiMacroItem) => {
    const name = String(s?.name ?? '');
    const value = safeNumber(s?.value, 0);
    const pct = safeNumber(s?.pct, 0);
    return {
      id: name.toLowerCase().replace(/[\s/]/g, '-'),
      label: name,
      value: formatMacroValue(value),
      change: pct * 100,
      changeLabel: formatChangePct(pct),
      sparkline: [] as number[],
      flash: s?.flash ?? false,
    };
  };

  return {
    marquee: marqueeRaw.map((m) => {
      const name = String(m?.name ?? '');
      const value = safeNumber(m?.value, 0);
      const change = safeNumber(m?.change, 0);
      const pct = safeNumber(m?.pct, 0);
      return {
        symbol: name,
        name,
        price: formatMacroValue(value),
        change,
        changePercent: pct * 100,
      };
    }),
    fearGreed: null,
    indices: indicesRaw.map(mapToIndicator),
    indicators: sidebarRaw.map(mapToIndicator),
  };
}

// ── API Client ──

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchLatest(): Promise<ApiLatestResponse> {
  const res = await fetch(`${API_BASE}/api/latest`);
  if (!res.ok) {
    throw new ApiError(res.status, '시장 데이터를 불러올 수 없습니다');
  }
  return res.json();
}

export async function fetchStockDetail(
  ticker: string,
  newsLimitOrOptions: number | { newsLimit?: number; newsRefresh?: 0 | 1; chartPeriod?: string } = 10,
): Promise<ApiStockDetailResponse> {
  const newsLimit =
    typeof newsLimitOrOptions === 'number'
      ? newsLimitOrOptions
      : (newsLimitOrOptions?.newsLimit ?? 10);
  const newsRefresh =
    typeof newsLimitOrOptions === 'object' && newsLimitOrOptions
      ? (newsLimitOrOptions.newsRefresh ?? 0)
      : 0;
  const chartPeriod =
    typeof newsLimitOrOptions === 'object' && newsLimitOrOptions
      ? (newsLimitOrOptions.chartPeriod ?? 'day')
      : 'day';

  const safeNewsLimit = Number.isFinite(newsLimit)
    ? Math.max(1, Math.min(30, Math.trunc(newsLimit)))
    : 10;
  const safeNewsRefresh: 0 | 1 = newsRefresh === 1 ? 1 : 0;

  const qs = new URLSearchParams({
    chart_period: chartPeriod,
    news_limit: String(safeNewsLimit),
    news_refresh: String(safeNewsRefresh),
  });

  const res = await fetch(
    `${API_BASE}/api/stock/${encodeURIComponent(ticker)}?${qs.toString()}`,
  );
  if (res.status === 404) {
    try {
      const body = (await res.json()) as { detail?: string };
      throw new ApiError(404, body.detail ?? `${ticker.toUpperCase()} 데이터 없음`);
    } catch {
      throw new ApiError(404, `${ticker.toUpperCase()} 데이터 없음`);
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, '종목 데이터를 불러올 수 없습니다');
  }
  return res.json();
}

export interface FetchNewsDetailOptions {
  /** 1이면 본문 재크롤링 후 DB 갱신 */
  refresh?: boolean;
  /** 1이면 한국어 요약/영향 분석(캐시 없을 때만 서버에서 생성) */
  analyze?: boolean;
}

export async function fetchNewsDetail(
  url: string,
  options?: FetchNewsDetailOptions,
): Promise<ApiNewsDetailResponse> {
  const safeUrl = typeof url === 'string' ? url.trim() : '';
  if (!safeUrl) {
    throw new ApiError(400, 'url 파라미터가 필요합니다');
  }

  const refresh = options?.refresh === true ? '1' : '0';
  const analyze = options?.analyze === false ? '0' : '1';

  const qs = new URLSearchParams({
    url: safeUrl,
    refresh,
    analyze,
  });

  const res = await fetch(`${API_BASE}/api/news?${qs.toString()}`);

  if (res.status === 400) {
    try {
      const body = (await res.json()) as { detail?: string };
      throw new ApiError(400, body.detail ?? 'url 파라미터가 필요합니다');
    } catch {
      throw new ApiError(400, 'url 파라미터가 필요합니다');
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, '뉴스 본문을 불러올 수 없습니다');
  }

  return res.json();
}

export function apiStockNewsToRelatedNews(
  items: ApiStockNewsItem[] | null | undefined,
): RelatedNewsItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    headline: item.title,
    source: item.publisher,
    url: item.url,
    timestamp: new Date(item.timestamp * 1000).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    sentiment: item.sentiment_label,
  }));
}

export async function requestReport(
  ticker: string,
): Promise<ApiReportGenerateResponse> {
  const res = await fetch(
    `${API_BASE}/api/stock/${encodeURIComponent(ticker)}/report`,
    { method: 'POST' },
  );
  if (res.status === 404) {
    throw new ApiError(404, '분석 데이터가 없습니다');
  }
  if (res.status === 502) {
    throw new ApiError(
      502,
      'AI 리포트 생성에 실패했습니다. 잠시 후 다시 시도해주세요',
    );
  }
  if (!res.ok) {
    throw new ApiError(res.status, '리포트를 생성할 수 없습니다');
  }
  return res.json();
}

// ── Stock Chart / Quote ──

export async function fetchStockChart(
  ticker: string,
  period: ChartPeriod = 'day',
): Promise<ApiChartResponse> {
  const qs = new URLSearchParams({ period });
  const res = await fetch(
    `${API_BASE}/api/stock/${encodeURIComponent(ticker)}/chart?${qs.toString()}`,
  );
  if (!res.ok) {
    throw new ApiError(res.status, '차트 데이터를 불러올 수 없습니다');
  }
  return res.json();
}

export async function fetchStockQuote(
  ticker: string,
): Promise<ApiStockQuote> {
  const res = await fetch(
    `${API_BASE}/api/stock/${encodeURIComponent(ticker)}/quote`,
  );
  if (!res.ok) {
    throw new ApiError(res.status, '시세 데이터를 불러올 수 없습니다');
  }
  return res.json();
}

export function parseQuote(raw: ApiStockQuote | null | undefined): StockQuote | null {
  if (!raw || typeof raw.price !== 'number') return null;
  return {
    price: raw.price,
    open: raw.open ?? 0,
    high: raw.high ?? 0,
    low: raw.low ?? 0,
    prevClose: raw.prev_close ?? 0,
    change: raw.change ?? 0,
    changePct: raw.change_pct ?? 0,
    volume: raw.volume ?? 0,
    volumeDisplay: raw.volume_display ?? String(raw.volume ?? 0),
    marketCap: raw.market_cap ?? 0,
    marketCapDisplay: raw.market_cap_display ?? '',
    peRatio: raw.pe_ratio ?? null,
    forwardPe: raw.forward_pe ?? null,
    dividendYield: raw.dividend_yield ?? null,
    beta: raw.beta ?? null,
    ma50: raw.ma_50 ?? null,
    ma200: raw.ma_200 ?? null,
    bid: raw.bid ?? null,
    ask: raw.ask ?? null,
    bidSize: raw.bid_size ?? null,
    askSize: raw.ask_size ?? null,
    asOf: raw.as_of ?? '',
  };
}

export function parseChartBars(bars: ApiChartResponse['bars'] | null | undefined): ChartBar[] {
  if (!Array.isArray(bars)) return [];
  return bars
    .filter((b) => b && typeof b.close === 'number')
    .map((b) => ({
      timestamp: String(b.timestamp ?? ''),
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume ?? 0,
    }));
}

// ── Stock AI Analysis ──

const VALID_TRENDS = new Set<TrendType>(['uptrend', 'downtrend', 'sideways']);
const VALID_CONDITIONS = new Set<TechnicalCondition>(['oversold', 'overbought', 'neutral']);
const VALID_REBOUND = new Set<ReboundRating>(['high', 'medium', 'low']);
const VALID_ACTIONS = new Set<StrategyAction>(['BUY', 'SELL', 'WAIT', 'HOLD']);

export async function fetchStockAnalysis(ticker: string): Promise<ApiStockAnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/stock/${encodeURIComponent(ticker)}/analysis`);
  if (!res.ok) {
    throw new ApiError(res.status, 'AI 분석을 불러올 수 없습니다');
  }
  return res.json();
}

export function parseStockAnalysis(raw: ApiStockAnalysisResponse | null | undefined): StockAnalysis | null {
  const a = raw?.analysis;
  if (!a) return null;

  const trendRaw = String(a.price_action?.trend ?? '').toLowerCase();
  const condRaw = String(a.technical_diagnosis?.condition ?? '').toLowerCase();
  const ratingRaw = String(a.rebound_potential?.rating ?? '').toLowerCase();
  const actionRaw = String(a.strategy?.action ?? '').toUpperCase();

  return {
    priceAction: {
      trend: VALID_TRENDS.has(trendRaw as TrendType) ? (trendRaw as TrendType) : 'sideways',
      cause: String(a.price_action?.cause ?? '').trim(),
      keyEvents: Array.isArray(a.price_action?.key_events)
        ? a.price_action.key_events.map((e) => String(e).trim()).filter(Boolean)
        : [],
    },
    technicalDiagnosis: {
      condition: VALID_CONDITIONS.has(condRaw as TechnicalCondition) ? (condRaw as TechnicalCondition) : 'neutral',
      summary: String(a.technical_diagnosis?.summary ?? '').trim(),
      supportTest: String(a.technical_diagnosis?.support_test ?? '').trim(),
    },
    reboundPotential: {
      rating: VALID_REBOUND.has(ratingRaw as ReboundRating) ? (ratingRaw as ReboundRating) : 'medium',
      reason: String(a.rebound_potential?.reason ?? '').trim(),
      catalysts: Array.isArray(a.rebound_potential?.catalysts)
        ? a.rebound_potential.catalysts.map((c) => String(c).trim()).filter(Boolean)
        : [],
    },
    risks: Array.isArray(a.risks) ? a.risks.map((r) => String(r).trim()).filter(Boolean) : [],
    strategy: {
      action: VALID_ACTIONS.has(actionRaw as StrategyAction) ? (actionRaw as StrategyAction) : 'WAIT',
      entryCondition: String(a.strategy?.entry_condition ?? '').trim(),
      stopLossNote: String(a.strategy?.stop_loss_note ?? '').trim(),
      summary: String(a.strategy?.summary ?? '').trim(),
    },
    overallSummary: String(a.overall_summary ?? '').trim(),
    generatedAt: typeof a.generated_at === 'string' ? a.generated_at.trim() : null,
  };
}

export async function fetchStrategy(): Promise<ApiStrategyResponse> {
  const res = await fetch(`${API_BASE}/api/strategy`);
  if (!res.ok) {
    throw new ApiError(res.status, '전략 데이터를 불러올 수 없습니다');
  }
  return res.json();
}

// ── S&P 500 Heatmap ──

export async function fetchSP500Heatmap(signal?: AbortSignal): Promise<ApiHeatmapResponse> {
  const res = await fetch(`${API_BASE}/api/heatmap/sp500`, { signal });
  if (!res.ok) {
    throw new ApiError(res.status, '히트맵 데이터를 불러올 수 없습니다');
  }
  return res.json();
}

export function apiHeatmapToDisplay(
  payload: ApiHeatmapResponse | null | undefined,
): HeatmapData | null {
  if (!payload || !Array.isArray(payload.sectors)) return null;

  const sectors: HeatmapSector[] = payload.sectors
    .map((sector) => {
      const stocks = (sector.stocks ?? []).map((s) => ({
        ticker: String(s.ticker ?? ''),
        name: String(s.name ?? ''),
        marketCap: Number(s.market_cap) || 0,
        changePct: Number(s.change_pct) || 0,
        price: Number(s.price) || 0,
      }));
      const totalMarketCap = stocks.reduce((sum, s) => sum + s.marketCap, 0);
      return {
        name: String(sector.name ?? ''),
        stocks,
        totalMarketCap,
      };
    })
    .filter((s) => s.stocks.length > 0 && s.totalMarketCap > 0);

  return {
    sectors,
    updatedAt: payload.updated_at ?? '',
  };
}

export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

function toImportance(value: unknown): 0 | 1 | 2 | 3 {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n >= 3) return 3;
  if (n >= 2) return 2;
  if (n >= 1) return 1;
  return 0;
}

export function apiEconomicCalendarToDisplay(
  payload: ApiEconomicCalendarResponse | null | undefined,
): EconomicCalendarItem[] {
  if (!payload || !Array.isArray(payload.items)) return [];

  return payload.items.map((item, index) => {
    const eventId = item.event_id ? String(item.event_id) : null;
    const dateLabel = String(item.date_label ?? '').trim();
    const timeLabel = String(item.time_label ?? '').trim();
    const countryCode = String(item.country_code ?? '').trim().toUpperCase();
    const event = String(item.event ?? '').trim();
    const currency = String(item.currency ?? '').trim().toUpperCase();
    const id = eventId || `${dateLabel}-${timeLabel}-${countryCode}-${event}-${index}`;

    return {
      id,
      dateLabel,
      timeLabel,
      countryCode,
      countryName: item.country_name ? String(item.country_name) : null,
      currency,
      importance: toImportance(item.importance),
      event,
      actual: item.actual ?? null,
      forecast: item.forecast ?? null,
      previous: item.previous ?? null,
    };
  });
}

export async function fetchEconomicCalendar(options?: {
  refresh?: 0 | 1;
}): Promise<ApiEconomicCalendarResponse> {
  const refresh = options?.refresh === 1 ? 1 : 0;
  const qs = new URLSearchParams({
    refresh: String(refresh),
  });

  const res = await fetch(`${API_BASE}/api/economic-calendar?${qs.toString()}`);
  if (!res.ok) {
    throw new ApiError(res.status, '경제 일정을 불러올 수 없습니다');
  }
  return res.json();
}

export async function fetchEconEventDetail(options: {
  event: string;
  country?: string;
  currency?: string;
  forecast?: string;
  previous?: string;
}): Promise<ApiEconEventDetailResponse> {
  const qs = new URLSearchParams({ event: options.event });
  if (options.country) qs.set('country', options.country);
  if (options.currency) qs.set('currency', options.currency);
  if (options.forecast) qs.set('forecast', options.forecast);
  if (options.previous) qs.set('previous', options.previous);

  const res = await fetch(`${API_BASE}/api/economic-calendar/detail?${qs.toString()}`);
  if (!res.ok) {
    throw new ApiError(res.status, '경제 일정 상세를 불러올 수 없습니다');
  }
  return res.json();
}

export function parseEconEventDetail(raw: ApiEconEventDetailResponse | null | undefined): EconEventDetail | null {
  if (!raw?.detail) return null;
  const d = raw.detail;
  return {
    event: raw.event ?? '',
    cacheHit: raw.cache_hit ?? false,
    nameKo: String(d.name_ko ?? '').trim(),
    category: String(d.category ?? '').trim(),
    description: String(d.description ?? '').trim(),
    whyImportant: String(d.why_important ?? '').trim(),
    marketImpact: {
      stocks: String(d.market_impact?.stocks ?? '').trim(),
      currency: String(d.market_impact?.currency ?? '').trim(),
      sectors: Array.isArray(d.market_impact?.sectors)
        ? d.market_impact.sectors.map((s) => String(s).trim()).filter(Boolean)
        : [],
    },
    readingGuide: {
      aboveExpected: String(d.reading_guide?.above_expected ?? '').trim(),
      belowExpected: String(d.reading_guide?.below_expected ?? '').trim(),
      keyThreshold: String(d.reading_guide?.key_threshold ?? '').trim(),
    },
    releaseInfo: {
      frequency: String(d.release_info?.frequency ?? '').trim(),
      source: String(d.release_info?.source ?? '').trim(),
      typicalImpactDuration: String(d.release_info?.typical_impact_duration ?? '').trim(),
    },
    relatedIndicators: Array.isArray(d.related_indicators)
      ? d.related_indicators.map((i) => String(i).trim()).filter(Boolean)
      : [],
    summary: String(d.summary ?? '').trim(),
  };
}

// ── Portfolio Builder ──

export async function fetchPortfolio(options: {
  budget: number;
  style: PortfolioStyle;
  period: PortfolioPeriod;
  exclude?: string;
}): Promise<ApiPortfolioResponse> {
  const qs = new URLSearchParams({
    budget: String(options.budget),
    style: options.style,
    period: options.period,
  });
  if (options.exclude) qs.set('exclude', options.exclude);

  const res = await fetch(`${API_BASE}/api/portfolio?${qs.toString()}`);
  if (!res.ok) {
    throw new ApiError(res.status, '포트폴리오를 생성할 수 없습니다');
  }
  return res.json();
}

export function parsePortfolioResult(raw: ApiPortfolioResponse | null | undefined): PortfolioResult | null {
  if (!raw || !Array.isArray(raw.allocations)) return null;
  return {
    budget: raw.budget ?? 0,
    style: raw.style ?? '',
    styleKo: raw.style_ko ?? raw.style ?? '',
    period: raw.period ?? '',
    periodKo: raw.period_ko ?? raw.period ?? '',
    allocations: raw.allocations.map((a) => ({
      ticker: String(a.ticker ?? '').trim().toUpperCase(),
      name: String(a.name ?? '').trim(),
      price: a.price ?? 0,
      shares: a.shares ?? 0,
      amount: a.amount ?? 0,
      weightPct: a.weight_pct ?? 0,
      rationale: String(a.rationale ?? '').trim(),
    })),
    totalInvested: raw.total_invested ?? 0,
    cashRemaining: raw.cash_remaining ?? 0,
    portfolioThesis: String(raw.portfolio_thesis ?? '').trim(),
    sectorExposure: raw.sector_exposure ?? {},
    riskAssessment: {
      level: String(raw.risk_assessment?.level ?? '').trim(),
      maxDrawdownEst: String(raw.risk_assessment?.max_drawdown_est ?? '').trim(),
      volatilityNote: String(raw.risk_assessment?.volatility_note ?? '').trim(),
    },
    rebalanceTrigger: String(raw.rebalance_trigger ?? '').trim(),
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map((w) => String(w).trim()).filter(Boolean) : [],
    marketRegime: String(raw.market_regime ?? '').trim(),
    generatedAt: typeof raw.generated_at === 'string' ? raw.generated_at.trim() : null,
  };
}

// ── Portfolio Streaming (SSE) ──

export function buildPortfolioStreamUrl(options: {
  budget: number;
  style: PortfolioStyle;
  period: PortfolioPeriod;
  exclude?: string;
  include?: string;
  preferred_sectors?: string;
  max_weight?: number;
  target_return?: number;
  dividend_preference?: boolean;
}): string {
  const qs = new URLSearchParams({
    budget: String(options.budget),
    style: options.style,
    period: options.period,
  });
  if (options.exclude) qs.set('exclude', options.exclude);
  if (options.include) qs.set('include', options.include);
  if (options.preferred_sectors) qs.set('preferred_sectors', options.preferred_sectors);
  if (options.max_weight != null) qs.set('max_weight', String(options.max_weight));
  if (options.target_return != null) qs.set('target_return', String(options.target_return));
  if (options.dividend_preference) qs.set('dividend_preference', 'true');
  return `${API_BASE}/api/portfolio/stream?${qs.toString()}`;
}

export function parsePortfolioFullResult(
  raw: ApiPortfolioStreamResult | null | undefined,
): PortfolioFullResult | null {
  const base = parsePortfolioResult(raw);
  if (!base) return null;

  const ra = raw?.risk_analysis;
  const xaiRaw = raw?.xai;

  return {
    ...base,
    riskAnalysisDetail: ra
      ? {
          correlation: {
            matrix: ra.correlation?.matrix ?? {},
            diversificationScore: ra.correlation?.diversification_score ?? 0,
          },
          volatility: Array.isArray(ra.volatility)
            ? ra.volatility.map((v) => ({
                ticker: String(v.ticker ?? '').trim().toUpperCase(),
                annualVolatility: v.annual_volatility ?? 0,
                mdd: v.mdd ?? 0,
                sharpe: v.sharpe ?? 0,
              }))
            : [],
          var: {
            var95: ra.var?.var_95 ?? 0,
            var99: ra.var?.var_99 ?? 0,
            cvar: ra.var?.cvar ?? 0,
          },
          monteCarlo: {
            expectedReturn: ra.monte_carlo?.expected_return ?? 0,
            lossProbability: ra.monte_carlo?.loss_probability ?? 0,
            paths: Array.isArray(ra.monte_carlo?.paths) ? ra.monte_carlo.paths : [],
          },
          scenarios: Array.isArray(ra.scenarios)
            ? ra.scenarios.map((s) => ({
                name: String(s.name ?? '').trim(),
                impact: s.impact ?? 0,
                description: String(s.description ?? '').trim(),
              }))
            : [],
          anomalies: Array.isArray(ra.anomalies)
            ? ra.anomalies.map((a) => ({
                ticker: String(a.ticker ?? '').trim().toUpperCase(),
                type: String(a.type ?? '').trim(),
                message: String(a.message ?? '').trim(),
                severity: String(a.severity ?? '').trim(),
              }))
            : [],
        }
      : null,
    xai: xaiRaw
      ? {
          stockBriefs: Array.isArray(xaiRaw.stock_briefs)
            ? xaiRaw.stock_briefs.map((sb) => ({
                ticker: String(sb.ticker ?? '').trim().toUpperCase(),
                reason: String(sb.reason ?? '').trim(),
                keyEvidence: Array.isArray(sb.key_evidence)
                  ? sb.key_evidence.map((e) => String(e).trim()).filter(Boolean)
                  : [],
              }))
            : [],
          portfolioNarrative: String(xaiRaw.portfolio_narrative ?? '').trim(),
          riskNarrative: String(xaiRaw.risk_narrative ?? '').trim(),
          scenarioBrief: String(xaiRaw.scenario_brief ?? '').trim(),
          actionItems: Array.isArray(xaiRaw.action_items)
            ? xaiRaw.action_items.map((a) => String(a).trim()).filter(Boolean)
            : [],
        }
      : null,
    totalElapsedSec: raw?.total_elapsed_sec ?? null,
  };
}

// ── Stock Fundamentals ──

export async function fetchFundamentals(
  ticker: string,
): Promise<ApiFundamentalsResponse> {
  const res = await fetch(
    `${API_BASE}/api/stock/${encodeURIComponent(ticker)}/fundamentals`,
  );
  if (!res.ok) {
    throw new ApiError(res.status, '펀더멘털 데이터를 불러올 수 없습니다');
  }
  return res.json();
}

export async function fetchFundamentalsSection(
  ticker: string,
  section: FundamentalsSectionKey,
): Promise<ApiFundamentalsResponse> {
  const res = await fetch(
    `${API_BASE}/api/stock/${encodeURIComponent(ticker)}/fundamentals/${encodeURIComponent(section)}`,
  );
  if (res.status === 400) {
    try {
      const body = (await res.json()) as { detail?: string };
      throw new ApiError(400, body.detail ?? '유효하지 않은 섹션입니다');
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(400, '유효하지 않은 섹션입니다');
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, '펀더멘털 섹션을 불러올 수 없습니다');
  }
  return res.json();
}

function toQuarterLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const q = Math.ceil((d.getMonth() + 1) / 3);
  const yr = String(d.getFullYear()).slice(-2);
  return `Q${q} '${yr}`;
}

export function parseFundamentals(
  raw: ApiFundamentalsResponse | null | undefined,
): FundamentalsData | null {
  if (!raw || typeof raw.ticker !== 'string') return null;

  // Profile
  const rp = raw.profile;
  const profile: FundamentalsProfile | null = rp
    ? {
        name: String(rp.name ?? '').trim(),
        sector: String(rp.sector ?? '').trim(),
        industry: String(rp.industry ?? '').trim(),
        description: String(rp.description ?? '').trim(),
        website: String(rp.website ?? '').trim(),
        employees: typeof rp.employees === 'number' ? rp.employees : null,
        officers: Array.isArray(rp.officers)
          ? rp.officers.map((o) => ({
              name: String(o.name ?? '').trim(),
              title: String(o.title ?? '').trim(),
            }))
          : [],
        marketCap: typeof rp.market_cap === 'number' ? rp.market_cap : null,
        marketCapDisplay: String(rp.market_cap_display ?? '').trim(),
        sharesOutstanding:
          typeof rp.shares_outstanding === 'number' ? rp.shares_outstanding : null,
        country: String(rp.country ?? '').trim(),
        headquarters: String(rp.headquarters ?? '').trim(),
      }
    : null;

  // Indicators
  const ri = raw.indicators;
  const indicators: FundamentalsIndicators | null = ri
    ? {
        valuation: {
          per: ri.valuation?.per ?? null,
          forwardPer: ri.valuation?.forward_per ?? null,
          psr: ri.valuation?.psr ?? null,
          pbr: ri.valuation?.pbr ?? null,
        },
        perShare: {
          eps: ri.per_share?.eps ?? null,
          bps: ri.per_share?.bps ?? null,
          roe: ri.per_share?.roe ?? null,
        },
        dividends: {
          dividendYield: ri.dividends?.dividend_yield ?? null,
          dividendRate: ri.dividends?.dividend_rate ?? null,
          payoutRatio: ri.dividends?.payout_ratio ?? null,
          exDividendDate:
            typeof ri.dividends?.ex_dividend_date === 'string'
              ? ri.dividends.ex_dividend_date.trim()
              : null,
        },
        financialHealth: {
          debtRatio: ri.financial_health?.debt_ratio ?? null,
          currentRatio: ri.financial_health?.current_ratio ?? null,
          interestCoverageRatio: ri.financial_health?.interest_coverage_ratio ?? null,
        },
      }
    : null;

  // Profitability
  const profitability: ProfitabilityQuarter[] = Array.isArray(
    raw.profitability?.quarters,
  )
    ? raw.profitability.quarters
        .filter((q) => q && typeof q.date === 'string')
        .map((q) => ({
          date: q.date,
          label: toQuarterLabel(q.date),
          revenue: typeof q.revenue === 'number' ? q.revenue : null,
          netIncome: typeof q.net_income === 'number' ? q.net_income : null,
          netMargin: typeof q.net_margin === 'number' ? q.net_margin : null,
          netIncomeYoy: typeof q.net_income_yoy === 'number' ? q.net_income_yoy : null,
        }))
    : [];

  // Growth
  const growth: GrowthQuarter[] = Array.isArray(raw.growth?.quarters)
    ? raw.growth.quarters
        .filter((q) => q && typeof q.date === 'string')
        .map((q) => ({
          date: q.date,
          label: toQuarterLabel(q.date),
          operatingIncome:
            typeof q.operating_income === 'number' ? q.operating_income : null,
          operatingMargin:
            typeof q.operating_margin === 'number' ? q.operating_margin : null,
          operatingIncomeYoy:
            typeof q.operating_income_yoy === 'number' ? q.operating_income_yoy : null,
        }))
    : [];

  // Stability
  const stability: StabilityQuarter[] = Array.isArray(raw.stability?.quarters)
    ? raw.stability.quarters
        .filter((q) => q && typeof q.date === 'string')
        .map((q) => ({
          date: q.date,
          label: toQuarterLabel(q.date),
          totalEquity:
            typeof q.total_equity === 'number' ? q.total_equity : null,
          totalDebt: typeof q.total_debt === 'number' ? q.total_debt : null,
          debtRatio: typeof q.debt_ratio === 'number' ? q.debt_ratio : null,
        }))
    : [];

  // Earnings
  const re = raw.earnings;
  const earnings: FundamentalsEarnings | null = re
    ? {
        nextEarningsDate:
          typeof re.next_earnings_date === 'string'
            ? re.next_earnings_date.trim()
            : null,
        history: Array.isArray(re.history)
          ? re.history
              .filter((h) => h && typeof h.date === 'string')
              .map((h) => ({
                date: h.date,
                label: toQuarterLabel(h.date),
                epsActual: typeof h.eps_actual === 'number' ? h.eps_actual : null,
                epsEstimate:
                  typeof h.eps_estimate === 'number' ? h.eps_estimate : null,
                surprisePct:
                  typeof h.surprise_pct === 'number' ? h.surprise_pct : null,
              }))
          : [],
        analystCount:
          typeof re.analyst_count === 'number' ? re.analyst_count : null,
        targetMeanPrice:
          typeof re.target_mean_price === 'number' ? re.target_mean_price : null,
        targetHighPrice:
          typeof re.target_high_price === 'number' ? re.target_high_price : null,
        targetLowPrice:
          typeof re.target_low_price === 'number' ? re.target_low_price : null,
        recommendation:
          typeof re.recommendation === 'string'
            ? re.recommendation.trim().toLowerCase()
            : null,
      }
    : null;

  return {
    ticker: raw.ticker,
    profile,
    indicators,
    profitability,
    growth,
    stability,
    earnings,
  };
}

// ── Price Performance ──

export async function fetchPricePerformance(
  ticker: string,
): Promise<ApiPricePerformanceData | null> {
  const res = await fetch(
    `${API_BASE}/api/stock/${encodeURIComponent(ticker)}/fundamentals`,
  );
  if (!res.ok) {
    throw new ApiError(res.status, '가격 성과 데이터를 불러올 수 없습니다');
  }
  const body = await res.json();
  return body?.price_performance ?? null;
}

export function parsePricePerformance(
  raw: ApiPricePerformanceData | null | undefined,
): Map<string, PricePerformanceItem> {
  const map = new Map<string, PricePerformanceItem>();
  if (!raw || !Array.isArray(raw.periods)) return map;

  for (const item of raw.periods) {
    if (!item || typeof item.label !== 'string') continue;
    map.set(item.label.toUpperCase(), {
      period: item.label.toUpperCase(),
      changePct: typeof item.change_pct === 'number' ? item.change_pct : 0,
      volume: typeof item.volume === 'number' ? item.volume : 0,
      tradingValue: typeof item.trading_value === 'number' ? item.trading_value : 0,
    });
  }

  return map;
}

// ── Chat ──

export async function chatStreamFetch(
  messages: ChatMessage[],
  tickers?: string[],
  signal?: AbortSignal,
): Promise<Response> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, tickers }),
    signal,
  });
  if (!res.ok) {
    throw new ApiError(res.status, 'AI 응답을 받을 수 없습니다');
  }
  return res;
}

export async function extractTickers(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/chat/extract-tickers?q=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.tickers) ? data.tickers : [];
  } catch {
    return [];
  }
}
