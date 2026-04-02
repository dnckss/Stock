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
  economic_calendar?: ApiEconomicCalendarResponse;
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

// ── Stock Quote / Chart API Types ──

export interface ApiStockQuote {
  price: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  change: number;
  change_pct: number;
  volume: number;
  volume_display?: string;
  market_cap?: number;
  market_cap_display?: string;
  pe_ratio?: number | null;
  forward_pe?: number | null;
  dividend_yield?: number | null;
  beta?: number | null;
  ma_50?: number | null;
  ma_200?: number | null;
  bid?: number | null;
  ask?: number | null;
  bid_size?: number | null;
  ask_size?: number | null;
  as_of?: string;
}

export interface ApiChartBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiChartResponse {
  period: string;
  bars: ApiChartBar[];
  count: number;
}

export type ChartPeriod = '1min' | '5min' | '30min' | '60min' | 'day' | 'week' | 'month' | 'year';

export interface StockQuote {
  price: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePct: number;
  volume: number;
  volumeDisplay: string;
  marketCap: number;
  marketCapDisplay: string;
  peRatio: number | null;
  forwardPe: number | null;
  dividendYield: number | null;
  beta: number | null;
  ma50: number | null;
  ma200: number | null;
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  asOf: string;
}

export interface ChartBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── Stock AI Analysis Types ──

export interface ApiStockAnalysisResponse {
  ticker: string;
  analysis: {
    price_action?: {
      trend?: string;
      cause?: string;
      key_events?: string[];
    };
    technical_diagnosis?: {
      condition?: string;
      summary?: string;
      support_test?: string;
    };
    rebound_potential?: {
      rating?: string;
      reason?: string;
      catalysts?: string[];
    };
    risks?: string[];
    strategy?: {
      action?: string;
      entry_condition?: string;
      stop_loss_note?: string;
      summary?: string;
    };
    overall_summary?: string;
    generated_at?: string;
  };
}

export type TrendType = 'uptrend' | 'downtrend' | 'sideways';
export type TechnicalCondition = 'oversold' | 'overbought' | 'neutral';
export type ReboundRating = 'high' | 'medium' | 'low';
export type StrategyAction = 'BUY' | 'SELL' | 'WAIT' | 'HOLD';

export interface StockAnalysis {
  priceAction: {
    trend: TrendType;
    cause: string;
    keyEvents: string[];
  };
  technicalDiagnosis: {
    condition: TechnicalCondition;
    summary: string;
    supportTest: string;
  };
  reboundPotential: {
    rating: ReboundRating;
    reason: string;
    catalysts: string[];
  };
  risks: string[];
  strategy: {
    action: StrategyAction;
    entryCondition: string;
    stopLossNote: string;
    summary: string;
  };
  overallSummary: string;
  generatedAt: string | null;
}

export interface ApiStockDetailResponse {
  ticker: string;
  company_name?: string | null;
  latest_report: ApiReportRecord | null;
  history: ApiHistoryItem[];
  /** 뉴스 (백엔드 필드명: stock_news 또는 news) */
  stock_news?: ApiStockNewsItem[];
  news?: ApiStockNewsItem[];
  stock_news_meta?: {
    refresh: boolean;
  };
  quote?: ApiStockQuote | null;
  chart?: ApiChartResponse | null;
  analysis?: {
    latest_report?: ApiReportRecord | null;
    history?: ApiHistoryItem[];
  };
}

export interface ApiStockNewsItem {
  title: string;
  publisher: string;
  timestamp: number;
  ticker: string;
  url: string;
  score: number;
  sentiment_label: SentimentLabel;
  confidence: number;
}

/** GET /api/news 응답의 뉴스 분석(한국어 요약·영향) */
export interface ApiNewsAnalysisImpact {
  sectors: string[];
  themes: string[];
  direction: 'positive' | 'negative' | 'mixed' | 'unclear' | string;
  confidence: number;
  reason_ko: string;
}

export interface ApiNewsAnalysis {
  ko_summary: string;
  impact: ApiNewsAnalysisImpact;
  tickers_mentioned: string[];
}

export interface ApiNewsDetailResponse {
  url_hash: string;
  url: string;
  title: string | null;
  publisher: string | null;
  ticker: string | null;
  timestamp: string | null;
  /** 본문 (마크다운) */
  article_markdown?: string;
  /** 레거시: 본문 (평문) */
  article_text?: string;
  /** 추출 상태 (빈 본문 분기용) */
  extraction_status?: 'ok' | 'empty' | 'blocked' | 'timeout' | 'paywall' | 'error' | string;
  /** 원문에서 추출된 미디어 목록 (프론트는 이 배열만 렌더) */
  media?: Array<{
    type: 'image' | 'video' | 'embed' | 'link' | string;
    url: string;
    caption?: string | null;
    thumbnail_url?: string | null;
    provider?: string | null;
    start_time?: number | null;
  }>;
  /** 도메인 allowlist: article(원문), media(이미지 등) */
  domains?: {
    article?: string;
    media?: string[];
  };
  /** 뉴스 분석(없으면 null — 생성 중이거나 스킵/실패) */
  analysis?: ApiNewsAnalysis | null;
  fetched_at: string;
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

// ── API Economic Calendar Types ──
export interface ApiEconomicCalendarItem {
  event_id?: string | null;
  date_label: string;
  time_label: string;
  country_code: string;
  country_name?: string | null;
  currency: string;
  importance: number;
  event: string;
  actual?: string | null;
  forecast?: string | null;
  previous?: string | null;
}

export interface ApiEconomicCalendarError {
  code: string;
  message: string;
  status?: number;
}

export interface ApiEconomicCalendarResponse {
  source: 'forex_factory' | string;
  items: ApiEconomicCalendarItem[];
  fetched_at: string;
  cache_hit: boolean;
  cache_ttl_sec: number;
  error: ApiEconomicCalendarError | null;
}

export interface EconomicCalendarItem {
  id: string;
  dateLabel: string;
  timeLabel: string;
  countryCode: string;
  countryName: string | null;
  currency: string;
  importance: 0 | 1 | 2 | 3;
  event: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

// ── Economic Calendar Event Detail ──

export interface ApiEconEventDetailResponse {
  event: string;
  cache_hit: boolean;
  detail: {
    name_ko?: string;
    category?: string;
    description?: string;
    why_important?: string;
    market_impact?: {
      stocks?: string;
      currency?: string;
      sectors?: string[];
    };
    reading_guide?: {
      above_expected?: string;
      below_expected?: string;
      key_threshold?: string;
    };
    release_info?: {
      frequency?: string;
      source?: string;
      typical_impact_duration?: string;
    };
    related_indicators?: string[];
    summary?: string;
  };
}

export interface EconEventDetail {
  event: string;
  cacheHit: boolean;
  nameKo: string;
  category: string;
  description: string;
  whyImportant: string;
  marketImpact: {
    stocks: string;
    currency: string;
    sectors: string[];
  };
  readingGuide: {
    aboveExpected: string;
    belowExpected: string;
    keyThreshold: string;
  };
  releaseInfo: {
    frequency: string;
    source: string;
    typicalImpactDuration: string;
  };
  relatedIndicators: string[];
  summary: string;
}

// ── AI Portfolio Builder ──

export type PortfolioStyle = 'aggressive' | 'balanced' | 'conservative';
export type PortfolioPeriod = 'short' | 'medium' | 'long';

export interface ApiPortfolioAllocation {
  ticker: string;
  name?: string;
  price: number;
  shares: number;
  amount: number;
  weight_pct: number;
  rationale?: string;
}

export interface ApiPortfolioResponse {
  budget: number;
  style: string;
  style_ko?: string;
  period: string;
  period_ko?: string;
  allocations: ApiPortfolioAllocation[];
  total_invested: number;
  cash_remaining: number;
  portfolio_thesis?: string;
  sector_exposure?: Record<string, number>;
  risk_assessment?: {
    level?: string;
    max_drawdown_est?: string;
    volatility_note?: string;
  };
  rebalance_trigger?: string;
  warnings?: string[];
  market_regime?: string;
  generated_at?: string;
}

export interface PortfolioAllocation {
  ticker: string;
  name: string;
  price: number;
  shares: number;
  amount: number;
  weightPct: number;
  rationale: string;
}

export interface PortfolioResult {
  budget: number;
  style: string;
  styleKo: string;
  period: string;
  periodKo: string;
  allocations: PortfolioAllocation[];
  totalInvested: number;
  cashRemaining: number;
  portfolioThesis: string;
  sectorExposure: Record<string, number>;
  riskAssessment: {
    level: string;
    maxDrawdownEst: string;
    volatilityNote: string;
  };
  rebalanceTrigger: string;
  warnings: string[];
  marketRegime: string;
  generatedAt: string | null;
}

// ── Strategy (AI Strategy Room) ──

// -- API types (snake_case, backend response) --

export interface ApiStrategySectorItem {
  name?: string;
  sector?: string;
  divergence?: number;
  avg_divergence?: number;
}

export interface ApiNewsTheme {
  theme?: string;
  tickers?: string[];
  sentiment?: string;
  detail?: string;
}

export interface ApiStrategyTechnicalIndicators {
  rsi?: number | null;
  bollinger_position?: number | null;
  macd_signal?: string | null;
  macd_histogram?: number | null;
}

export interface ApiStrategyPriceLevel {
  date?: string;
  close?: number;
}

export interface ApiStrategyRelatedNews {
  headline?: string;
  url?: string;
  source?: string;
  sentiment?: string;
}

export interface ApiStrategyRecommendation {
  ticker?: string;
  name?: string;
  direction?: string;
  confidence?: string;
  rationale?: string;
  entry_price?: number | null;
  stop_loss?: number | null;
  target_price?: number | null;
  risk_reward_ratio?: number | null;
  technical_indicators?: ApiStrategyTechnicalIndicators | null;
  price_history?: ApiStrategyPriceLevel[] | null;
  related_news?: ApiStrategyRelatedNews[] | null;
}

export interface ApiEconSurprise {
  event?: string;
  date?: string;
  actual?: string | null;
  forecast?: string | null;
  impact?: string;
  detail?: string;
}

export interface ApiUpcomingRisk {
  event?: string;
  date?: string;
  risk_level?: string;
  detail?: string;
}

export interface ApiEconAnalysis {
  summary?: string | null;
  recent_surprises?: ApiEconSurprise[] | null;
  upcoming_risks?: ApiUpcomingRisk[] | null;
}

export interface ApiRiskWarning {
  level?: string;
  message?: string;
}

/** @deprecated 하위호환용 — recommendations로 대체 */
export interface ApiStrategyPick {
  ticker?: string;
  direction?: string;
  confidence?: string;
  rationale?: string;
}

/** @deprecated 하위호환용 — econ_analysis.upcoming_risks로 대체 */
export interface ApiRiskEvent {
  event?: string;
  date?: string;
  risk_level?: string;
  detail?: string;
}

export interface ApiStrategyResponse {
  market_summary: string;
  market_regime?: string | null;
  fear_greed?: number | null;
  sector_data: ApiStrategySectorItem[];
  top_sector: { name: string; reason: string };
  recommendations?: ApiStrategyRecommendation[] | null;
  news_themes?: ApiNewsTheme[];
  econ_analysis?: ApiEconAnalysis | null;
  risk_warnings?: ApiRiskWarning[] | null;
  generated_at?: string;
  /** @deprecated 하위호환 */
  top_picks?: ApiStrategyPick[];
  /** @deprecated 하위호환 */
  econ_impact?: string | null;
  /** @deprecated 하위호환 */
  risk_events?: ApiRiskEvent[];
}

// -- Display types (camelCase, UI) --

export interface StrategySectorItem {
  sector: string;
  divergence: number;
}

export type StrategyDirection = 'BUY' | 'SELL' | 'SHORT' | 'HOLD';
export type StrategyConfidence = 'high' | 'medium' | 'low';
export type ThemeSentiment = 'positive' | 'negative' | 'neutral';
export type RiskLevel = 'high' | 'medium' | 'low';
export type MarketRegime = 'bull' | 'bear' | 'sideways' | 'volatile';
export type MacdSignal = 'bullish' | 'bearish' | 'neutral';
export type EconImpactType = 'positive' | 'negative' | 'neutral';
export type RiskWarningLevel = 'critical' | 'high' | 'medium';

export interface StrategyNewsTheme {
  theme: string;
  tickers: string[];
  sentiment: ThemeSentiment;
  detail: string;
}

export interface StrategyTechnicalIndicators {
  rsi: number | null;
  bollingerPosition: number | null;
  macdSignal: MacdSignal;
  macdHistogram: number | null;
}

export interface StrategyPriceLevel {
  date: string;
  close: number;
}

export interface StrategyRelatedNews {
  headline: string;
  url: string;
  source: string;
  sentiment: ThemeSentiment;
}

export interface StrategyRecommendation {
  ticker: string;
  name: string;
  direction: StrategyDirection;
  confidence: StrategyConfidence;
  rationale: string;
  entryPrice: number | null;
  stopLoss: number | null;
  targetPrice: number | null;
  riskRewardRatio: number | null;
  technicalIndicators: StrategyTechnicalIndicators | null;
  priceHistory: StrategyPriceLevel[];
  relatedNews: StrategyRelatedNews[];
}

export interface EconSurprise {
  event: string;
  date: string;
  actual: string | null;
  forecast: string | null;
  impact: EconImpactType;
  detail: string;
}

export interface UpcomingRisk {
  event: string;
  date: string;
  riskLevel: RiskLevel;
  detail: string;
}

export interface EconAnalysis {
  summary: string | null;
  recentSurprises: EconSurprise[];
  upcomingRisks: UpcomingRisk[];
}

export interface RiskWarning {
  level: RiskWarningLevel;
  message: string;
}

export interface StrategyData {
  marketSummary: string;
  marketRegime: MarketRegime | null;
  fearGreed: number | null;
  sectors: StrategySectorItem[];
  topSector: { name: string; reason: string };
  recommendations: StrategyRecommendation[];
  newsThemes: StrategyNewsTheme[];
  econAnalysis: EconAnalysis | null;
  riskWarnings: RiskWarning[];
  generatedAt: string | null;
}
