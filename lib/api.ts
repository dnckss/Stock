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
} from '@/types/dashboard';

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

// ── Data Transforms ──

export function apiStockToRadar(
  item: ApiStockItem,
  isTopPick: boolean,
): RadarStock {
  return {
    ticker: item.ticker,
    name: getTickerName(item.ticker),
    priceReturn: item['return'],
    sentiment: item.sentiment,
    divergence: item.divergence,
    signal: item.signal as SignalType,
    isTopPick,
  };
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
): Promise<ApiStockDetailResponse> {
  const res = await fetch(
    `${API_BASE}/api/stock/${encodeURIComponent(ticker)}`,
  );
  if (res.status === 404) {
    throw new ApiError(404, '아직 분석되지 않은 종목입니다');
  }
  if (!res.ok) {
    throw new ApiError(res.status, '종목 데이터를 불러올 수 없습니다');
  }
  return res.json();
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
