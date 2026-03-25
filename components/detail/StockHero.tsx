import { SIGNAL_CONFIG } from '@/lib/constants';
import { formatReturn, formatSentiment, formatDivergence } from '@/lib/api';
import type { StockDetailState } from '@/hooks/useStockDetail';

interface StockHeroProps {
  data: StockDetailState;
}

export default function StockHero({ data }: StockHeroProps) {
  const config = SIGNAL_CONFIG[data.signal];
  const barColor =
    data.confidence >= 60
      ? 'bg-green-500'
      : data.confidence >= 30
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div
        className={`pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-[0.12] blur-[80px] ${config.bgGlow}`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

      <div className="relative z-10 flex items-start justify-between gap-8">
        {/* Left: Stock Information */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
              <span className="text-sm font-bold text-zinc-300">
                {data.ticker.slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">
                {data.name === data.ticker
                  ? data.ticker
                  : `${data.name} (${data.ticker})`}
              </h1>
              <p className="text-sm text-zinc-500">종목 코드: {data.ticker}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-2.5 mb-3">
            <span className="text-zinc-400 text-sm">5일 수익률</span>
            <span
              className={`font-mono text-2xl font-bold tabular-nums ${
                data.priceReturn >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {formatReturn(data.priceReturn)}
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <div>
              <span className="text-zinc-500">괴리율 </span>
              <span
                className={`font-mono font-semibold ${
                  data.divergence >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {formatDivergence(data.divergence)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">감성 </span>
              <span
                className={`font-mono font-semibold ${
                  data.sentiment >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {formatSentiment(data.sentiment)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: AI Signal */}
        <div className="text-right shrink-0">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-medium">
            AI Signal
          </p>
          <h2
            className={`text-5xl font-black tracking-tighter ${config.textColor}`}
            style={{
              textShadow: `0 0 30px ${config.shadowColor}, 0 0 60px ${config.shadowColor}`,
            }}
          >
            {data.signal}
          </h2>
          <div className="mt-3">
            <p className="text-xs text-zinc-500">
              AI 확신도{' '}
              <span className={`font-bold font-mono ${config.textColor}`}>
                {data.confidence.toFixed(1)}%
              </span>
            </p>
            <div className="mt-1.5 w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden ml-auto">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${data.confidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
