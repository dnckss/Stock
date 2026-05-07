'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { API_BASE, getTickerName } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StockSnapshot {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  marketCap?: string;
  pe?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  high52w?: number;
  low52w?: number;
}

async function fetchSnapshot(ticker: string): Promise<StockSnapshot | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stock/${ticker}/quote`);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      ticker: ticker.toUpperCase(),
      name: d.name ?? getTickerName(ticker),
      price: d.price ?? d.current_price ?? 0,
      changePct: d.change_percent ?? d.change_pct ?? 0,
      marketCap: d.market_cap ?? d.marketCap ?? undefined,
      pe: d.pe ?? d.pe_ratio ?? undefined,
      eps: d.eps ?? undefined,
      dividendYield: d.dividend_yield ?? undefined,
      beta: d.beta ?? undefined,
      high52w: d.high_52w ?? d.year_high ?? undefined,
      low52w: d.low_52w ?? d.year_low ?? undefined,
    };
  } catch { return null; }
}

function MetricRow({ label, values }: { label: string; values: (string | undefined)[] }) {
  return (
    <div className="flex items-center border-b border-zinc-800/30">
      <div className="w-[120px] shrink-0 px-4 py-2.5 text-[11px] text-zinc-500">{label}</div>
      {values.map((v, i) => (
        <div key={i} className="flex-1 px-4 py-2.5 text-sm font-mono text-zinc-200 tabular-nums text-center">
          {v ?? '-'}
        </div>
      ))}
    </div>
  );
}

export default function ComparePage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [data, setData] = useState<Map<string, StockSnapshot>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const addTicker = useCallback(async () => {
    const t = input.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= 4) return;
    setInput('');
    setTickers((prev) => [...prev, t]);
    setLoading((prev) => new Set(prev).add(t));
    const snapshot = await fetchSnapshot(t);
    if (snapshot) setData((prev) => new Map(prev).set(t, snapshot));
    setLoading((prev) => { const next = new Set(prev); next.delete(t); return next; });
  }, [input, tickers]);

  const removeTicker = (t: string) => {
    setTickers((prev) => prev.filter((x) => x !== t));
    setData((prev) => { const next = new Map(prev); next.delete(t); return next; });
  };

  const stocks = tickers.map((t) => data.get(t));

  return (
    <div className="min-h-screen bg-[#09090b]">
      <PageHeader title="Compare" />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Add ticker */}
        <div className="flex items-center gap-2 mb-8">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTicker(); }}
            placeholder="티커 입력 (예: AAPL)"
            className="text-sm font-mono bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-4 py-2.5 w-[200px]
                       text-zinc-200 placeholder:text-zinc-600 uppercase
                       focus:outline-none focus:border-zinc-700 transition-colors"
          />
          <button
            onClick={addTicker}
            disabled={!input.trim() || tickers.length >= 4}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200
                       border border-zinc-800/50 hover:border-zinc-700 rounded-lg px-4 py-2.5
                       transition-colors disabled:opacity-30"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
          <span className="text-[11px] text-zinc-600 ml-2">{tickers.length}/4</span>
        </div>

        {tickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Plus className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">비교할 종목을 추가하세요 (최대 4개)</p>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="flex items-center border-b border-zinc-800/50">
              <div className="w-[120px] shrink-0 px-4 py-3" />
              {tickers.map((t) => {
                const s = data.get(t);
                const isLoading = loading.has(t);
                const positive = (s?.changePct ?? 0) >= 0;
                return (
                  <div key={t} className="flex-1 px-4 py-3 text-center relative">
                    <button
                      onClick={() => removeTicker(t)}
                      className="absolute top-2 right-2 p-1 text-zinc-700 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-zinc-600 animate-spin mx-auto" />
                    ) : (
                      <>
                        <div className="text-sm font-mono font-bold text-zinc-100">{t}</div>
                        <div className="text-[11px] text-zinc-500 truncate">{s?.name ?? getTickerName(t)}</div>
                        {s && (
                          <div className={cn('text-lg font-mono font-bold mt-1 tabular-nums', positive ? 'text-emerald-400' : 'text-red-400')}>
                            ${s.price.toFixed(2)}
                            <span className="text-xs ml-1">{positive ? '+' : ''}{s.changePct.toFixed(2)}%</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Metric rows */}
            <MetricRow label="시가총액" values={stocks.map((s) => s?.marketCap)} />
            <MetricRow label="P/E" values={stocks.map((s) => s?.pe?.toFixed(1))} />
            <MetricRow label="EPS" values={stocks.map((s) => s?.eps != null ? `$${s.eps.toFixed(2)}` : undefined)} />
            <MetricRow label="배당수익률" values={stocks.map((s) => s?.dividendYield != null ? `${s.dividendYield.toFixed(2)}%` : undefined)} />
            <MetricRow label="Beta" values={stocks.map((s) => s?.beta?.toFixed(2))} />
            <MetricRow label="52주 최고" values={stocks.map((s) => s?.high52w != null ? `$${s.high52w.toFixed(2)}` : undefined)} />
            <MetricRow label="52주 최저" values={stocks.map((s) => s?.low52w != null ? `$${s.low52w.toFixed(2)}` : undefined)} />
          </div>
        )}
      </main>
    </div>
  );
}
