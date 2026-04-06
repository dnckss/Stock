'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  StrategyData,
  PortfolioAgentStep,
  PortfolioStreamStatus,
} from '@/types/dashboard';

// ── Particle types ──

type ParticleKind = 'ticker' | 'news' | 'indicator' | 'sector' | 'econ' | 'signal';

interface DataParticle {
  id: string;
  kind: ParticleKind;
  label: string;
  detail?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// ── Layout helpers ──

/** 시드 기반 의사 난수 (결정적 — 리렌더 시 위치 안정) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** 파티클을 타원 궤도 위에 배치 */
function getOrbitPosition(
  index: number,
  total: number,
  ring: number,
  seed: number,
) {
  const angle = (index / total) * Math.PI * 2 + seededRandom(seed) * 0.6;
  const radiusX = 28 + ring * 14;
  const radiusY = 22 + ring * 11;
  const jitter = seededRandom(seed + index) * 6 - 3;
  return {
    x: 50 + Math.cos(angle) * (radiusX + jitter),
    y: 50 + Math.sin(angle) * (radiusY + jitter),
  };
}

// ── Extract particles from real strategy data ──

function extractParticles(data: StrategyData): DataParticle[] {
  const particles: DataParticle[] = [];

  // Market regime
  if (data.marketRegime) {
    particles.push({
      id: 'regime',
      kind: 'signal',
      label: data.marketRegime.toUpperCase(),
      detail: 'REGIME',
      sentiment: data.marketRegime === 'bull' ? 'positive' : data.marketRegime === 'bear' ? 'negative' : 'neutral',
    });
  }

  // Fear & Greed
  if (data.fearGreed != null) {
    particles.push({
      id: 'fear-greed',
      kind: 'signal',
      label: `F&G ${data.fearGreed}`,
      sentiment: data.fearGreed >= 55 ? 'positive' : data.fearGreed <= 40 ? 'negative' : 'neutral',
    });
  }

  // Ticker + technical indicators from recommendations
  for (const rec of data.recommendations) {
    particles.push({
      id: `ticker-${rec.ticker}`,
      kind: 'ticker',
      label: rec.ticker,
      detail: rec.direction,
      sentiment: rec.direction === 'BUY' ? 'positive' : rec.direction === 'SELL' ? 'negative' : 'neutral',
    });

    if (rec.technicalIndicators?.rsi != null) {
      particles.push({
        id: `rsi-${rec.ticker}`,
        kind: 'indicator',
        label: `RSI ${rec.technicalIndicators.rsi.toFixed(0)}`,
        detail: rec.ticker,
        sentiment: rec.technicalIndicators.rsi > 70 ? 'negative' : rec.technicalIndicators.rsi < 30 ? 'positive' : 'neutral',
      });
    }

    if (rec.technicalIndicators?.macdSignal && rec.technicalIndicators.macdSignal !== 'neutral') {
      particles.push({
        id: `macd-${rec.ticker}`,
        kind: 'indicator',
        label: `MACD ${rec.technicalIndicators.macdSignal.toUpperCase()}`,
        detail: rec.ticker,
        sentiment: rec.technicalIndicators.macdSignal === 'bullish' ? 'positive' : 'negative',
      });
    }
  }

  // News themes
  for (const theme of data.newsThemes.slice(0, 4)) {
    particles.push({
      id: `news-${theme.theme}`,
      kind: 'news',
      label: theme.theme.length > 18 ? theme.theme.slice(0, 16) + '..' : theme.theme,
      detail: theme.tickers.join(', '),
      sentiment: theme.sentiment,
    });
  }

  // Sectors
  for (const sector of data.sectors.slice(0, 5)) {
    particles.push({
      id: `sector-${sector.sector}`,
      kind: 'sector',
      label: sector.sector,
      detail: `${sector.divergence > 0 ? '+' : ''}${(sector.divergence * 100).toFixed(0)}%`,
      sentiment: sector.divergence > 0.02 ? 'positive' : sector.divergence < -0.02 ? 'negative' : 'neutral',
    });
  }

  // Economic events
  if (data.econAnalysis) {
    for (const surprise of data.econAnalysis.recentSurprises.slice(0, 2)) {
      particles.push({
        id: `econ-${surprise.event}`,
        kind: 'econ',
        label: surprise.event.length > 16 ? surprise.event.slice(0, 14) + '..' : surprise.event,
        detail: surprise.actual ?? undefined,
        sentiment: surprise.impact,
      });
    }
    for (const risk of data.econAnalysis.upcomingRisks.slice(0, 2)) {
      particles.push({
        id: `risk-${risk.event}`,
        kind: 'econ',
        label: risk.event.length > 16 ? risk.event.slice(0, 14) + '..' : risk.event,
        detail: risk.riskLevel,
        sentiment: risk.riskLevel === 'high' ? 'negative' : 'neutral',
      });
    }
  }

  return particles;
}

// ── Sentiment → color ──

const SENTIMENT_COLORS: Record<string, { border: string; text: string; glow: string }> = {
  positive: { border: 'border-green-500/40', text: 'text-green-400', glow: 'shadow-green-500/20' },
  negative: { border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20' },
  neutral: { border: 'border-zinc-600/40', text: 'text-zinc-400', glow: 'shadow-zinc-500/10' },
};

const KIND_TAG: Record<ParticleKind, { label: string; color: string } | null> = {
  ticker: null,
  news: { label: 'NEWS', color: 'text-blue-500' },
  indicator: { label: 'TA', color: 'text-yellow-500' },
  sector: { label: 'SEC', color: 'text-violet-500' },
  econ: { label: 'ECON', color: 'text-orange-400' },
  signal: { label: 'SIG', color: 'text-cyan-400' },
};

// ── Particle Chip ──

function ParticleChip({
  particle,
  x,
  y,
  index,
  isAbsorbing,
}: {
  particle: DataParticle;
  x: number;
  y: number;
  index: number;
  isAbsorbing: boolean;
}) {
  const colors = SENTIMENT_COLORS[particle.sentiment] ?? SENTIMENT_COLORS.neutral;
  const tag = KIND_TAG[particle.kind];

  // Per-particle animation values (deterministic from index)
  const floatDuration = 6 + (index % 5) * 1.2;
  const floatDelay = (index % 7) * 0.4;
  const dx = seededRandom(index * 3) * 16 - 8;
  const dy = seededRandom(index * 7) * 12 - 6;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, translate: '-50% -50%' }}
      initial={{ opacity: 0, scale: 0 }}
      animate={
        isAbsorbing
          ? { opacity: 0, scale: 0.3, left: '50%', top: '50%' }
          : { opacity: 1, scale: 1 }
      }
      exit={{ opacity: 0, scale: 0 }}
      transition={
        isAbsorbing
          ? { duration: 0.8, ease: 'easeIn' }
          : { duration: 0.5, delay: index * 0.04 }
      }
    >
      <div
        className={`
          orbit-chip relative rounded-md border px-2 py-1
          bg-zinc-900/80 backdrop-blur-sm shadow-md
          ${colors.border} ${colors.glow}
        `}
        style={{
          ['--duration' as string]: `${floatDuration}s`,
          ['--delay' as string]: `${floatDelay}s`,
          ['--dx' as string]: `${dx}px`,
          ['--dy' as string]: `${dy}px`,
        }}
      >
        <div className="flex items-center gap-1.5">
          {tag && (
            <span className={`text-[7px] font-mono font-bold ${tag.color} opacity-60`}>
              {tag.label}
            </span>
          )}
          <span className={`text-[9px] font-mono font-bold whitespace-nowrap ${colors.text}`}>
            {particle.label}
          </span>
        </div>
        {particle.detail && (
          <div className="text-[7px] font-mono text-zinc-600 whitespace-nowrap mt-px">
            {particle.detail}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Center Nucleus ──

function CenterNucleus({
  currentAgent,
  currentStep,
  totalSteps,
  status,
}: {
  currentAgent: PortfolioAgentStep | null;
  currentStep: number;
  totalSteps: number;
  status: PortfolioStreamStatus;
}) {
  const isActive = status === 'streaming' || status === 'connecting';

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
      {/* Outer ring pulse */}
      {isActive && (
        <>
          <div className="absolute w-28 h-28 rounded-full border border-green-500/10 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-20 h-20 rounded-full border border-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        </>
      )}

      {/* Core circle */}
      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center
        border-2 transition-colors duration-500
        ${isActive ? 'border-green-500/60 bg-green-500/10 shadow-lg shadow-green-500/20' : 'border-zinc-700 bg-zinc-900'}
      `}>
        <div className="text-center">
          <div className={`text-base font-mono font-bold tabular-nums ${isActive ? 'text-green-400' : 'text-zinc-500'}`}>
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      {/* Agent label */}
      <div className="mt-3 text-center max-w-[200px]">
        <div className="text-[10px] font-mono font-semibold text-zinc-300">
          {currentAgent?.title ?? (status === 'connecting' ? 'Connecting...' : 'Preparing...')}
        </div>
        {currentAgent?.description && (
          <div className="text-[8px] font-mono text-zinc-600 mt-0.5 line-clamp-2">
            {currentAgent.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Connection Lines (SVG) ──

function ConnectionLines({
  particles,
  positions,
  currentStep,
}: {
  particles: DataParticle[];
  positions: { x: number; y: number }[];
  currentStep: number;
}) {
  // Show lines from center to a subset of particles, rotating with step
  const lineCount = Math.min(6, particles.length);
  const offset = ((currentStep - 1) * 3) % particles.length;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
      <defs>
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(34 197 94)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(34 197 94)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: lineCount }, (_, i) => {
        const idx = (offset + i) % particles.length;
        const pos = positions[idx];
        if (!pos) return null;
        return (
          <line
            key={`line-${idx}-${currentStep}`}
            x1="50%"
            y1="50%"
            x2={`${pos.x}%`}
            y2={`${pos.y}%`}
            stroke="url(#line-grad)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
            className="animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        );
      })}
    </svg>
  );
}

// ── Main Component ──

interface DataOrbitCanvasProps {
  data: StrategyData;
  currentStep: number;
  totalSteps: number;
  currentAgent: PortfolioAgentStep | null;
  status: PortfolioStreamStatus;
}

export default function DataOrbitCanvas({
  data,
  currentStep,
  totalSteps,
  currentAgent,
  status,
}: DataOrbitCanvasProps) {
  const particles = useMemo(() => extractParticles(data), [data]);

  // Assign ring: tickers inner (0), indicators middle (1), news/sector/econ/signal outer (2)
  const ringMap: Record<ParticleKind, number> = {
    ticker: 0,
    indicator: 1,
    signal: 1,
    sector: 2,
    news: 2,
    econ: 2,
  };

  // Group by ring and compute positions
  const positions = useMemo(() => {
    const rings: Record<number, number[]> = { 0: [], 1: [], 2: [] };
    particles.forEach((p, i) => {
      const ring = ringMap[p.kind] ?? 2;
      rings[ring].push(i);
    });

    const result: { x: number; y: number }[] = new Array(particles.length);
    for (const [ring, indices] of Object.entries(rings)) {
      indices.forEach((globalIdx, localIdx) => {
        result[globalIdx] = getOrbitPosition(
          localIdx,
          indices.length,
          Number(ring),
          globalIdx,
        );
      });
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particles]);

  // Particles "absorbed" by current step — a few per step get pulled to center
  const absorbedSet = useMemo(() => {
    if (currentStep <= 0) return new Set<number>();
    const perStep = Math.ceil(particles.length / totalSteps);
    const start = (currentStep - 1) * perStep;
    const indices = new Set<number>();
    for (let i = start; i < start + perStep && i < particles.length; i++) {
      indices.add(i);
    }
    return indices;
  }, [currentStep, totalSteps, particles.length]);

  return (
    <div className="relative w-full h-[340px] overflow-hidden rounded-xl border border-zinc-800/50 bg-[#070707]">
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.03)_0%,transparent_70%)]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Connection lines */}
      <ConnectionLines
        particles={particles}
        positions={positions}
        currentStep={currentStep}
      />

      {/* Data particles */}
      <AnimatePresence>
        {particles.map((particle, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const absorbed = absorbedSet.has(i);
          return (
            <ParticleChip
              key={particle.id}
              particle={particle}
              x={pos.x}
              y={pos.y}
              index={i}
              isAbsorbing={absorbed}
            />
          );
        })}
      </AnimatePresence>

      {/* Center nucleus */}
      <CenterNucleus
        currentAgent={currentAgent}
        currentStep={currentStep}
        totalSteps={totalSteps}
        status={status}
      />

      {/* Scan line */}
      <div className="absolute inset-x-0 h-px overflow-hidden pointer-events-none" style={{ top: '50%' }}>
        <div className="animate-live-sweep absolute h-full w-[40%] bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
      </div>
    </div>
  );
}
