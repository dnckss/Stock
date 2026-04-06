'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Particle model ──

type ParticleKind = 'ticker' | 'indicator' | 'news' | 'sector' | 'econ' | 'metric';
type Sentiment = 'positive' | 'negative' | 'neutral';

interface Particle {
  id: string;
  kind: ParticleKind;
  label: string;
  detail?: string;
  sentiment: Sentiment;
  /** 0-100 percent position */
  x: number;
  y: number;
  /** animation parameters */
  duration: number;
  delay: number;
  dx: number;
  dy: number;
}

// ── Data pools (realistic random values) ──

const TICKERS = [
  'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD', 'AVGO', 'NFLX',
  'CRM', 'ORCL', 'ADBE', 'INTC', 'QCOM', 'MU', 'MRVL', 'PANW', 'SNOW', 'PLTR',
  'JPM', 'BAC', 'GS', 'V', 'MA', 'BRK.B', 'UNH', 'JNJ', 'PFE', 'LLY',
  'XOM', 'CVX', 'WMT', 'HD', 'PG', 'KO', 'PEP', 'COST', 'DIS', 'SBUX',
  'BA', 'CAT', 'GE', 'DE', 'RTX', 'LMT', 'COIN', 'SQ', 'SHOP', 'UBER',
];

const SIGNALS = ['BUY', 'SELL', 'HOLD', 'STRONG BUY', 'STRONG SELL'] as const;

const INDICATORS = [
  () => `RSI ${(Math.random() * 60 + 20).toFixed(0)}`,
  () => `MACD ${Math.random() > 0.5 ? 'Bullish' : 'Bearish'}`,
  () => `BB ${(Math.random() * 100).toFixed(0)}%`,
  () => `SMA ${[20, 50, 100, 200][Math.floor(Math.random() * 4)]}`,
  () => `EMA Cross ${Math.random() > 0.5 ? '↑' : '↓'}`,
  () => `Vol ${(Math.random() * 200 + 50).toFixed(0)}%`,
  () => `ATR ${(Math.random() * 5 + 0.5).toFixed(2)}`,
  () => `ADX ${(Math.random() * 50 + 10).toFixed(0)}`,
  () => `Stoch ${(Math.random() * 80 + 10).toFixed(0)}`,
  () => `OBV ${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 15 + 1).toFixed(1)}M`,
];

const NEWS_KEYWORDS = [
  'AI 반도체 수요 급증', '연준 금리 동결 시사', 'CPI 예상 하회',
  '빅테크 실적 서프라이즈', '원유 재고 감소', 'GDP 성장률 상향',
  '글로벌 공급망 회복', '중국 경기 부양책', '달러 약세 전환',
  '국채 금리 하락', '고용 지표 호조', '소비자 신뢰 반등',
  '테크 섹터 밸류에이션', 'EV 판매 신기록', '바이오 FDA 승인',
  '반도체 재고 조정 마무리', '유럽 PMI 개선', '엔화 급등',
  '크립토 ETF 승인', '방산 예산 확대', '클라우드 매출 급증',
  '리쇼어링 투자 가속', '배당 성장주 주목', '인플레 둔화 확인',
];

const SECTORS = [
  'Technology', 'Healthcare', 'Financials', 'Energy', 'Consumer',
  'Industrials', 'Materials', 'Real Estate', 'Utilities', 'Communication',
];

const ECON_EVENTS = [
  'FOMC 회의', 'CPI 발표', 'PCE 물가', 'Non-Farm Payrolls',
  'ISM 제조업', 'PMI 서비스', 'GDP 성장률', 'PPI 지수',
  'Consumer Confidence', '소매 판매', '산업 생산', '무역 수지',
];

const METRICS = [
  () => `P/E ${(Math.random() * 30 + 5).toFixed(1)}`,
  () => `EPS $${(Math.random() * 10 + 0.5).toFixed(2)}`,
  () => `Beta ${(Math.random() * 1.5 + 0.3).toFixed(2)}`,
  () => `Div ${(Math.random() * 4).toFixed(1)}%`,
  () => `MC $${(Math.random() * 2000 + 10).toFixed(0)}B`,
  () => `52W ${Math.random() > 0.5 ? 'High' : 'Low'}`,
  () => `Margin ${(Math.random() * 30 + 5).toFixed(1)}%`,
  () => `ROE ${(Math.random() * 25 + 2).toFixed(1)}%`,
];

// ── Phase config ──

const PHASES = [
  { label: '시장 데이터 수집', description: '실시간 주가·거래량·지수 데이터를 수집합니다' },
  { label: '뉴스 감성 분석', description: '최신 뉴스의 투자 심리를 AI로 분석합니다' },
  { label: '기술적 지표 계산', description: 'RSI·MACD·볼린저밴드 등 핵심 지표를 산출합니다' },
  { label: '섹터 상관관계 분석', description: '업종별 괴리율과 회전 패턴을 분석합니다' },
  { label: 'AI 전략 수립', description: '모든 데이터를 종합하여 최적 전략을 도출합니다' },
] as const;

const PHASE_DURATION_MS = 12_000;
/** 새 파티클 배치가 추가되는 주기 */
const SPAWN_INTERVAL_MS = 2_800;
/** 화면에 동시에 보이는 최대 파티클 수 */
const MAX_VISIBLE = 28;
/** 한 번에 생성되는 파티클 수 */
const BATCH_SIZE = 4;

// ── Random particle generator ──

let particleCounter = 0;

function randomSentiment(): Sentiment {
  const r = Math.random();
  return r < 0.4 ? 'positive' : r < 0.7 ? 'negative' : 'neutral';
}

function randomPosition() {
  // 가장자리 ~ 중간 영역에 분포 (중앙 코어 영역 회피)
  const angle = Math.random() * Math.PI * 2;
  const radius = 22 + Math.random() * 26; // 22~48% from center
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

function generateParticle(): Particle {
  const id = `p-${++particleCounter}-${Date.now()}`;
  const kindRoll = Math.random();
  const pos = randomPosition();
  const base = {
    id,
    x: pos.x,
    y: pos.y,
    duration: 5 + Math.random() * 5,
    delay: Math.random() * 2,
    dx: Math.random() * 20 - 10,
    dy: Math.random() * 16 - 8,
  };

  if (kindRoll < 0.28) {
    // Ticker + signal
    const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
    const signal = SIGNALS[Math.floor(Math.random() * SIGNALS.length)];
    return {
      ...base,
      kind: 'ticker',
      label: ticker,
      detail: signal,
      sentiment: signal.includes('BUY') ? 'positive' : signal.includes('SELL') ? 'negative' : 'neutral',
    };
  }
  if (kindRoll < 0.48) {
    // Technical indicator
    const gen = INDICATORS[Math.floor(Math.random() * INDICATORS.length)];
    return {
      ...base,
      kind: 'indicator',
      label: gen(),
      detail: TICKERS[Math.floor(Math.random() * TICKERS.length)],
      sentiment: randomSentiment(),
    };
  }
  if (kindRoll < 0.65) {
    // News
    const headline = NEWS_KEYWORDS[Math.floor(Math.random() * NEWS_KEYWORDS.length)];
    return {
      ...base,
      kind: 'news',
      label: headline,
      sentiment: randomSentiment(),
    };
  }
  if (kindRoll < 0.78) {
    // Sector
    const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
    const pct = (Math.random() * 8 - 4).toFixed(1);
    return {
      ...base,
      kind: 'sector',
      label: sector,
      detail: `${Number(pct) >= 0 ? '+' : ''}${pct}%`,
      sentiment: Number(pct) > 0 ? 'positive' : Number(pct) < 0 ? 'negative' : 'neutral',
    };
  }
  if (kindRoll < 0.88) {
    // Econ event
    const event = ECON_EVENTS[Math.floor(Math.random() * ECON_EVENTS.length)];
    return {
      ...base,
      kind: 'econ',
      label: event,
      sentiment: randomSentiment(),
    };
  }
  // Metric
  const gen = METRICS[Math.floor(Math.random() * METRICS.length)];
  return {
    ...base,
    kind: 'metric',
    label: gen(),
    detail: TICKERS[Math.floor(Math.random() * TICKERS.length)],
    sentiment: randomSentiment(),
  };
}

function generateBatch(count: number): Particle[] {
  return Array.from({ length: count }, () => generateParticle());
}

// ── Style maps ──

const SENTIMENT_STYLES: Record<Sentiment, { border: string; text: string; glow: string }> = {
  positive: { border: 'border-green-500/25', text: 'text-green-400', glow: 'shadow-green-500/10' },
  negative: { border: 'border-red-500/25', text: 'text-red-400', glow: 'shadow-red-500/10' },
  neutral: { border: 'border-zinc-600/25', text: 'text-zinc-400', glow: '' },
};

const KIND_TAG: Record<ParticleKind, { label: string; color: string }> = {
  ticker: { label: 'STOCK', color: 'text-emerald-500/50' },
  indicator: { label: 'TA', color: 'text-yellow-500/50' },
  news: { label: 'NEWS', color: 'text-blue-400/50' },
  sector: { label: 'SECTOR', color: 'text-violet-400/50' },
  econ: { label: 'ECON', color: 'text-orange-400/50' },
  metric: { label: 'METRIC', color: 'text-cyan-400/50' },
};

// ── Sub-components ──

function ParticleChip({ particle }: { particle: Particle }) {
  const s = SENTIMENT_STYLES[particle.sentiment] ?? SENTIMENT_STYLES.neutral;
  const tag = KIND_TAG[particle.kind];

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${particle.x}%`, top: `${particle.y}%`, translate: '-50% -50%' }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.9, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4, left: '50%', top: '50%' }}
      transition={{ duration: 0.7 }}
    >
      <div
        className={`orbit-chip relative rounded border px-1.5 py-0.5 bg-zinc-900/70 backdrop-blur-sm shadow-sm ${s.border} ${s.glow}`}
        style={{
          ['--duration' as string]: `${particle.duration}s`,
          ['--delay' as string]: `${particle.delay}s`,
          ['--dx' as string]: `${particle.dx}px`,
          ['--dy' as string]: `${particle.dy}px`,
        }}
      >
        <div className="flex items-center gap-1">
          <span className={`text-[6px] font-mono font-bold ${tag.color}`}>{tag.label}</span>
          <span className={`text-[8px] font-mono font-bold whitespace-nowrap ${s.text}`}>
            {particle.label}
          </span>
        </div>
        {particle.detail && (
          <div className="text-[6px] font-mono text-zinc-600 whitespace-nowrap">
            {particle.detail}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CenterCore({ phase, phaseIndex }: { phase: typeof PHASES[number]; phaseIndex: number }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
      {/* Pulse rings */}
      <div className="absolute w-36 h-36 rounded-full border border-green-500/[0.06] animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute w-28 h-28 rounded-full border border-green-500/[0.10] animate-ping" style={{ animationDuration: '2.2s' }} />
      <div className="absolute w-20 h-20 rounded-full border border-green-500/[0.15] animate-ping" style={{ animationDuration: '1.5s' }} />

      {/* Core */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-green-500/40 bg-green-500/10 shadow-lg shadow-green-500/20">
        <span className="text-[10px] font-mono font-bold text-green-400 tabular-nums">
          {phaseIndex + 1}/{PHASES.length}
        </span>
      </div>

      {/* Phase label */}
      <div className="mt-3 text-center max-w-[240px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <div className="text-[11px] font-mono font-semibold text-zinc-200">
              {phase.label}
            </div>
            <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
              {phase.description}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main ──

export default function StrategyLoadingCanvas() {
  const [particles, setParticles] = useState<Particle[]>(() => generateBatch(MAX_VISIBLE));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // 주기적으로 새 파티클 추가 & 오래된 것 제거
  const cycleParticles = useCallback(() => {
    setParticles((prev) => {
      const newBatch = generateBatch(BATCH_SIZE);
      const remaining = prev.length >= MAX_VISIBLE
        ? prev.slice(BATCH_SIZE)
        : prev;
      return [...remaining, ...newBatch];
    });
  }, []);

  useEffect(() => {
    spawnRef.current = setInterval(cycleParticles, SPAWN_INTERVAL_MS);
    return () => clearInterval(spawnRef.current);
  }, [cycleParticles]);

  // Phase rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1 < PHASES.length ? prev + 1 : prev));
    }, PHASE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  const phase = PHASES[phaseIndex];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top status bar */}
      <div className="shrink-0 px-4 py-2.5 border-b border-zinc-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[10px] font-mono text-green-500 font-medium">
            AI 전략 엔진 가동 중
          </span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600 tabular-nums">
          PHASE {phaseIndex + 1}/{PHASES.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 px-4 py-2">
        <div className="flex items-center gap-1">
          {PHASES.map((_, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-1 rounded-full transition-all duration-700 ${
                  i < phaseIndex
                    ? 'bg-green-500'
                    : i === phaseIndex
                      ? 'bg-green-500/60 animate-pulse'
                      : 'bg-zinc-800'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Radial bg */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.04)_0%,transparent_65%)]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Particles */}
        <AnimatePresence mode="popLayout">
          {particles.map((p) => (
            <ParticleChip key={p.id} particle={p} />
          ))}
        </AnimatePresence>

        {/* Center core */}
        <CenterCore phase={phase} phaseIndex={phaseIndex} />

        {/* Scan line */}
        <div className="absolute inset-x-0 h-px overflow-hidden pointer-events-none" style={{ top: '50%' }}>
          <div className="animate-live-sweep absolute h-full w-[40%] bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
