'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Globe, TrendingUp, TrendingDown } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { API_BASE } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MarketItem {
  symbol: string;
  name: string;
  country?: string;
  value: number;
  change_pct: number;
  updated_at?: string;
}

interface GlobalData {
  indices: MarketItem[];
  commodities: MarketItem[];
  currencies: MarketItem[];
}

// 백엔드 API 미구현 시 대시보드의 매크로 데이터로 대체
async function fetchGlobalMarkets(): Promise<GlobalData> {
  try {
    const res = await fetch(`${API_BASE}/api/markets/global`);
    if (res.ok) return res.json();
  } catch { /* fallback */ }

  // fallback: 기존 매크로 데이터에서 구성
  try {
    const res = await fetch(`${API_BASE}/api/latest`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const macro = data.macro ?? {};
    const indices = (macro.indices ?? []).map((i: Record<string, unknown>) => ({
      symbol: String(i.symbol ?? ''),
      name: String(i.name ?? i.symbol ?? ''),
      value: Number(i.price ?? i.value ?? 0),
      change_pct: Number(i.change_percent ?? i.change_pct ?? 0),
    }));
    return { indices, commodities: [], currencies: [] };
  } catch {
    return { indices: [], commodities: [], currencies: [] };
  }
}

function MarketCard({ item }: { item: MarketItem }) {
  const positive = item.change_pct >= 0;
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/60 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">{item.name}</span>
        {item.country && <span className="text-[10px] text-zinc-600 font-mono">{item.country}</span>}
      </div>
      <div className="text-lg font-mono font-bold text-zinc-100 tabular-nums">
        {item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={cn('flex items-center gap-1 mt-1 text-sm font-mono tabular-nums', positive ? 'text-emerald-400' : 'text-red-400')}>
        {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {positive ? '+' : ''}{item.change_pct.toFixed(2)}%
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: MarketItem[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => <MarketCard key={item.symbol} item={item} />)}
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const [data, setData] = useState<GlobalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchGlobalMarkets();
    setData(result);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasData = data && (data.indices.length > 0 || data.commodities.length > 0 || data.currencies.length > 0);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <PageHeader title="Global Markets">
        <button onClick={load} disabled={isLoading} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition-colors">
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </PageHeader>

      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Globe className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">마켓 데이터를 불러올 수 없습니다</p>
          </div>
        ) : (
          <>
            <Section title="글로벌 지수" items={data.indices} />
            <Section title="원자재" items={data.commodities} />
            <Section title="환율" items={data.currencies} />
          </>
        )}
      </main>
    </div>
  );
}
