'use client';

import type { StockQuote } from '@/types/dashboard';

function QuoteRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-zinc-800/30 last:border-b-0">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className={`text-[11px] text-zinc-200 tabular-nums ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function StockQuotePanel({ quote }: { quote: StockQuote | null }) {
  if (!quote) {
    return (
      <div className="border-b border-zinc-800 px-4 py-6 flex items-center justify-center">
        <span className="text-[10px] font-mono text-zinc-600 animate-pulse">시세 로딩 중...</span>
      </div>
    );
  }

  const fmt = (v: number | null, dec = 2) => (v !== null ? v.toFixed(dec) : '-');
  const fmtPct = (v: number | null) => (v !== null ? `${v.toFixed(2)}%` : '-');

  return (
    <div className="border-b border-zinc-800">
      {/* Bid / Ask */}
      {(quote.bid !== null || quote.ask !== null) && (
        <div className="px-4 py-2 border-b border-zinc-800/50">
          <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1.5">
            호가
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded bg-blue-500/5 border border-blue-500/20 px-3 py-1.5 text-center">
              <div className="text-[8px] text-blue-400/60 font-mono">BID</div>
              <div className="text-sm font-mono font-bold text-blue-400 tabular-nums">
                ${fmt(quote.bid)}
              </div>
              {quote.bidSize !== null && (
                <div className="text-[8px] font-mono text-zinc-600">x {quote.bidSize}</div>
              )}
            </div>
            <div className="rounded bg-red-500/5 border border-red-500/20 px-3 py-1.5 text-center">
              <div className="text-[8px] text-red-400/60 font-mono">ASK</div>
              <div className="text-sm font-mono font-bold text-red-400 tabular-nums">
                ${fmt(quote.ask)}
              </div>
              {quote.askSize !== null && (
                <div className="text-[8px] font-mono text-zinc-600">x {quote.askSize}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote grid */}
      <div className="px-4 py-2">
        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1.5">
          시세 정보
        </div>
        <div className="grid grid-cols-2 gap-x-6">
          <div>
            <QuoteRow label="시가" value={`$${fmt(quote.open)}`} />
            <QuoteRow label="고가" value={`$${fmt(quote.high)}`} />
            <QuoteRow label="저가" value={`$${fmt(quote.low)}`} />
            <QuoteRow label="전일종가" value={`$${fmt(quote.prevClose)}`} />
          </div>
          <div>
            <QuoteRow label="거래량" value={quote.volumeDisplay || String(quote.volume)} />
            <QuoteRow label="시총" value={quote.marketCapDisplay || '-'} />
            <QuoteRow label="PER" value={quote.peRatio !== null ? fmt(quote.peRatio, 1) : '-'} />
            <QuoteRow label="배당률" value={fmtPct(quote.dividendYield)} />
          </div>
        </div>
      </div>
    </div>
  );
}
