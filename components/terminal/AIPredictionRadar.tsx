'use client';

import { MOCK_TERMINAL_DATA, SIGNAL_CONFIG } from '@/lib/constants';
import type { StockPrediction } from '@/types/dashboard';
import { cn } from '@/lib/utils';

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-zinc-400 w-10 text-right tabular-nums">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function SignalBadge({ signal }: { signal: StockPrediction['signal'] }) {
  const config = SIGNAL_CONFIG[signal];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-14 py-0.5 rounded text-[10px] font-bold font-mono tracking-widest',
        config.textColor,
        config.bgGlow,
      )}
    >
      {signal}
    </span>
  );
}

function PredictionRow({ stock }: { stock: StockPrediction }) {
  const isPositive = stock.dailyChange >= 0;
  const isDivPositive = stock.divergenceScore >= 0;

  return (
    <tr
      className={cn(
        'hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 cursor-default',
        stock.isNew && stock.signal === 'BUY' && 'animate-signal-glow',
      )}
    >
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-zinc-400 tracking-tight">
              {stock.ticker.slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-100">{stock.ticker}</div>
            <div className="text-[10px] text-zinc-500 truncate">{stock.name}</div>
          </div>
        </div>
      </td>

      <td className="py-2.5 px-3 text-right">
        <div className="font-mono text-xs font-medium text-zinc-100 tabular-nums">
          {'$'}{stock.price.toLocaleString()}
        </div>
        <div
          className={`font-mono text-[10px] tabular-nums ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {isPositive ? '+' : ''}
          {stock.dailyChange.toFixed(2)}%
        </div>
      </td>

      <td className="py-2.5 px-3 text-center">
        <SignalBadge signal={stock.signal} />
      </td>

      <td className="py-2.5 px-3 text-right">
        <span
          className={cn(
            'font-mono text-xs font-medium tabular-nums',
            isDivPositive ? 'text-green-500' : 'text-red-500',
          )}
        >
          {isDivPositive ? '+' : ''}
          {stock.divergenceScore.toFixed(1)}%
        </span>
      </td>

      <td className="py-2.5 px-3 text-right">
        <span className="font-mono text-xs text-zinc-300 tabular-nums">
          {stock.sentimentScore}
        </span>
      </td>

      <td className="py-2.5 px-3">
        <ConfidenceBar value={stock.confidence} />
      </td>
    </tr>
  );
}

export default function AIPredictionRadar() {
  const { predictions } = MOCK_TERMINAL_DATA;

  const buyCount = predictions.filter((p) => p.signal === 'BUY').length;
  const sellCount = predictions.filter((p) => p.signal === 'SELL').length;
  const holdCount = predictions.filter((p) => p.signal === 'HOLD').length;

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            AI Prediction Radar
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] text-green-500 font-medium">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-green-500">{buyCount} BUY</span>
          <span className="text-yellow-500">{holdCount} HOLD</span>
          <span className="text-red-500">{sellCount} SELL</span>
          <span className="text-zinc-600 ml-1">
            {predictions.length} monitored
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto terminal-scroll">
        <table className="w-full">
          <thead className="sticky top-0 bg-zinc-900 z-10">
            <tr className="border-b border-zinc-800">
              <th className="py-2 px-3 text-left text-[9px] font-medium text-zinc-600 uppercase tracking-wider w-[180px]">
                Ticker
              </th>
              <th className="py-2 px-3 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                Price
              </th>
              <th className="py-2 px-3 text-center text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                AI Signal
              </th>
              <th className="py-2 px-3 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                Divergence
              </th>
              <th className="py-2 px-3 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="py-2 px-3 text-left text-[9px] font-medium text-zinc-600 uppercase tracking-wider w-[140px]">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((stock) => (
              <PredictionRow key={stock.ticker} stock={stock} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
