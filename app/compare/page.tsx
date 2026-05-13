'use client';

import { useState, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import {
  fetchStockQuote,
  parseQuote,
  getTickerName,
  formatMarketCap,
  ApiError,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import type { StockQuote } from '@/types/dashboard';

interface CompareEntry {
  quote: StockQuote;
  name: string;
}

async function fetchEntry(ticker: string): Promise<CompareEntry | null> {
  try {
    const raw = await fetchStockQuote(ticker);
    const quote = parseQuote(raw);
    if (!quote) return null;
    return { quote, name: getTickerName(ticker) };
  } catch (err) {
    if (err instanceof ApiError) return null;
    return null;
  }
}

function formatNum(n: number | null | undefined, digits = 2): string | undefined {
  if (n == null || !Number.isFinite(n)) return undefined;
  return n.toFixed(digits);
}

function formatPct(n: number | null | undefined): string | undefined {
  if (n == null || !Number.isFinite(n)) return undefined;
  return `${n.toFixed(2)}%`;
}

function formatUsdValue(n: number | null | undefined): string | undefined {
  if (n == null || !Number.isFinite(n) || n === 0) return undefined;
  return `$${n.toFixed(2)}`;
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
  const [data, setData] = useState<Map<string, CompareEntry>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const addTicker = useCallback(async () => {
    const t = input.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= 4) return;
    setInput('');
    setTickers((prev) => [...prev, t]);
    setLoading((prev) => new Set(prev).add(t));
    const entry = await fetchEntry(t);
    if (entry) setData((prev) => new Map(prev).set(t, entry));
    setLoading((prev) => {
      const next = new Set(prev);
      next.delete(t);
      return next;
    });
  }, [input, tickers]);

  const removeTicker = (t: string) => {
    setTickers((prev) => prev.filter((x) => x !== t));
    setData((prev) => {
      const next = new Map(prev);
      next.delete(t);
      return next;
    });
  };

  const entries = tickers.map((t) => data.get(t));

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
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTicker();
            }}
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
                const entry = data.get(t);
                const isLoading = loading.has(t);
                const positive = (entry?.quote.changePct ?? 0) >= 0;
                return (
                  <div key={t} className="flex-1 px-4 py-3 text-center relative">
                    <button
                      onClick={() => removeTicker(t)}
                      className="absolute top-2 right-2 p-1 text-zinc-700 hover:text-red-400 transition-colors"
                      aria-label={`${t} 제거`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-zinc-600 animate-spin mx-auto" />
                    ) : (
                      <>
                        <div className="text-sm font-mono font-bold text-zinc-100">{t}</div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {entry?.name ?? getTickerName(t)}
                        </div>
                        {entry ? (
                          <div
                            className={cn(
                              'text-lg font-mono font-bold mt-1 tabular-nums',
                              positive ? 'text-emerald-400' : 'text-red-400',
                            )}
                          >
                            ${entry.quote.price.toFixed(2)}
                            <span className="text-xs ml-1">
                              {positive ? '+' : ''}
                              {entry.quote.changePct.toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-600 mt-1">데이터 없음</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Metric rows */}
            <MetricRow
              label="시가총액"
              values={entries.map((e) =>
                e?.quote.marketCapDisplay || (e?.quote.marketCap ? formatMarketCap(e.quote.marketCap) : undefined),
              )}
            />
            <MetricRow label="PER" values={entries.map((e) => formatNum(e?.quote.peRatio))} />
            <MetricRow label="Forward PER" values={entries.map((e) => formatNum(e?.quote.forwardPe))} />
            <MetricRow label="배당수익률" values={entries.map((e) => formatPct(e?.quote.dividendYield))} />
            <MetricRow label="Beta" values={entries.map((e) => formatNum(e?.quote.beta))} />
            <MetricRow label="MA50" values={entries.map((e) => formatUsdValue(e?.quote.ma50))} />
            <MetricRow label="MA200" values={entries.map((e) => formatUsdValue(e?.quote.ma200))} />
          </div>
        )}
      </main>
    </div>
  );
}
