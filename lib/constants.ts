import type {
  SignalType,
  SignalConfig,
  DashboardData,
  TimeSeriesPoint,
  TerminalData,
  StockPrediction,
  StockDetailData,
} from '@/types/dashboard';

export const SIGNAL_CONFIG: Record<SignalType, SignalConfig> = {
  BUY: {
    textColor: 'text-green-500',
    bgGlow: 'bg-green-500/20',
    shadowColor: 'rgba(34, 197, 94, 0.35)',
    borderColor: 'border-green-500/50',
  },
  SELL: {
    textColor: 'text-red-500',
    bgGlow: 'bg-red-500/20',
    shadowColor: 'rgba(239, 68, 68, 0.35)',
    borderColor: 'border-red-500/50',
  },
  HOLD: {
    textColor: 'text-yellow-500',
    bgGlow: 'bg-yellow-500/20',
    shadowColor: 'rgba(234, 179, 8, 0.35)',
    borderColor: 'border-yellow-500/50',
  },
};

export const NEWS_SENTIMENT_SCORE_THRESHOLD = 0.3;

// ── Stock news polling ──
export const STOCK_NEWS_DEFAULT_LIMIT = 10;
export const STOCK_NEWS_POLL_INTERVAL_MS = 2 * 60 * 1000; // 2분
export const STOCK_NEWS_FORCE_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10분

// ── Stock detail chart / quote ──
export const CHART_MINUTE_PERIODS = ['1min', '5min', '30min', '60min'] as const;
export const CHART_UPPER_PERIODS = ['day', 'week', 'month', 'year'] as const;
export const CHART_MINUTE_LABELS: Record<string, string> = {
  '1min': '1분', '5min': '5분', '30min': '30분', '60min': '60분',
};
export const CHART_UPPER_LABELS: Record<string, string> = {
  day: '일', week: '주', month: '월', year: '년',
};
export const CHART_DEFAULT_PERIOD = 'day';
export const QUOTE_POLL_INTERVAL_MS = 8_000; // 8초
export const ECON_CALENDAR_DEFAULT_LIMIT = 50;
export const ECON_CALENDAR_SIDEBAR_PAGE_SIZE = 10;
export const ECON_CALENDAR_DETAIL_LIMIT = 200;
export const ECON_CALENDAR_DEFAULT_SOURCE = 'forex_factory';
export const ECON_CALENDAR_AUTO_REFRESH_MIN_MS = 5 * 60 * 1000; // 5분
export const ECON_CALENDAR_AUTO_REFRESH_MAX_MS = 10 * 60 * 1000; // 10분

export type RadarSortKey =
  | 'volatility'
  | 'gainers'
  | 'losers'
  | 'volume'
  | 'divergence'
  | 'buy'
  | 'sell';

export interface RadarTab {
  key: RadarSortKey;
  label: string;
  shortLabel: string;
}

export const RADAR_TABS: RadarTab[] = [
  { key: 'divergence', label: 'AI 괴리율', shortLabel: '괴리율' },
  { key: 'buy', label: 'AI BUY', shortLabel: 'BUY' },
  { key: 'sell', label: 'AI SELL', shortLabel: 'SELL' },
  { key: 'volatility', label: '변동 상위', shortLabel: '변동' },
  { key: 'gainers', label: '상승 상위', shortLabel: '상승' },
  { key: 'losers', label: '하락 상위', shortLabel: '하락' },
  { key: 'volume', label: '거래량', shortLabel: '거래량' },
];

function generateTimeSeries(): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];

  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const date = new Date(2025, 0, 6 + i);

    const priceTrend = 62 - t * 24;
    const priceNoise = Math.sin(i * 0.8) * 2.5 + Math.cos(i * 1.3) * 1.5;

    const sentimentTrend =
      t < 0.35
        ? 58 - (t / 0.35) * 16
        : 42 + ((t - 0.35) / 0.65) * 32;
    const sentimentNoise =
      Math.sin(i * 0.6 + 1) * 2 + Math.cos(i * 1.1 + 2) * 1.2;

    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price: Math.round((priceTrend + priceNoise) * 10) / 10,
      sentiment: Math.round((sentimentTrend + sentimentNoise) * 10) / 10,
    });
  }

  return data;
}

const REPORT_MARKDOWN = `## 핵심 요약

현재 **NVDA(엔비디아)**는 최근 30일간 **-5.2%**의 가격 조정을 보였으나, AI 기반 뉴스 감성 분석 지수는 **+18.7%p**의 강한 긍정적 괴리를 나타내고 있습니다. 시장의 단기 조정이 과도하며, 감성 지표가 가격에 선행하여 **반등 가능성이 높다**고 판단합니다.

## 시장 가격 분석

최근 AI 반도체 섹터 전반의 기술적 조정과 함께 NVDA는 52주 최고점 대비 약 **12%** 하락하였습니다. 그러나 200일 이동평균선 위에서 견고한 지지를 형성하고 있으며, 거래량 분석 결과 기관 매수세가 점진적으로 유입되고 있는 것으로 확인됩니다.

- RSI(14): **38.2** — 과매도 근접 구간 진입
- MACD: 시그널 라인 하회 중이나 히스토그램 **수렴 진행 중**
- 볼린저 밴드: 하단 밴드 터치 후 **반등 시도 중**

## 뉴스 감성 분석

최근 7일간의 뉴스 감성 점수는 급격한 상승세를 기록하고 있습니다. 전체 분석 대상 뉴스 **1,247건** 중 긍정 비율이 **72.4%**로, 전주 대비 **+15.3%p** 상승하였습니다.

- 차세대 AI 칩 **'Blackwell Ultra'** 양산 일정 확정 및 초기 수율 목표 달성
- AWS, Azure, GCP 등 주요 클라우드 업체의 **AI 인프라 투자 확대** 공식 발표
- 분기 실적 **어닝 서프라이즈** 가능성에 대한 월가 애널리스트 리포트 급증

## 괴리율 해석

가격 수익률과 뉴스 감성 점수 사이의 괴리율이 **+18.7%p**로, 최근 6개월 내 최대치를 경신하였습니다. 이는 현재 시장 가격이 뉴스 흐름 및 펀더멘탈 대비 **과도하게 저평가**되어 있음을 강하게 시사합니다.

- 괴리율 **+15%p 이상** 발생 시 → 향후 2주 내 평균 **+7.3%** 가격 반등
- 백테스트 승률(Win Rate): **78.4%** (총 37회 시그널 중 29회 적중)
- 평균 보유 기간: **8.3 거래일**

## 리스크 요인

- 미중 반도체 수출 규제 강화에 따른 중국 매출 비중(**~25%**) 감소 리스크
- 연준(Fed)의 금리 정책 경로 불확실성 잔존
- 단기 기술적 저항선 **$140~$145** 구간 돌파 실패 시 추가 하락 가능
- AI 인프라 투자 사이클의 피크아웃(Peak-out) 우려 일부 존재

## 결론

종합적으로, 현재 가격 수준은 AI 분석 모델이 산출한 적정가 대비 유의미한 할인 구간에 위치합니다. 뉴스 감성 지표의 선행적 반등과 기술적 과매도 상태를 고려할 때, 현 시점에서의 **단계적 분할 매수 전략**을 권장합니다. 목표 수익률은 **+7~10%**, 손절 기준은 **-3%**로 설정합니다.`;

export const MOCK_DASHBOARD_DATA: DashboardData = {
  signalData: {
    signal: 'BUY',
    ticker: 'NVDA',
    tickerName: 'NVIDIA Corporation',
    confidence: 87.3,
    returnRate: -5.2,
    divergenceRate: 18.7,
    lastUpdated: '2025.02.04 16:30 KST 기준',
  },
  timeSeries: generateTimeSeries(),
  reportMarkdown: REPORT_MARKDOWN,
};

export const MOCK_TERMINAL_DATA: TerminalData = {
  marketTicker: [
    { symbol: 'SPX', name: 'S&P 500', price: '5,234.18', change: 21.87, changePercent: 0.42 },
    { symbol: 'NDX', name: 'NASDAQ 100', price: '18,342.39', change: 122.56, changePercent: 0.67 },
    { symbol: 'DJI', name: 'Dow Jones', price: '39,127.14', change: 89.54, changePercent: 0.23 },
    { symbol: 'VIX', name: 'Fear Index', price: '13.24', change: -0.44, changePercent: -3.21 },
    { symbol: 'US10Y', name: '10Y Yield', price: '4.31%', change: 0.02, changePercent: 0.47 },
    { symbol: 'DXY', name: 'Dollar Index', price: '104.23', change: -0.16, changePercent: -0.15 },
    { symbol: 'BTC', name: 'Bitcoin', price: '67,842.50', change: 1420.30, changePercent: 2.14 },
    { symbol: 'ETH', name: 'Ethereum', price: '3,421.30', change: 62.80, changePercent: 1.87 },
    { symbol: 'GOLD', name: 'Gold Futures', price: '2,347.60', change: 7.20, changePercent: 0.31 },
    { symbol: 'WTI', name: 'Crude Oil', price: '78.42', change: 0.87, changePercent: 1.12 },
    { symbol: 'AAPL', name: 'Apple', price: '189.84', change: 1.73, changePercent: 0.92 },
    { symbol: 'MSFT', name: 'Microsoft', price: '415.26', change: 2.35, changePercent: 0.57 },
    { symbol: 'NVDA', name: 'NVIDIA', price: '874.15', change: 28.87, changePercent: 3.42 },
    { symbol: 'TSLA', name: 'Tesla', price: '182.63', change: -2.29, changePercent: -1.24 },
    { symbol: 'AMZN', name: 'Amazon', price: '186.13', change: 1.90, changePercent: 1.03 },
    { symbol: 'META', name: 'Meta', price: '503.28', change: 7.74, changePercent: 1.56 },
    { symbol: 'GOOG', name: 'Alphabet', price: '172.85', change: 1.52, changePercent: 0.89 },
    { symbol: 'AMD', name: 'AMD', price: '164.37', change: 4.12, changePercent: 2.57 },
  ],

  macroIndicators: [
    {
      id: 'usdkrw',
      label: 'USD/KRW',
      value: '1,342.50',
      change: 0.23,
      changeLabel: '+3.08',
      sparkline: [1338, 1335, 1340, 1342, 1339, 1341, 1343, 1340, 1342, 1342],
    },
    {
      id: 'usdjpy',
      label: 'USD/JPY',
      value: '151.72',
      change: 0.18,
      changeLabel: '+0.27',
      sparkline: [151.2, 151.4, 151.3, 151.5, 151.6, 151.4, 151.7, 151.6, 151.7, 151.7],
    },
    {
      id: 'eurusd',
      label: 'EUR/USD',
      value: '1.0842',
      change: -0.12,
      changeLabel: '-0.0013',
      sparkline: [1.086, 1.085, 1.086, 1.085, 1.084, 1.085, 1.084, 1.084, 1.084, 1.084],
    },
    {
      id: 'us10y',
      label: 'US 10Y',
      value: '4.31%',
      change: 0.47,
      changeLabel: '+2bp',
      sparkline: [4.28, 4.30, 4.29, 4.32, 4.30, 4.29, 4.31, 4.30, 4.31, 4.31],
    },
    {
      id: 'us2y',
      label: 'US 2Y',
      value: '4.72%',
      change: -0.21,
      changeLabel: '-1bp',
      sparkline: [4.74, 4.73, 4.75, 4.73, 4.72, 4.73, 4.72, 4.73, 4.72, 4.72],
    },
    {
      id: 'wti',
      label: 'WTI Crude',
      value: '$78.42',
      change: 1.12,
      changeLabel: '+$0.87',
      sparkline: [77.2, 77.5, 77.8, 78.1, 77.9, 78.2, 78.3, 78.0, 78.2, 78.4],
    },
    {
      id: 'gold',
      label: 'Gold',
      value: '$2,347',
      change: 0.31,
      changeLabel: '+$7.20',
      sparkline: [2335, 2338, 2342, 2340, 2344, 2343, 2345, 2346, 2347, 2348],
    },
    {
      id: 'cpi',
      label: 'CPI YoY',
      value: '3.2%',
      change: -0.10,
      changeLabel: '-0.1%p',
      sparkline: [3.7, 3.5, 3.4, 3.3, 3.2, 3.2, 3.2, 3.1, 3.2, 3.2],
    },
  ],

  fearGreed: {
    value: 68,
    label: 'Greed',
  },

  predictions: [
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corp',
      price: 874.15,
      dailyChange: 3.42,
      signal: 'BUY',
      divergenceScore: 18.7,
      confidence: 87.3,
      sentimentScore: 82,
      isNew: true,
    },
    {
      ticker: 'AMD',
      name: 'AMD Inc',
      price: 164.37,
      dailyChange: 2.57,
      signal: 'BUY',
      divergenceScore: 12.4,
      confidence: 78.9,
      sentimentScore: 74,
      isNew: true,
    },
    {
      ticker: 'COIN',
      name: 'Coinbase Global',
      price: 237.85,
      dailyChange: 4.21,
      signal: 'BUY',
      divergenceScore: 15.3,
      confidence: 81.6,
      sentimentScore: 78,
      isNew: true,
    },
    {
      ticker: 'META',
      name: 'Meta Platforms',
      price: 503.28,
      dailyChange: 1.56,
      signal: 'BUY',
      divergenceScore: 8.9,
      confidence: 72.1,
      sentimentScore: 71,
      isNew: false,
    },
    {
      ticker: 'AMZN',
      name: 'Amazon.com',
      price: 186.13,
      dailyChange: 1.03,
      signal: 'BUY',
      divergenceScore: 9.5,
      confidence: 76.2,
      sentimentScore: 69,
      isNew: false,
    },
    {
      ticker: 'PLTR',
      name: 'Palantir Tech',
      price: 24.67,
      dailyChange: 1.89,
      signal: 'BUY',
      divergenceScore: 11.2,
      confidence: 74.8,
      sentimentScore: 72,
      isNew: false,
    },
    {
      ticker: 'AAPL',
      name: 'Apple Inc',
      price: 189.84,
      dailyChange: 0.92,
      signal: 'HOLD',
      divergenceScore: 3.2,
      confidence: 64.8,
      sentimentScore: 58,
      isNew: false,
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corp',
      price: 415.26,
      dailyChange: 0.57,
      signal: 'HOLD',
      divergenceScore: 2.1,
      confidence: 61.4,
      sentimentScore: 55,
      isNew: false,
    },
    {
      ticker: 'GOOG',
      name: 'Alphabet Inc',
      price: 172.85,
      dailyChange: 0.89,
      signal: 'HOLD',
      divergenceScore: 1.8,
      confidence: 58.3,
      sentimentScore: 52,
      isNew: false,
    },
    {
      ticker: 'NFLX',
      name: 'Netflix Inc',
      price: 628.42,
      dailyChange: -0.34,
      signal: 'HOLD',
      divergenceScore: -1.2,
      confidence: 53.7,
      sentimentScore: 48,
      isNew: false,
    },
    {
      ticker: 'TSLA',
      name: 'Tesla Inc',
      price: 182.63,
      dailyChange: -1.24,
      signal: 'SELL',
      divergenceScore: -12.4,
      confidence: 73.5,
      sentimentScore: 34,
      isNew: false,
    },
    {
      ticker: 'BABA',
      name: 'Alibaba Group',
      price: 73.42,
      dailyChange: -2.18,
      signal: 'SELL',
      divergenceScore: -8.7,
      confidence: 69.4,
      sentimentScore: 31,
      isNew: false,
    },
  ],

  newsFeed: [
    {
      id: '1',
      headline: 'NVIDIA Blackwell Ultra 차세대 AI 칩 양산 일정 공식 확정',
      source: 'Reuters',
      timestamp: '2분 전',
      sentiment: 'positive',
      score: 0.92,
      relatedTicker: 'NVDA',
    },
    {
      id: '2',
      headline: 'Fed 파월 의장 "추가 금리 인하 서두르지 않겠다" 발언',
      source: 'CNBC',
      timestamp: '8분 전',
      sentiment: 'negative',
      score: -0.74,
      relatedTicker: 'SPX',
    },
    {
      id: '3',
      headline: 'Tesla 자율주행 FSD v13 미국 전역 배포 개시',
      source: 'Bloomberg',
      timestamp: '15분 전',
      sentiment: 'positive',
      score: 0.81,
      relatedTicker: 'TSLA',
    },
    {
      id: '4',
      headline: '중국 부동산 위기 심화, 항셍지수 2% 급락',
      source: 'FT',
      timestamp: '22분 전',
      sentiment: 'negative',
      score: -0.88,
      relatedTicker: 'BABA',
    },
    {
      id: '5',
      headline: 'Apple Vision Pro 2세대 개발 확정, 2025 Q4 출시 예정',
      source: 'WSJ',
      timestamp: '31분 전',
      sentiment: 'positive',
      score: 0.67,
      relatedTicker: 'AAPL',
    },
    {
      id: '6',
      headline: 'AMD MI400 AI 가속기 벤치마크 유출, NVIDIA 경쟁 가열',
      source: 'TechCrunch',
      timestamp: '38분 전',
      sentiment: 'positive',
      score: 0.78,
      relatedTicker: 'AMD',
    },
    {
      id: '7',
      headline: '유럽 ECB 예상외 금리 동결, 유로화 강세 전환',
      source: 'Reuters',
      timestamp: '45분 전',
      sentiment: 'neutral',
      score: 0.12,
      relatedTicker: 'DXY',
    },
    {
      id: '8',
      headline: 'Microsoft Azure AI 매출 전년비 62% 증가 기록',
      source: 'Bloomberg',
      timestamp: '52분 전',
      sentiment: 'positive',
      score: 0.85,
      relatedTicker: 'MSFT',
    },
    {
      id: '9',
      headline: 'Coinbase SEC 소송 부분 승소, 크립토 규제 완화 기대',
      source: 'CoinDesk',
      timestamp: '1시간 전',
      sentiment: 'positive',
      score: 0.71,
      relatedTicker: 'COIN',
    },
    {
      id: '10',
      headline: 'Meta Llama 4 오픈소스 공개, AI 경쟁 새 국면',
      source: 'The Verge',
      timestamp: '1시간 전',
      sentiment: 'positive',
      score: 0.73,
      relatedTicker: 'META',
    },
    {
      id: '11',
      headline: '미국 CPI 3.2% 발표, 시장 예상치 부합',
      source: 'CNBC',
      timestamp: '2시간 전',
      sentiment: 'neutral',
      score: 0.08,
      relatedTicker: 'SPX',
    },
    {
      id: '12',
      headline: 'Palantir AIP 플랫폼 미 국방부 $500M 계약 체결',
      source: 'Reuters',
      timestamp: '2시간 전',
      sentiment: 'positive',
      score: 0.89,
      relatedTicker: 'PLTR',
    },
    {
      id: '13',
      headline: '일본은행 마이너스 금리 탈출 시사, 엔화 급등',
      source: 'Nikkei',
      timestamp: '3시간 전',
      sentiment: 'negative',
      score: -0.52,
      relatedTicker: 'JPY',
    },
    {
      id: '14',
      headline: 'Netflix 광고 요금제 가입자 4,000만 돌파',
      source: 'Variety',
      timestamp: '3시간 전',
      sentiment: 'positive',
      score: 0.64,
      relatedTicker: 'NFLX',
    },
  ],
};

function tickerHash(ticker: string): number {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ((hash << 5) - hash) + ticker.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateDetailSeries(signal: SignalType, seed: number): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];
  const n = seed % 10;

  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const date = new Date(2025, 0, 6 + i);
    let price: number;
    let sentiment: number;

    if (signal === 'BUY') {
      price = 62 - t * 24 + Math.sin(i * 0.8 + n) * 2.5 + Math.cos(i * 1.3) * 1.5;
      const sTrend = t < 0.35 ? 58 - (t / 0.35) * 16 : 42 + ((t - 0.35) / 0.65) * 32;
      sentiment = sTrend + Math.sin(i * 0.6 + 1) * 2 + Math.cos(i * 1.1 + 2) * 1.2;
    } else if (signal === 'SELL') {
      price = 38 + t * 24 + Math.sin(i * 0.7 + n) * 2.5 + Math.cos(i * 1.2) * 1.5;
      const sTrend = t < 0.35 ? 42 + (t / 0.35) * 16 : 58 - ((t - 0.35) / 0.65) * 32;
      sentiment = sTrend + Math.sin(i * 0.5 + 1) * 2 + Math.cos(i * 1.0 + 2) * 1.2;
    } else {
      price = 50 + Math.sin(i * 0.5 + n) * 5 + Math.cos(i * 0.3) * 3;
      sentiment = 50 + Math.sin(i * 0.7 + n * 0.7) * 4 + Math.cos(i * 0.5) * 2;
    }

    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price: Math.round(price * 10) / 10,
      sentiment: Math.round(sentiment * 10) / 10,
    });
  }

  return data;
}

const STOCK_REPORTS: Record<string, string> = {
  NVDA: REPORT_MARKDOWN,
  TSLA: `## 핵심 요약

현재 **TSLA(테슬라)**는 최근 30일간 주가 상승세를 보이고 있으나, AI 기반 뉴스 감성 분석 지수는 **-12.4%p**의 부정적 괴리를 나타내고 있습니다. 주가가 펀더멘탈 대비 과열되었으며, **단기 조정 가능성이 높다**고 판단합니다.

## 시장 가격 분석

TSLA는 자율주행 FSD 기대감에 힘입어 최근 2주간 약 **15%** 상승하였으나, 밸류에이션 부담이 심화되고 있습니다.

- RSI(14): **72.8** — 과매수 구간 진입
- Forward P/E: **68.4x** — 섹터 평균(24.2x) 대비 현저히 높음
- 공매도 비율 증가세 지속

## 뉴스 감성 분석

최근 7일간 뉴스 감성이 급격히 악화되고 있습니다. 부정적 뉴스 비율이 **58%**로 전주 대비 **+22%p** 상승하였습니다.

- EU 자율주행 규제 강화 법안 통과
- 중국 시장 점유율 BYD에 역전당한 것으로 확인
- 사이버트럭 리콜 이슈 지속

## 결론

기술적 과매수 상태와 감성 지표의 하락 추세를 고려할 때, 현 가격 수준에서의 **신규 매수는 권장하지 않으며**, 기존 보유자의 경우 **일부 익절 전략**을 권장합니다. 손절 기준은 현재가 대비 **+5%** 상승 시 설정합니다.`,

  AMD: `## 핵심 요약

현재 **AMD**는 AI 반도체 경쟁 심화 우려로 주가가 조정을 받았으나, MI400 신제품 기대감과 데이터센터 수주 확대로 뉴스 감성은 **+12.4%p** 괴리를 보이며 **저평가 구간**에 진입한 것으로 판단됩니다.

## 시장 가격 분석

AMD는 NVIDIA 대비 상대적 밸류에이션 매력이 부각되는 구간입니다.

- Forward P/E: **32.1x** — NVDA(42.3x) 대비 할인
- 데이터센터 GPU 시장 점유율 확대 추세
- MI300X 수요 예상 상회

## 뉴스 감성 분석

MI400 AI 가속기 벤치마크 유출 소식과 함께 기관 매수 리포트가 급증하고 있습니다.

- Morgan Stanley 목표가 상향 ($200 → $220)
- 클라우드 업체들의 AMD GPU 채택 비율 증가
- AI PC 시장 진출 가속화

## 결론

NVIDIA 대비 밸류에이션 갭 축소와 신제품 기대감을 고려하여 **분할 매수**를 권장합니다. 목표 수익률 **+8~12%**, 손절 기준 **-4%**로 설정합니다.`,
};

function generateGenericReport(p: StockPrediction): string {
  const divStr = `${p.divergenceScore >= 0 ? '+' : ''}${p.divergenceScore.toFixed(1)}`;
  const chgStr = `${p.dailyChange >= 0 ? '+' : ''}${p.dailyChange.toFixed(2)}`;

  if (p.signal === 'BUY') {
    return `## 핵심 요약

현재 **${p.ticker}(${p.name})**는 최근 가격 조정에도 불구하고, AI 감성 분석 지수가 **${divStr}%p**의 긍정적 괴리를 보이고 있습니다. 현재 가격이 펀더멘탈 대비 **저평가** 구간에 진입한 것으로 판단됩니다.

## 괴리율 해석

뉴스 감성 점수(**${p.sentimentScore}**/100)가 주가 방향성 대비 강한 괴리를 나타내고 있습니다. AI 모델 신뢰도 **${p.confidence.toFixed(1)}%** 기준, 유사 패턴의 과거 평균 반등률은 **+6.8%**입니다.

- 일일 변동: ${chgStr}%
- 괴리율: ${divStr}%p
- AI 확신도: ${p.confidence.toFixed(1)}%

## 결론

AI 분석 모델은 현 시점에서의 **단계적 분할 매수 전략**을 권장합니다. 감성 지표의 선행적 상승 흐름이 주가에 반영될 시점이 임박한 것으로 보입니다.`;
  }

  if (p.signal === 'SELL') {
    return `## 핵심 요약

현재 **${p.ticker}(${p.name})**는 주가 상승세에도 불구하고, AI 감성 분석 지수가 **${divStr}%p**의 부정적 괴리를 보이고 있습니다. 시장 가격이 펀더멘탈 대비 **고평가** 상태인 것으로 판단됩니다.

## 괴리율 해석

뉴스 감성 점수(**${p.sentimentScore}**/100)가 주가 방향성과 반대 흐름을 나타내고 있습니다. 부정적 뉴스의 증가세가 아직 주가에 반영되지 않은 상태입니다.

- 일일 변동: ${chgStr}%
- 괴리율: ${divStr}%p
- AI 확신도: ${p.confidence.toFixed(1)}%

## 결론

기술적 과열 신호와 감성 지표의 하락 추세를 고려할 때, **신규 매수를 지양**하고 기존 보유자는 **일부 포지션 축소**를 권장합니다.`;
  }

  return `## 핵심 요약

현재 **${p.ticker}(${p.name})**의 주가와 뉴스 감성 사이 괴리율은 **${divStr}%p**로 유의미한 시그널 수준에 미달합니다. AI 모델은 **관망** 포지션을 권장합니다.

## 괴리율 해석

현재 감성 점수(**${p.sentimentScore}**/100)와 주가 방향이 큰 차이를 보이지 않아, 명확한 매수/매도 시그널이 감지되지 않았습니다.

- 일일 변동: ${chgStr}%
- 괴리율: ${divStr}%p
- AI 확신도: ${p.confidence.toFixed(1)}%

## 결론

추가적인 시장 모멘텀 확인이 필요합니다. 괴리율이 **±10%p** 이상으로 확대될 때까지 **관망**하며, 포지션 진입 시점을 주시하는 것을 권장합니다.`;
}

export function getStockDetail(ticker: string): StockDetailData | null {
  const prediction = MOCK_TERMINAL_DATA.predictions.find(
    (p) => p.ticker === ticker.toUpperCase(),
  );
  if (!prediction) return null;

  const timeSeries = generateDetailSeries(prediction.signal, tickerHash(ticker));
  const reportMarkdown = STOCK_REPORTS[prediction.ticker] ?? generateGenericReport(prediction);
  const relatedNews = MOCK_TERMINAL_DATA.newsFeed
    .filter((n) => n.relatedTicker === prediction.ticker)
    .map((n) => ({
      headline: n.headline,
      source: n.source,
      url: '#',
      timestamp: n.timestamp,
      sentiment: n.sentiment,
    }));

  return {
    ticker: prediction.ticker,
    name: prediction.name,
    price: prediction.price,
    dailyChange: prediction.dailyChange,
    signal: prediction.signal,
    confidence: prediction.confidence,
    divergenceScore: prediction.divergenceScore,
    sentimentScore: prediction.sentimentScore,
    timeSeries,
    reportMarkdown,
    relatedNews,
  };
}
