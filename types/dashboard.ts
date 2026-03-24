export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface TimeSeriesPoint {
  date: string;
  price: number;
  sentiment: number;
}

export interface SignalData {
  signal: SignalType;
  ticker: string;
  tickerName: string;
  confidence: number;
  returnRate: number;
  divergenceRate: number;
  lastUpdated: string;
}

export interface SignalConfig {
  textColor: string;
  bgGlow: string;
  shadowColor: string;
  borderColor: string;
}

export interface DashboardData {
  signalData: SignalData;
  timeSeries: TimeSeriesPoint[];
  reportMarkdown: string;
}

export interface MarketTickerItem {
  symbol: string;
  name: string;
  price: string;
  change: number;
  changePercent: number;
}

export interface MacroIndicator {
  id: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  sparkline: number[];
}

export interface FearGreedData {
  value: number;
  label: string;
}

export interface StockPrediction {
  ticker: string;
  name: string;
  price: number;
  dailyChange: number;
  signal: SignalType;
  divergenceScore: number;
  confidence: number;
  sentimentScore: number;
  isNew: boolean;
}

export interface NewsSentimentItem {
  id: string;
  headline: string;
  source: string;
  timestamp: string;
  sentiment: SentimentType;
  score: number;
  relatedTicker: string;
}

export interface TerminalData {
  marketTicker: MarketTickerItem[];
  macroIndicators: MacroIndicator[];
  fearGreed: FearGreedData;
  predictions: StockPrediction[];
  newsFeed: NewsSentimentItem[];
}

export interface RelatedNewsItem {
  headline: string;
  source: string;
  url: string;
  timestamp: string;
  sentiment: SentimentType;
}

export interface StockDetailData {
  ticker: string;
  name: string;
  price: number;
  dailyChange: number;
  signal: SignalType;
  confidence: number;
  divergenceScore: number;
  sentimentScore: number;
  timeSeries: TimeSeriesPoint[];
  reportMarkdown: string;
  relatedNews: RelatedNewsItem[];
}

// ── API Response Types (match backend exactly) ──

export interface ApiStockItem {
  ticker: string;
  return: number;
  price?: number;
  volume?: number;
  sentiment: number;
  divergence: number;
  signal: SignalType;
}

export interface ApiLatestResponse {
  top_picks: ApiStockItem[];
  radar: ApiStockItem[];
  macro?: ApiMacroData;
  news_feed?: ApiNewsFeedItem[];
  updated_at: string | null;
}

export interface ApiHistoryItem {
  price_return: number;
  sentiment: number;
  divergence: number;
  signal: SignalType;
  created_at: string;
}

export interface ApiReportRecord {
  id: number;
  ticker: string;
  price_return: number;
  sentiment: number;
  divergence: number;
  signal: SignalType;
  report: string;
  created_at: string;
}

export interface ApiStockDetailResponse {
  ticker: string;
  latest_report: ApiReportRecord | null;
  history: ApiHistoryItem[];
}

export interface ApiReportGenerateResponse {
  ticker: string;
  report: string;
  cached: boolean;
}

// ── UI Display Types (transformed from API) ──

export interface RadarStock {
  ticker: string;
  name: string;
  price: number;
  volume: number;
  priceReturn: number;
  sentiment: number;
  divergence: number;
  signal: SignalType;
  isTopPick: boolean;
}

export interface ChartDataPoint {
  date: string;
  priceReturn: number;
  sentiment: number;
}

// ── API Macro Types ──

export interface ApiMacroItem {
  name: string;
  value: number;
  change: number;
  pct: number;
}

export interface ApiMacroData {
  marquee: ApiMacroItem[];
  sidebar: ApiMacroItem[];
  /** 3대지수 (S&P 500, NASDAQ, Dow 등) — 있으면 사이드바 상단에 표시 */
  indices?: ApiMacroItem[];
}

export interface MacroDisplayData {
  marquee: MarketTickerItem[];
  fearGreed: FearGreedData | null;
  /** 3대지수 */
  indices: MacroIndicator[];
  /** 기타 매크로 지표 */
  indicators: MacroIndicator[];
}

// ── API News Feed Types (WebSocket) ──

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface ApiNewsFeedItem {
  title: string;
  publisher: string;
  ticker: string;
  score: number;
  sentiment_label: SentimentLabel;
  confidence: number;
  url: string;
  /** Unix timestamp (seconds) */
  timestamp: number;
}

export interface NewsFeedItem {
  id: string;
  title: string;
  publisher: string;
  ticker: string;
  score: number;
  sentimentLabel: SentimentLabel;
  confidence: number;
  url: string;
  timestamp: number;
}

// ── Strategy (AI Strategy Room) ──
export interface ApiStrategySectorItem {
  /** 섹터명 (백엔드 필드명은 name/sector 중 하나일 수 있음) */
  name?: string;
  sector?: string;
  /** 평균 괴리율 (백엔드 필드명은 divergence/avg_divergence 중 하나일 수 있음) */
  divergence?: number;
  avg_divergence?: number;
}

export interface ApiStrategyPick {
  ticker?: string;
  rationale?: string;
}

export interface ApiStrategyResponse {
  market_summary: string;
  sector_data: ApiStrategySectorItem[];
  top_sector: {
    name: string;
    reason: string;
  };
  top_picks: ApiStrategyPick[];
}

export interface StrategySectorItem {
  sector: string;
  divergence: number;
}

export interface StrategyTopPick {
  ticker: string;
  rationale: string;
}

export interface StrategyData {
  marketSummary: string;
  sectors: StrategySectorItem[];
  topSector: {
    name: string;
    reason: string;
  };
  topPicks: StrategyTopPick[];
}
