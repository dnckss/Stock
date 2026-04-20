'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──

type CardKind = 'chart' | 'news' | 'indicator' | 'sector' | 'metric';
type Sentiment = 'positive' | 'negative' | 'neutral';

interface FloatingCard {
  id: string;
  kind: CardKind;
  x: number;
  y: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
  sentiment: Sentiment;
  ticker?: string;
  price?: number;
  change?: number;
  sparkline?: number[];
  headline?: string;
  source?: string;
  label?: string;
  value?: string;
  barPct?: number;
}

// ── Data pools ──

const TICKERS_WITH_PRICE: { ticker: string; price: number }[] = [
  { ticker: 'AAPL', price: 189 }, { ticker: 'NVDA', price: 874 }, { ticker: 'MSFT', price: 415 },
  { ticker: 'GOOGL', price: 173 }, { ticker: 'AMZN', price: 186 }, { ticker: 'META', price: 503 },
  { ticker: 'TSLA', price: 183 }, { ticker: 'AMD', price: 164 }, { ticker: 'AVGO', price: 1340 },
  { ticker: 'NFLX', price: 628 }, { ticker: 'JPM', price: 198 }, { ticker: 'V', price: 280 },
  { ticker: 'UNH', price: 524 }, { ticker: 'LLY', price: 780 }, { ticker: 'XOM', price: 107 },
  { ticker: 'COIN', price: 238 }, { ticker: 'PLTR', price: 25 }, { ticker: 'SHOP', price: 67 },
];

const NEWS_HEADLINES = [
  { headline: 'NVIDIA Blackwell Ultra 차세대 AI 칩 양산 일정 공식 확정', source: 'Reuters', sentiment: 'positive' as Sentiment },
  { headline: 'Fed 파월 의장 "추가 금리 인하 서두르지 않겠다" 발언', source: 'CNBC', sentiment: 'negative' as Sentiment },
  { headline: 'Tesla 자율주행 FSD v13 미국 전역 배포 개시', source: 'Bloomberg', sentiment: 'positive' as Sentiment },
  { headline: '중국 부동산 위기 심화, 항셍지수 2% 급락', source: 'FT', sentiment: 'negative' as Sentiment },
  { headline: 'AMD MI400 AI 가속기 벤치마크 유출, 경쟁 가열', source: 'TechCrunch', sentiment: 'positive' as Sentiment },
  { headline: 'Microsoft Azure AI 매출 전년비 62% 증가 기록', source: 'Bloomberg', sentiment: 'positive' as Sentiment },
  { headline: '유럽 ECB 예상외 금리 동결, 유로화 강세 전환', source: 'Reuters', sentiment: 'neutral' as Sentiment },
  { headline: 'Coinbase SEC 소송 부분 승소, 크립토 규제 완화', source: 'CoinDesk', sentiment: 'positive' as Sentiment },
  { headline: '미국 CPI 3.2% 발표, 시장 예상치 부합', source: 'CNBC', sentiment: 'neutral' as Sentiment },
  { headline: 'Palantir AIP 미 국방부 $500M 계약 체결', source: 'Reuters', sentiment: 'positive' as Sentiment },
  { headline: '글로벌 반도체 재고 조정 마무리 국면 진입', source: 'Nikkei', sentiment: 'positive' as Sentiment },
  { headline: '미중 무역 갈등 재점화, 관세 확대 우려', source: 'WSJ', sentiment: 'negative' as Sentiment },
  { headline: 'Apple Vision Pro 2세대 개발 확정, 2025 Q4 출시', source: 'WSJ', sentiment: 'positive' as Sentiment },
  { headline: '고용 지표 호조, 경기 연착륙 기대 강화', source: 'Bloomberg', sentiment: 'positive' as Sentiment },
];

const INDICATOR_ITEMS = [
  { label: 'RSI', ticker: 'NVDA', value: '64.2', barPct: 64 },
  { label: 'RSI', ticker: 'AAPL', value: '42.1', barPct: 42 },
  { label: 'RSI', ticker: 'TSLA', value: '72.8', barPct: 73 },
  { label: 'Bollinger', ticker: 'AMD', value: '78%', barPct: 78 },
  { label: 'Bollinger', ticker: 'META', value: '35%', barPct: 35 },
  { label: 'ADX', ticker: 'MSFT', value: '28.4', barPct: 57 },
  { label: 'Stoch', ticker: 'GOOGL', value: '55.0', barPct: 55 },
  { label: 'ATR', ticker: 'AMZN', value: '3.24', barPct: 45 },
  { label: 'OBV', ticker: 'JPM', value: '+8.2M', barPct: 68 },
];

const SECTOR_ITEMS = [
  { name: 'Technology', change: '+2.4' }, { name: 'Healthcare', change: '+1.1' },
  { name: 'Financials', change: '-0.8' }, { name: 'Energy', change: '+3.2' },
  { name: 'Consumer', change: '-0.3' }, { name: 'Industrials', change: '+0.7' },
  { name: 'Materials', change: '-1.5' }, { name: 'Communication', change: '+1.8' },
];

const METRIC_ITEMS = [
  { ticker: 'NVDA', label: 'P/E', value: '42.3x' },
  { ticker: 'AAPL', label: 'Div', value: '0.52%' },
  { ticker: 'MSFT', label: 'EPS', value: '$11.07' },
  { ticker: 'TSLA', label: 'Beta', value: '1.47' },
  { ticker: 'AMD', label: 'ROE', value: '4.2%' },
  { ticker: 'META', label: 'MC', value: '$1.28T' },
  { ticker: 'JPM', label: 'P/B', value: '1.82x' },
  { ticker: 'LLY', label: 'Margin', value: '32.1%' },
];

// ── Sparkline generator ──

function generateSparkline(points: number = 16): number[] {
  const data: number[] = [];
  let val = 40 + Math.random() * 30;
  for (let i = 0; i < points; i++) {
    val += (Math.random() - 0.48) * 6;
    val = Math.max(10, Math.min(90, val));
    data.push(val);
  }
  return data;
}

// ── Phase config ──

const PHASES = [
  { label: '시장 데이터 수집', description: '실시간 주가 / 거래량 / 지수 데이터를 수집합니다' },
  { label: '뉴스 감성 분석', description: '최신 뉴스의 투자 심리를 AI로 분석합니다' },
  { label: '기술적 지표 계산', description: 'RSI / MACD / 볼린저밴드 등 핵심 지표를 산출합니다' },
  { label: '섹터 상관관계 분석', description: '업종별 괴리율과 회전 패턴을 분석합니다' },
  { label: 'AI 전략 수립', description: '모든 데이터를 종합하여 최적 전략을 도출합니다' },
] as const;

const PHASE_DURATION_MS = 12_000;
const SPAWN_INTERVAL_MS = 3_200;
const MAX_VISIBLE = 16;
const BATCH_SIZE = 3;

// ── Card generator ──

let cardCounter = 0;

function randomCardPosition() {
  const angle = Math.random() * Math.PI * 2;
  const radius = 18 + Math.random() * 28;
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
}

function generateCard(): FloatingCard {
  const id = `c-${++cardCounter}-${Date.now()}`;
  const pos = randomCardPosition();
  const base = {
    id,
    x: pos.x,
    y: pos.y,
    duration: 6 + Math.random() * 5,
    delay: Math.random() * 1.5,
    dx: Math.random() * 12 - 6,
    dy: Math.random() * 10 - 5,
  };

  const kindRoll = Math.random();

  if (kindRoll < 0.28) {
    const stock = TICKERS_WITH_PRICE[Math.floor(Math.random() * TICKERS_WITH_PRICE.length)];
    const change = (Math.random() * 8 - 3);
    return {
      ...base, kind: 'chart', sentiment: change >= 0 ? 'positive' : 'negative',
      ticker: stock.ticker, price: stock.price + (Math.random() * 10 - 5),
      change, sparkline: generateSparkline(),
    };
  }
  if (kindRoll < 0.52) {
    const news = NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)];
    return {
      ...base, kind: 'news', sentiment: news.sentiment,
      headline: news.headline, source: news.source,
    };
  }
  if (kindRoll < 0.72) {
    const ind = INDICATOR_ITEMS[Math.floor(Math.random() * INDICATOR_ITEMS.length)];
    return {
      ...base, kind: 'indicator', sentiment: 'neutral',
      ticker: ind.ticker, label: ind.label, value: ind.value, barPct: ind.barPct,
    };
  }
  if (kindRoll < 0.86) {
    const sec = SECTOR_ITEMS[Math.floor(Math.random() * SECTOR_ITEMS.length)];
    const pct = Number(sec.change);
    return {
      ...base, kind: 'sector', sentiment: pct > 0 ? 'positive' : pct < 0 ? 'negative' : 'neutral',
      label: sec.name, value: `${sec.change}%`, barPct: Math.abs(pct) * 15 + 20,
    };
  }
  const met = METRIC_ITEMS[Math.floor(Math.random() * METRIC_ITEMS.length)];
  return {
    ...base, kind: 'metric', sentiment: 'neutral',
    ticker: met.ticker, label: met.label, value: met.value,
  };
}

function generateBatch(count: number): FloatingCard[] {
  return Array.from({ length: count }, () => generateCard());
}

// ── Sparkline SVG ──

function SparklineSVG({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 100;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const last = pts[pts.length - 1];
  const color = positive ? '#22c55e' : '#ef4444';

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <linearGradient id={`sg-${positive ? 'p' : 'n'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${polyline} ${w},${h}`}
        fill={`url(#sg-${positive ? 'p' : 'n'})`}
      />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={2} fill={color} />
    </svg>
  );
}

// ── Card renderers ──

function ChartCard({ card }: { card: FloatingCard }) {
  const positive = (card.change ?? 0) >= 0;
  return (
    <div className="w-[160px] rounded-xl border border-zinc-800/60 bg-zinc-900/80 backdrop-blur-md p-2.5 shadow-lg">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono font-bold text-zinc-100">{card.ticker}</span>
        <span className={`text-[10px] font-mono font-bold tabular-nums ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? '+' : ''}{(card.change ?? 0).toFixed(2)}%
        </span>
      </div>
      {card.sparkline && <SparklineSVG data={card.sparkline} positive={positive} />}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] font-mono text-zinc-500">${(card.price ?? 0).toFixed(2)}</span>
        <span className="text-[7px] font-mono text-zinc-700">LIVE</span>
      </div>
    </div>
  );
}

function NewsCard({ card }: { card: FloatingCard }) {
  const dotColor = card.sentiment === 'positive' ? 'bg-emerald-500' : card.sentiment === 'negative' ? 'bg-red-500' : 'bg-zinc-500';
  return (
    <div className="w-[220px] rounded-xl border border-zinc-800/60 bg-zinc-900/80 backdrop-blur-md p-2.5 shadow-lg">
      <div className="flex items-start gap-2">
        <span className={`shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-zinc-200 leading-relaxed line-clamp-2 font-medium">
            {card.headline}
            <span className="inline-block w-0.5 h-3 bg-blue-400/60 animate-pulse ml-0.5 align-middle" />
          </p>
          <p className="text-[8px] font-mono text-zinc-600 mt-1">{card.source}</p>
        </div>
      </div>
    </div>
  );
}

function IndicatorCard({ card }: { card: FloatingCard }) {
  const pct = card.barPct ?? 50;
  const barColor = pct < 30 ? 'bg-red-500' : pct > 70 ? 'bg-red-400' : pct > 55 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className="w-[140px] rounded-xl border border-zinc-800/60 bg-zinc-900/80 backdrop-blur-md p-2.5 shadow-lg">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono text-zinc-500 uppercase">{card.label}</span>
        <span className="text-[9px] font-mono text-zinc-600">{card.ticker}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right">
        <span className="text-[11px] font-mono font-bold text-zinc-200 tabular-nums">{card.value}</span>
      </div>
    </div>
  );
}

function SectorCard({ card }: { card: FloatingCard }) {
  const positive = card.sentiment === 'positive';
  return (
    <div className="w-[150px] rounded-xl border border-zinc-800/60 bg-zinc-900/80 backdrop-blur-md p-2.5 shadow-lg">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono text-zinc-300">{card.label}</span>
        <span className={`text-[10px] font-mono font-bold tabular-nums ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {card.value}
        </span>
      </div>
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${positive ? 'bg-emerald-500/60' : 'bg-red-500/60'}`}
          style={{ width: `${card.barPct ?? 30}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({ card }: { card: FloatingCard }) {
  return (
    <div className="w-[120px] rounded-xl border border-zinc-800/60 bg-zinc-900/80 backdrop-blur-md p-2.5 shadow-lg">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-mono font-bold text-zinc-100">{card.ticker}</span>
        <span className="text-[8px] font-mono text-zinc-600">{card.label}</span>
      </div>
      <span className="text-sm font-mono font-bold text-zinc-200 tabular-nums">{card.value}</span>
    </div>
  );
}

const CARD_RENDERERS: Record<CardKind, React.ComponentType<{ card: FloatingCard }>> = {
  chart: ChartCard,
  news: NewsCard,
  indicator: IndicatorCard,
  sector: SectorCard,
  metric: MetricCard,
};

// ── Floating card wrapper ──

function FloatingCardWrapper({ card }: { card: FloatingCard }) {
  const Renderer = CARD_RENDERERS[card.kind];

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${card.x}%`, top: `${card.y}%`, translate: '-50% -50%' }}
      initial={{ opacity: 0, scale: 0.6, filter: 'blur(6px)' }}
      animate={{ opacity: [0, 0.85, 0.85, 0.6], scale: [0.6, 1, 1, 0.9], filter: ['blur(6px)', 'blur(0px)', 'blur(0px)', 'blur(3px)'] }}
      exit={{ opacity: 0, scale: 0.4, filter: 'blur(8px)' }}
      transition={{ duration: card.duration * 0.9, ease: 'easeInOut' }}
    >
      <motion.div
        animate={{
          x: [0, card.dx, -card.dx * 0.5, card.dx * 0.3, 0],
          y: [0, card.dy, -card.dy * 0.3, card.dy * 0.5, 0],
        }}
        transition={{ duration: card.duration, delay: card.delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Renderer card={card} />
      </motion.div>
    </motion.div>
  );
}

// ── Center core ──

function CenterCore({ phase, phaseIndex }: { phase: typeof PHASES[number]; phaseIndex: number }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
      {/* Orbit rings */}
      <motion.div
        className="absolute w-44 h-44 rounded-full border border-emerald-500/[0.06]"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500/30" />
      </motion.div>
      <motion.div
        className="absolute w-32 h-32 rounded-full border border-emerald-500/[0.10]"
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500/40" />
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-violet-500/40" />
      </motion.div>

      {/* Pulse */}
      <div className="absolute w-24 h-24 rounded-full border border-emerald-500/[0.12] animate-ping" style={{ animationDuration: '2.5s' }} />
      <div className="absolute w-20 h-20 rounded-full border border-emerald-500/[0.18] animate-ping" style={{ animationDuration: '1.8s' }} />

      {/* Core */}
      <motion.div
        className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
        animate={{ boxShadow: ['0 0 20px rgba(16,185,129,0.15)', '0 0 40px rgba(16,185,129,0.3)', '0 0 20px rgba(16,185,129,0.15)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
          {phaseIndex + 1}/{PHASES.length}
        </span>
      </motion.div>

      {/* Phase label */}
      <div className="mt-4 text-center max-w-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseIndex}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          >
            <div className="text-sm font-semibold text-zinc-100">{phase.label}</div>
            <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{phase.description}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Data counter ──

function DataCounter({ phaseIndex }: { phaseIndex: number }) {
  const [counts, setCounts] = useState({ tickers: 0, indicators: 0, news: 0, signals: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCounts((prev) => ({
        tickers: Math.min(prev.tickers + Math.floor(Math.random() * 8 + 2), 500),
        indicators: Math.min(prev.indicators + Math.floor(Math.random() * 5 + 1), 350),
        news: Math.min(prev.news + Math.floor(Math.random() * 3 + 1), 200),
        signals: Math.min(prev.signals + Math.floor(Math.random() * 2 + 1), 50 + phaseIndex * 12),
      }));
    }, 800);
    return () => clearInterval(interval);
  }, [phaseIndex]);

  return (
    <div className="flex items-center gap-6 text-[10px] font-mono text-zinc-600">
      <span>Tickers <span className="text-zinc-400 tabular-nums">{counts.tickers}</span></span>
      <span>Indicators <span className="text-zinc-400 tabular-nums">{counts.indicators}</span></span>
      <span>News <span className="text-zinc-400 tabular-nums">{counts.news}</span></span>
      <span>Signals <span className="text-zinc-400 tabular-nums">{counts.signals}</span></span>
    </div>
  );
}

// ── Main ──

export default function StrategyLoadingCanvas() {
  const [cards, setCards] = useState<FloatingCard[]>([]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    setCards(generateBatch(MAX_VISIBLE));
  }, []);

  const cycleCards = useCallback(() => {
    setCards((prev) => {
      const newBatch = generateBatch(BATCH_SIZE);
      const remaining = prev.length >= MAX_VISIBLE ? prev.slice(BATCH_SIZE) : prev;
      return [...remaining, ...newBatch];
    });
  }, []);

  useEffect(() => {
    spawnRef.current = setInterval(cycleCards, SPAWN_INTERVAL_MS);
    return () => clearInterval(spawnRef.current);
  }, [cycleCards]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1 < PHASES.length ? prev + 1 : prev));
    }, PHASE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  const phase = PHASES[phaseIndex];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Status bar */}
      <div className="shrink-0 px-6 py-3 border-b border-zinc-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-400">AI Strategy Engine</span>
        </div>
        <DataCounter phaseIndex={phaseIndex} />
      </div>

      {/* Progress */}
      <div className="shrink-0 px-6 py-3">
        <div className="flex items-center gap-2">
          {PHASES.map((p, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div className={`h-1.5 rounded-full transition-all duration-700 ${
                i < phaseIndex ? 'bg-emerald-500' : i === phaseIndex ? 'bg-emerald-500/60 animate-pulse' : 'bg-zinc-800'
              }`} />
              <span className={`text-[8px] font-mono text-center transition-colors ${
                i <= phaseIndex ? 'text-zinc-500' : 'text-zinc-800'
              }`}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.03)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(139,92,246,0.03)_0%,transparent_50%)]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating data cards */}
        <AnimatePresence mode="popLayout">
          {cards.map((c) => (
            <FloatingCardWrapper key={c.id} card={c} />
          ))}
        </AnimatePresence>

        {/* Center core */}
        <CenterCore phase={phase} phaseIndex={phaseIndex} />

        {/* Scan lines */}
        <div className="absolute inset-x-0 h-px overflow-hidden pointer-events-none" style={{ top: '50%' }}>
          <div className="animate-live-sweep absolute h-full w-[40%] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </div>
        <div className="absolute inset-y-0 w-px overflow-hidden pointer-events-none" style={{ left: '50%' }}>
          <motion.div
            className="absolute w-full h-[30%] bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent"
            animate={{ top: ['-30%', '130%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
          />
        </div>

        {/* Corner accents */}
        <div className="absolute top-6 left-6 w-16 h-16 border-l border-t border-emerald-500/10 rounded-tl-xl" />
        <div className="absolute top-6 right-6 w-16 h-16 border-r border-t border-emerald-500/10 rounded-tr-xl" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-l border-b border-emerald-500/10 rounded-bl-xl" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-r border-b border-emerald-500/10 rounded-br-xl" />
      </div>
    </div>
  );
}
