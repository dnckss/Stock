import { TrendingDown, TrendingUp, Zap } from 'lucide-react';
import type { SignalData } from '@/types/dashboard';
import { SIGNAL_CONFIG } from '@/lib/constants';
import SignalBadge from './SignalBadge';

interface HeroSignalProps {
  data: SignalData;
}

export default function HeroSignal({ data }: HeroSignalProps) {
  const config = SIGNAL_CONFIG[data.signal];

  return (
    <section className="relative flex flex-col items-center py-10 sm:py-16">
      {/* Outer ambient glow */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-[120px] ${config.bgGlow}`}
      />
      {/* Inner focused glow */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[200px] w-[350px] -translate-x-1/2 -translate-y-[60%] rounded-full opacity-20 blur-[80px] ${config.bgGlow}`}
      />

      {/* Ticker & name */}
      <div className="relative z-10 mb-6 flex items-center gap-3">
        <span className="text-base font-semibold uppercase tracking-wider text-zinc-300">
          {data.ticker}
        </span>
        <span className="h-4 w-px bg-zinc-700" />
        <span className="text-sm text-zinc-500">{data.tickerName}</span>
      </div>

      {/* Signal text */}
      <h1
        className={`relative z-10 text-7xl font-black tracking-tighter sm:text-8xl lg:text-9xl ${config.textColor}`}
        style={{
          textShadow: `0 0 30px ${config.shadowColor}, 0 0 60px ${config.shadowColor}, 0 0 120px ${config.shadowColor}`,
        }}
      >
        {data.signal}
      </h1>

      {/* Confidence */}
      <p className="relative z-10 mt-5 text-sm font-medium text-zinc-500">
        AI 신뢰도{' '}
        <span className={`text-base font-bold ${config.textColor}`}>
          {data.confidence}%
        </span>
      </p>

      {/* Last updated */}
      <p className="relative z-10 mt-2 text-xs text-zinc-600">
        {data.lastUpdated}
      </p>

      {/* Metric badges */}
      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
        <SignalBadge
          label="수익률"
          value={`${data.returnRate > 0 ? '+' : ''}${data.returnRate}%`}
          icon={
            data.returnRate >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )
          }
          variant={data.returnRate >= 0 ? 'positive' : 'negative'}
        />
        <SignalBadge
          label="괴리율"
          value={`${data.divergenceRate > 0 ? '+' : ''}${data.divergenceRate}%`}
          icon={
            data.divergenceRate >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )
          }
          variant={data.divergenceRate >= 0 ? 'positive' : 'negative'}
        />
        <SignalBadge
          label="신뢰도"
          value={`${data.confidence}%`}
          icon={<Zap className="h-3.5 w-3.5" />}
          variant="neutral"
        />
      </div>
    </section>
  );
}
