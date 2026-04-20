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
  x: number;
  y: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
  ring: number;
}

// ── Data pools ──

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
  { label: '시장 데이터 수집', description: '실시간 주가·거래량·지수 데이터를 수집합니다', icon: '📡' },
  { label: '뉴스 감성 분석', description: '최신 뉴스의 투자 심리를 AI로 분석합니다', icon: '📰' },
  { label: '기술적 지표 계산', description: 'RSI·MACD·볼린저밴드 등 핵심 지표를 산출합니다', icon: '📊' },
  { label: '섹터 상관관계 분석', description: '업종별 괴리율과 회전 패턴을 분석합니다', icon: '🔗' },
  { label: 'AI 전략 수립', description: '모든 데이터를 종합하여 최적 전략을 도출합니다', icon: '🧠' },
] as const;

const PHASE_DURATION_MS = 12_000;
const SPAWN_INTERVAL_MS = 2_400;
const MAX_VISIBLE = 32;
const BATCH_SIZE = 5;

// ── Random generators ──

let particleCounter = 0;

function randomSentiment(): Sentiment {
  const r = Math.random();
  return r < 0.4 ? 'positive' : r < 0.7 ? 'negative' : 'neutral';
}

function randomPosition() {
  const angle = Math.random() * Math.PI * 2;
  const ring = Math.random() < 0.4 ? 0 : Math.random() < 0.7 ? 1 : 2;
  const radius = ring === 0 ? 15 + Math.random() * 10 : ring === 1 ? 28 + Math.random() * 10 : 40 + Math.random() * 8;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
    ring,
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
    ring: pos.ring,
    duration: 4 + Math.random() * 4,
    delay: Math.random() * 1.5,
    dx: Math.random() * 18 - 9,
    dy: Math.random() * 14 - 7,
  };

  if (kindRoll < 0.28) {
    const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
    const signal = SIGNALS[Math.floor(Math.random() * SIGNALS.length)];
    return { ...base, kind: 'ticker', label: ticker, detail: signal, sentiment: signal.includes('BUY') ? 'positive' : signal.includes('SELL') ? 'negative' : 'neutral' };
  }
  if (kindRoll < 0.48) {
    const gen = INDICATORS[Math.floor(Math.random() * INDICATORS.length)];
    return { ...base, kind: 'indicator', label: gen(), detail: TICKERS[Math.floor(Math.random() * TICKERS.length)], sentiment: randomSentiment() };
  }
  if (kindRoll < 0.65) {
    return { ...base, kind: 'news', label: NEWS_KEYWORDS[Math.floor(Math.random() * NEWS_KEYWORDS.length)], sentiment: randomSentiment() };
  }
  if (kindRoll < 0.78) {
    const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
    const pct = (Math.random() * 8 - 4).toFixed(1);
    return { ...base, kind: 'sector', label: sector, detail: `${Number(pct) >= 0 ? '+' : ''}${pct}%`, sentiment: Number(pct) > 0 ? 'positive' : Number(pct) < 0 ? 'negative' : 'neutral' };
  }
  if (kindRoll < 0.88) {
    return { ...base, kind: 'econ', label: ECON_EVENTS[Math.floor(Math.random() * ECON_EVENTS.length)], sentiment: randomSentiment() };
  }
  const gen = METRICS[Math.floor(Math.random() * METRICS.length)];
  return { ...base, kind: 'metric', label: gen(), detail: TICKERS[Math.floor(Math.random() * TICKERS.length)], sentiment: randomSentiment() };
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
      initial={{ opacity: 0, scale: 0.2, filter: 'blur(4px)' }}
      animate={{
        opacity: [0, 0.9, 0.9, 0.7],
        scale: [0.2, 1, 1, 0.8],
        filter: ['blur(4px)', 'blur(0px)', 'blur(0px)', 'blur(2px)'],
      }}
      exit={{ opacity: 0, scale: 0.3, x: '0%', y: '0%', filter: 'blur(6px)' }}
      transition={{ duration: particle.duration * 0.8, ease: 'easeInOut' }}
    >
      <motion.div
        className={`orbit-chip relative rounded-lg border px-2 py-1 bg-zinc-900/80 backdrop-blur-md shadow-md ${s.border} ${s.glow}`}
        animate={{
          x: [0, particle.dx, -particle.dx * 0.5, particle.dx * 0.3, 0],
          y: [0, particle.dy, -particle.dy * 0.3, particle.dy * 0.5, 0],
        }}
        transition={{
          duration: particle.duration,
          delay: particle.delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className={`text-[7px] font-mono font-bold ${tag.color}`}>{tag.label}</span>
          <span className={`text-[9px] font-mono font-bold whitespace-nowrap ${s.text}`}>
            {particle.label}
          </span>
        </div>
        {particle.detail && (
          <div className="text-[7px] font-mono text-zinc-600 whitespace-nowrap">
            {particle.detail}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function CenterCore({ phase, phaseIndex }: { phase: typeof PHASES[number]; phaseIndex: number }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
      {/* Animated orbit rings */}
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

      {/* Pulse rings */}
      <div className="absolute w-24 h-24 rounded-full border border-emerald-500/[0.12] animate-ping" style={{ animationDuration: '2.5s' }} />
      <div className="absolute w-20 h-20 rounded-full border border-emerald-500/[0.18] animate-ping" style={{ animationDuration: '1.8s' }} />

      {/* Core */}
      <motion.div
        className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
        animate={{
          boxShadow: [
            '0 0 20px rgba(16, 185, 129, 0.15)',
            '0 0 40px rgba(16, 185, 129, 0.3)',
            '0 0 20px rgba(16, 185, 129, 0.15)',
          ],
        }}
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
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="text-2xl mb-1">{phase.icon}</div>
            <div className="text-sm font-semibold text-zinc-100">
              {phase.label}
            </div>
            <div className="text-xs text-zinc-500 mt-1 leading-relaxed">
              {phase.description}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

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
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
        <span>종목 <span className="text-zinc-400 tabular-nums">{counts.tickers}</span></span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500/40" />
        <span>지표 <span className="text-zinc-400 tabular-nums">{counts.indicators}</span></span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500/40" />
        <span>뉴스 <span className="text-zinc-400 tabular-nums">{counts.news}</span></span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500/40" />
        <span>시그널 <span className="text-zinc-400 tabular-nums">{counts.signals}</span></span>
      </div>
    </div>
  );
}

// ── Main ──

export default function StrategyLoadingCanvas() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    setParticles(generateBatch(MAX_VISIBLE));
  }, []);

  const cycleParticles = useCallback(() => {
    setParticles((prev) => {
      const newBatch = generateBatch(BATCH_SIZE);
      const remaining = prev.length >= MAX_VISIBLE ? prev.slice(BATCH_SIZE) : prev;
      return [...remaining, ...newBatch];
    });
  }, []);

  useEffect(() => {
    spawnRef.current = setInterval(cycleParticles, SPAWN_INTERVAL_MS);
    return () => clearInterval(spawnRef.current);
  }, [cycleParticles]);

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
      <div className="shrink-0 px-6 py-3 border-b border-zinc-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-400">
            AI 전략 엔진 가동 중
          </span>
        </div>
        <DataCounter phaseIndex={phaseIndex} />
      </div>

      {/* Progress bar */}
      <div className="shrink-0 px-6 py-3">
        <div className="flex items-center gap-2">
          {PHASES.map((p, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  i < phaseIndex
                    ? 'bg-emerald-500'
                    : i === phaseIndex
                      ? 'bg-emerald-500/60 animate-pulse'
                      : 'bg-zinc-800'
                }`}
              />
              <span className={`text-[8px] font-mono text-center transition-colors ${
                i <= phaseIndex ? 'text-zinc-500' : 'text-zinc-800'
              }`}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.03)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(139,92,246,0.03)_0%,transparent_50%)]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
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

        {/* Corner accent lines */}
        <div className="absolute top-6 left-6 w-16 h-16 border-l border-t border-emerald-500/10 rounded-tl-xl" />
        <div className="absolute top-6 right-6 w-16 h-16 border-r border-t border-emerald-500/10 rounded-tr-xl" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-l border-b border-emerald-500/10 rounded-bl-xl" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-r border-b border-emerald-500/10 rounded-br-xl" />
      </div>
    </div>
  );
}
