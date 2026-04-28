'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, ChevronDown, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, Info, Loader2,
} from 'lucide-react';
import { useBacktest } from '@/hooks/useBacktest';
import { cn } from '@/lib/utils';
import type { BacktestTrade, BacktestTradeLeg, BacktestTradeSummary, BacktestSource } from '@/types/dashboard';

/* ── Helpers ── */

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} (${DAYS_KO[d.getDay()]})`;
  } catch { return iso; }
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '-';
  return v >= 0 ? `+${v.toFixed(2)}%` : `${v.toFixed(2)}%`;
}

function fmtPrice(v: number | null | undefined): string {
  if (v == null) return '-';
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Stat card ── */

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2.5 min-w-0">
      <span className="text-[9px] font-mono text-zinc-600 uppercase block mb-1 truncate">{label}</span>
      <span className={cn('text-sm font-mono font-bold tabular-nums', positive == null ? 'text-zinc-100' : positive ? 'text-emerald-400' : 'text-red-400')}>
        {value}
      </span>
      {sub && <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">{sub}</span>}
    </div>
  );
}

/* ── Leg row ── */

function LegRow({ leg, source }: { leg: BacktestTradeLeg; source: BacktestSource }) {
  const isBuy = leg.direction?.toUpperCase().includes('BUY');
  const positive = leg.return_pct >= 0;
  const isOpen = leg.exit_status === 'open';
  const displayPrice = isOpen ? leg.current_price : leg.exit_price;

  return (
    <div className={cn('px-3 py-2 flex items-center gap-2', isOpen && 'bg-zinc-800/10')}>
      {/* Direction */}
      <span className={cn(
        'shrink-0 w-10 text-center text-[9px] font-mono font-black py-0.5 rounded',
        isBuy ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30',
      )}>
        {leg.direction}
      </span>

      {/* Ticker */}
      <span className="w-[44px] text-[11px] font-mono font-bold text-zinc-100 shrink-0">{leg.ticker}</span>

      {/* Prices */}
      <span className="text-[10px] font-mono text-zinc-500 tabular-nums shrink-0">{fmtPrice(leg.entry_price)}</span>
      <span className="text-[9px] text-zinc-700 shrink-0">→</span>
      <span className={cn('text-[10px] font-mono tabular-nums shrink-0', isOpen ? 'text-zinc-400' : 'text-zinc-300')}>
        {fmtPrice(displayPrice)}
      </span>

      {/* Return */}
      <div className="flex items-center gap-0.5 ml-auto shrink-0">
        {positive ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
        <span className={cn('text-[10px] font-mono font-bold tabular-nums', positive ? 'text-emerald-400' : 'text-red-400')}>
          {fmtPct(leg.return_pct)}
        </span>
      </div>

      {/* Weight */}
      <span className="text-[9px] font-mono text-zinc-600 tabular-nums shrink-0 w-[32px] text-right">
        {(leg.weight_pct ?? 0).toFixed(0)}%
      </span>

      {/* Open indicator */}
      {isOpen && leg.remaining_trading_days != null && (
        <span className="text-[8px] font-mono text-zinc-600 shrink-0">
          D{leg.elapsed_trading_days ?? 0}/{(leg.elapsed_trading_days ?? 0) + leg.remaining_trading_days}
        </span>
      )}

      {/* Source-specific badges */}
      {source === 'signals' && leg.signal_source && (
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
          {leg.signal_source}
        </span>
      )}
      {source === 'strategist' && leg.confidence && (
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
          {leg.confidence}
        </span>
      )}
    </div>
  );
}

/* ── Trade card ── */

function TradeCard({ trade, source, isOpen, onToggle }: {
  trade: BacktestTrade;
  source: BacktestSource;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isLive = trade.status === 'open';
  const positive = trade.portfolio_return_pct >= 0;

  return (
    <div className={cn(
      'rounded-xl overflow-hidden transition-all duration-200',
      isLive
        ? 'border border-dashed border-zinc-700/50 bg-zinc-900/30'
        : 'border border-zinc-800/50 bg-zinc-900/50',
      isOpen && 'ring-1 ring-zinc-700/30',
    )}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-white/[0.02] transition-colors"
      >
        {/* Date range */}
        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 shrink-0 min-w-0">
          <span>{fmtDate(trade.entry_date)}</span>
          <span className="text-zinc-700">→</span>
          {isLive ? (
            <span className="flex items-center gap-1 text-zinc-500">
              <Clock className="w-3 h-3" />
              진행 중
            </span>
          ) : (
            <span>{fmtDate(trade.exit_date)}</span>
          )}
        </div>

        {/* Return */}
        <span className={cn('text-[11px] font-mono font-bold tabular-nums shrink-0', positive ? 'text-emerald-400' : 'text-red-400')}>
          {fmtPct(trade.portfolio_return_pct)}
        </span>

        {/* Status badge */}
        <span className={cn(
          'text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0',
          isLive ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30',
        )}>
          {isLive ? 'OPEN' : 'CLOSED'}
        </span>

        {/* Risk label */}
        {trade.risk_label && (
          <span className="text-[8px] font-mono text-zinc-600 shrink-0">{trade.risk_label}</span>
        )}

        {/* W/L mini badge */}
        <span className="text-[9px] font-mono text-zinc-600 shrink-0 ml-auto">
          <span className="text-emerald-500/70">{trade.winners_count}W</span>
          {' / '}
          <span className="text-red-500/70">{trade.losers_count}L</span>
        </span>

        {/* Chevron */}
        <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-600 shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Expanded legs */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-800/40 divide-y divide-zinc-800/30">
              {(trade.legs ?? []).map((leg, i) => (
                <LegRow key={`${leg.ticker}-${i}`} leg={leg} source={source} />
              ))}
            </div>

            {/* Strategist extra: rationale */}
            {source === 'strategist' && trade.legs?.[0]?.rationale && (
              <div className="px-3 py-2 border-t border-zinc-800/30 bg-zinc-900/30">
                <p className="text-[10px] text-zinc-500 leading-relaxed">{trade.legs[0].rationale}</p>
              </div>
            )}

            {/* Strategist extra: stop_loss / targets */}
            {source === 'strategist' && trade.legs?.some(l => l.stop_loss != null || l.target1 != null) && (
              <div className="px-3 py-2 border-t border-zinc-800/30 flex items-center gap-3 text-[9px] font-mono">
                {trade.legs.filter(l => l.stop_loss != null).slice(0, 1).map(l => (
                  <span key="sl" className="text-red-400">SL {fmtPrice(l.stop_loss)}</span>
                ))}
                {trade.legs.filter(l => l.target1 != null).slice(0, 1).map(l => (
                  <span key="t1" className="text-emerald-400">T1 {fmtPrice(l.target1)}</span>
                ))}
                {trade.legs.filter(l => l.target2 != null).slice(0, 1).map(l => (
                  <span key="t2" className="text-emerald-400/60">T2 {fmtPrice(l.target2)}</span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Summary section ── */

function SummarySection({ summary }: { summary: BacktestTradeSummary }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="AI 승률"
          value={`${(summary.win_rate_pct ?? 0).toFixed(1)}%`}
          sub={`${summary.closed_trades ?? 0}건 종료`}
          positive={(summary.win_rate_pct ?? 0) > 50}
        />
        <StatCard
          label="평균 수익률"
          value={fmtPct(summary.avg_return_pct)}
          positive={(summary.avg_return_pct ?? 0) > 0}
        />
        <StatCard
          label="누적 수익률"
          value={fmtPct(summary.total_return_pct)}
          positive={(summary.total_return_pct ?? 0) > 0}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="최고 트레이드" value={fmtPct(summary.best_trade)} positive />
        <StatCard label="최저 트레이드" value={fmtPct(summary.worst_trade)} positive={(summary.worst_trade ?? 0) >= 0} />
      </div>
    </div>
  );
}

/* ── Empty / info states ── */

function EmptyState({ closedTrades, openTrades }: { closedTrades: number; openTrades: number }) {
  if (closedTrades === 0 && openTrades > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Clock className="w-5 h-5 text-zinc-600 mb-2" />
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          현재 진행 중인 거래만 있습니다<br />
          며칠 후 결과를 확인할 수 있습니다
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Info className="w-5 h-5 text-zinc-600 mb-2" />
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        아직 평가할 추천 데이터가<br />
        충분히 쌓이지 않았습니다
      </p>
    </div>
  );
}

/* ── Main ── */

export default function BacktestDashboard() {
  const { data, isLoading, error, source, setSource, refresh } = useBacktest();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Loading */
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
        <span className="text-[10px] font-mono text-zinc-500">백테스트 데이터 로딩 중...</span>
        {source === 'signals' && (
          <span className="text-[9px] text-zinc-600">첫 호출 시 30초~수 분 소요될 수 있습니다</span>
        )}
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <AlertTriangle className="w-4 h-4 text-red-400/60 mb-2" />
        <p className="text-[10px] text-red-400 font-mono mb-2">{error}</p>
        <button onClick={refresh} className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1 transition-colors">
          다시 시도
        </button>
      </div>
    );
  }

  const summary = data?.summary;
  const trades = data?.trades ?? [];
  const totalTrades = summary?.total_trades ?? 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Source toggle + refresh */}
      <div className="px-3 py-1.5 border-b border-zinc-800/40 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setSource('strategist')}
          className={cn(
            'px-2.5 py-1 rounded text-[10px] font-medium transition-all',
            source === 'strategist'
              ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
        >
          AI 전략
        </button>
        <button
          onClick={() => setSource('signals')}
          className={cn(
            'px-2.5 py-1 rounded text-[10px] font-medium transition-all',
            source === 'signals'
              ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
          )}
        >
          시그널
        </button>
        <div className="flex-1" />
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-1 text-zinc-600 hover:text-zinc-400 disabled:opacity-40 transition-colors"
          title="새로고침"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
        </button>
        {data?.lookback_days && (
          <span className="text-[9px] font-mono text-zinc-600">최근 {data.lookback_days}일</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 terminal-scroll space-y-3">
        {/* Summary */}
        {summary && totalTrades > 0 && <SummarySection summary={summary} />}

        {/* Counts */}
        {summary && totalTrades > 0 && (
          <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-600 px-1">
            <span>종료 <span className="text-zinc-400">{summary.closed_trades ?? 0}</span></span>
            <span>진행 중 <span className="text-yellow-400/70">{summary.open_trades ?? 0}</span></span>
            <span>총 <span className="text-zinc-400">{totalTrades}</span></span>
          </div>
        )}

        {/* Empty state */}
        {totalTrades === 0 && (
          <EmptyState closedTrades={summary?.closed_trades ?? 0} openTrades={summary?.open_trades ?? 0} />
        )}

        {/* Trade list */}
        {trades.map((trade, i) => {
          const id = trade.trade_id ?? `${trade.entry_date}-${i}`;
          return (
            <TradeCard
              key={id}
              trade={trade}
              source={source}
              isOpen={expandedId === id}
              onToggle={() => setExpandedId(prev => prev === id ? null : id)}
            />
          );
        })}
      </div>
    </div>
  );
}
