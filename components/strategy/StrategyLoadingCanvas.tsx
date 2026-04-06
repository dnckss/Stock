'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLatest } from '@/lib/api';
import type {
  ApiStockItem,
  ApiNewsFeedItem,
  ApiMacroItem,
} from '@/types/dashboard';

// ── Particle model ──

type ParticleKind = 'ticker' | 'news' | 'macro' | 'signal';
type Sentiment = 'positive' | 'negative' | 'neutral';

interface DataParticle {
  id: string;
  kind: ParticleKind;
  label: string;
  detail?: string;
  sentiment: Sentiment;
}

// ── Phase config ──

const PHASES = [
  { label: '시장 데이터 수집', description: '실시간 주가·거래량·지수 데이터를 수집합니다' },
  { label: '뉴스 감성 분석', description: '최신 뉴스의 투자 심리를 AI로 분석합니다' },
  { label: '기술적 지표 계산', description: 'RSI·MACD·볼린저밴드 등 핵심 지표를 산출합니다' },
  { label: '섹터 상관관계 분석', description: '업종별 괴리율과 회전 패턴을 분석합니다' },
  { label: 'AI 전략 수립', description: '모든 데이터를 종합하여 최적 전략을 도출합니다' },
] as const;

const PHASE_DURATION_MS = 12_000;

// ── Helpers ──

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getOrbitPosition(index: number, total: number, ring: number, seed: number) {
  const angle = (index / total) * Math.PI * 2 + seededRandom(seed) * 0.5;
  const rx = 26 + ring * 13;
  const ry = 20 + ring * 10;
  const jitter = seededRandom(seed + index) * 5 - 2.5;
  return {
    x: 50 + Math.cos(angle) * (rx + jitter),
    y: 50 + Math.sin(angle) * (ry + jitter),
  };
}

// ── Extract particles from /api/latest data ──

function extractParticles(
  stocks: ApiStockItem[],
  news: ApiNewsFeedItem[],
  macroItems: ApiMacroItem[],
): DataParticle[] {
  const particles: DataParticle[] = [];

  // Tickers (inner ring)
  for (const s of stocks.slice(0, 8)) {
    particles.push({
      id: `t-${s.ticker}`,
      kind: 'ticker',
      label: s.ticker,
      detail: s.signal,
      sentiment: s.signal === 'BUY' ? 'positive' : s.signal === 'SELL' ? 'negative' : 'neutral',
    });
  }

  // Macro indicators (middle ring)
  for (const m of macroItems.slice(0, 6)) {
    const name = String(m.name ?? '');
    particles.push({
      id: `m-${name}`,
      kind: 'macro',
      label: name.length > 14 ? name.slice(0, 12) + '..' : name,
      detail: m.pct > 0 ? `+${(m.pct * 100).toFixed(1)}%` : `${(m.pct * 100).toFixed(1)}%`,
      sentiment: m.pct > 0 ? 'positive' : m.pct < 0 ? 'negative' : 'neutral',
    });
  }

  // News (outer ring)
  for (const n of news.slice(0, 6)) {
    const title = n.title.length > 20 ? n.title.slice(0, 18) + '..' : n.title;
    particles.push({
      id: `n-${n.ticker}-${n.timestamp}`,
      kind: 'news',
      label: title,
      detail: n.ticker,
      sentiment: n.sentiment_label === 'positive' ? 'positive' : n.sentiment_label === 'negative' ? 'negative' : 'neutral',
    });
  }

  return particles;
}

// ── Style maps ──

const SENTIMENT_STYLES: Record<Sentiment, { border: string; text: string; glow: string }> = {
  positive: { border: 'border-green-500/30', text: 'text-green-400', glow: 'shadow-green-500/15' },
  negative: { border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/15' },
  neutral: { border: 'border-zinc-600/30', text: 'text-zinc-400', glow: 'shadow-zinc-500/10' },
};

const KIND_TAG: Record<ParticleKind, { label: string; color: string } | null> = {
  ticker: null,
  news: { label: 'NEWS', color: 'text-blue-500/60' },
  macro: { label: 'MACRO', color: 'text-violet-400/60' },
  signal: { label: 'SIG', color: 'text-cyan-400/60' },
};

// ── Sub-components ──

function ParticleChip({
  particle,
  x,
  y,
  index,
  absorbed,
}: {
  particle: DataParticle;
  x: number;
  y: number;
  index: number;
  absorbed: boolean;
}) {
  const s = SENTIMENT_STYLES[particle.sentiment] ?? SENTIMENT_STYLES.neutral;
  const tag = KIND_TAG[particle.kind];
  const dur = 6 + (index % 5) * 1.2;
  const delay = (index % 7) * 0.4;
  const dx = seededRandom(index * 3) * 16 - 8;
  const dy = seededRandom(index * 7) * 12 - 6;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, translate: '-50% -50%' }}
      initial={{ opacity: 0, scale: 0 }}
      animate={
        absorbed
          ? { opacity: 0, scale: 0.2, left: '50%', top: '50%' }
          : { opacity: 1, scale: 1 }
      }
      transition={
        absorbed
          ? { duration: 1, ease: 'easeIn' }
          : { duration: 0.6, delay: index * 0.06 }
      }
    >
      <div
        className={`orbit-chip relative rounded-md border px-2 py-1 bg-zinc-900/80 backdrop-blur-sm shadow-md ${s.border} ${s.glow}`}
        style={{
          ['--duration' as string]: `${dur}s`,
          ['--delay' as string]: `${delay}s`,
          ['--dx' as string]: `${dx}px`,
          ['--dy' as string]: `${dy}px`,
        }}
      >
        <div className="flex items-center gap-1.5">
          {tag && (
            <span className={`text-[7px] font-mono font-bold ${tag.color}`}>{tag.label}</span>
          )}
          <span className={`text-[9px] font-mono font-bold whitespace-nowrap ${s.text}`}>
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

function CenterCore({ phase, phaseIndex }: { phase: typeof PHASES[number]; phaseIndex: number }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
      {/* Pulse rings */}
      <div className="absolute w-32 h-32 rounded-full border border-green-500/10 animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute w-24 h-24 rounded-full border border-green-500/15 animate-ping" style={{ animationDuration: '2.2s' }} />
      <div className="absolute w-16 h-16 rounded-full border border-green-500/20 animate-ping" style={{ animationDuration: '1.6s' }} />

      {/* Core */}
      <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20">
        <span className="text-[9px] font-mono font-bold text-green-400 tabular-nums">
          {phaseIndex + 1}/{PHASES.length}
        </span>
      </div>

      {/* Phase label */}
      <div className="mt-3 text-center max-w-[220px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
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

function ConnectionLines({
  positions,
  phaseIndex,
  total,
}: {
  positions: { x: number; y: number }[];
  phaseIndex: number;
  total: number;
}) {
  const lineCount = Math.min(5, total);
  const offset = (phaseIndex * 4) % total;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sl-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(34 197 94)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(34 197 94)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: lineCount }, (_, i) => {
        const idx = (offset + i) % total;
        const pos = positions[idx];
        if (!pos) return null;
        return (
          <line
            key={`${idx}-${phaseIndex}`}
            x1="50%"
            y1="50%"
            x2={`${pos.x}%`}
            y2={`${pos.y}%`}
            stroke="url(#sl-grad)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
            className="animate-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        );
      })}
    </svg>
  );
}

// ── Main ──

export default function StrategyLoadingCanvas() {
  const [particles, setParticles] = useState<DataParticle[]>([]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [absorbed, setAbsorbed] = useState<Set<number>>(new Set());
  const mountedRef = useRef(true);

  // Fetch lightweight market data for particles
  useEffect(() => {
    mountedRef.current = true;
    let ignore = false;

    fetchLatest()
      .then((res) => {
        if (ignore) return;
        const stocks = [...(res.top_picks ?? []), ...(res.radar ?? [])];
        const news = res.news_feed ?? [];
        const macroItems = [
          ...(res.macro?.indices ?? []),
          ...(res.macro?.sidebar ?? []),
        ];
        setParticles(extractParticles(stocks, news, macroItems));
      })
      .catch(() => {
        // 데이터 없이도 phase 애니메이션은 동작
      });

    return () => {
      ignore = true;
      mountedRef.current = false;
    };
  }, []);

  // Phase rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => {
        const next = prev + 1;
        return next < PHASES.length ? next : prev; // 마지막 단계에서 멈춤
      });
    }, PHASE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  // Absorb particles as phases progress
  useEffect(() => {
    if (particles.length === 0) return;
    const perPhase = Math.ceil(particles.length / PHASES.length);
    const start = phaseIndex * perPhase;
    const newSet = new Set<number>();
    for (let i = 0; i < start + perPhase && i < particles.length; i++) {
      if (i < start) newSet.add(i); // 이전 단계 파티클은 흡수됨
    }
    setAbsorbed(newSet);
  }, [phaseIndex, particles.length]);

  // Ring assignment
  const ringMap: Record<ParticleKind, number> = {
    ticker: 0,
    signal: 0,
    macro: 1,
    news: 2,
  };

  const positions = useMemo(() => {
    const rings: Record<number, number[]> = { 0: [], 1: [], 2: [] };
    particles.forEach((p, i) => {
      const ring = ringMap[p.kind] ?? 2;
      rings[ring].push(i);
    });
    const result: { x: number; y: number }[] = new Array(particles.length);
    for (const [ring, indices] of Object.entries(rings)) {
      indices.forEach((globalIdx, localIdx) => {
        result[globalIdx] = getOrbitPosition(localIdx, indices.length, Number(ring), globalIdx);
      });
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particles]);

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

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Connection lines */}
        {particles.length > 0 && (
          <ConnectionLines
            positions={positions}
            phaseIndex={phaseIndex}
            total={particles.length}
          />
        )}

        {/* Data particles */}
        <AnimatePresence>
          {particles.map((p, i) => {
            const pos = positions[i];
            if (!pos) return null;
            return (
              <ParticleChip
                key={p.id}
                particle={p}
                x={pos.x}
                y={pos.y}
                index={i}
                absorbed={absorbed.has(i)}
              />
            );
          })}
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
