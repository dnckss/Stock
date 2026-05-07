'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { TICKER_NAMES } from '@/lib/api';
import StockLogo from '@/components/common/StockLogo';
import type { RadarStock } from '@/types/dashboard';

interface SearchResult {
  ticker: string;
  name: string;
  price?: number;
  changePct?: number;
}

// 모든 티커+회사명 쌍을 검색 가능한 목록으로 변환
const STATIC_ENTRIES = Object.entries(TICKER_NAMES).map(([ticker, name]) => ({
  ticker,
  name,
  searchKey: `${ticker} ${name}`.toLowerCase(),
}));

export default function StockSearch({ stocks }: { stocks?: RadarStock[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 라이브 가격 매핑
  const priceMap = useMemo(() => {
    const m = new Map<string, { price: number; changePct: number }>();
    for (const s of stocks ?? []) {
      m.set(s.ticker, { price: s.price, changePct: s.priceReturn * 100 });
    }
    return m;
  }, [stocks]);

  // 검색 결과
  const results: SearchResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matched = STATIC_ENTRIES
      .filter((e) => e.searchKey.includes(q))
      .slice(0, 8)
      .map((e) => {
        const live = priceMap.get(e.ticker);
        return {
          ticker: e.ticker,
          name: e.name,
          price: live?.price,
          changePct: live?.changePct,
        };
      });
    return matched;
  }, [query, priceMap]);

  const showDropdown = focused && results.length > 0;

  // 외부 클릭 닫기
  useEffect(() => {
    if (!showDropdown) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showDropdown]);

  // 선택 초기화
  useEffect(() => { setSelectedIdx(-1); }, [query]);

  const navigate = (ticker: string) => {
    setQuery('');
    setFocused(false);
    router.push(`/stock/${ticker}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      navigate(results[selectedIdx].ticker);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="종목 검색..."
          className="w-[180px] text-[11px] bg-zinc-800/50 border border-zinc-700/30 rounded-lg pl-7 pr-2 py-1.5
                     text-zinc-200 placeholder:text-zinc-600
                     focus:outline-none focus:border-zinc-600 focus:w-[240px] transition-all duration-200"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 w-[300px] z-50
                        bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl shadow-black/40
                        overflow-hidden">
          {results.map((r, i) => {
            const positive = (r.changePct ?? 0) >= 0;
            return (
              <button
                key={r.ticker}
                type="button"
                onClick={() => navigate(r.ticker)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  i === selectedIdx ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/50'
                }`}
              >
                <StockLogo ticker={r.ticker} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-zinc-100">{r.ticker}</span>
                    <span className="text-[11px] text-zinc-500 truncate">{r.name}</span>
                  </div>
                </div>
                {r.price != null && (
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono text-zinc-200 tabular-nums">${r.price.toFixed(2)}</div>
                    <div className={`text-[10px] font-mono tabular-nums ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? '+' : ''}{(r.changePct ?? 0).toFixed(2)}%
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
