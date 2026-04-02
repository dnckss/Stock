'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useStockDetail } from '@/hooks/useStockDetail';
import StockHeader from '@/components/detail/StockHeader';
import StockPriceChart from '@/components/detail/StockPriceChart';
import StockQuotePanel from '@/components/detail/StockQuotePanel';


import RelatedNews from '@/components/detail/RelatedNews';

function PageSkeleton() {
  return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-500 font-mono">데이터 로딩 중...</p>
      </div>
    </div>
  );
}

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const {
    detail,
    quote,
    chartBars,
    chartPeriod,
    chartLoading,
    isLoading,
    newsRefreshing,
    lastNewsRefreshForced,
    error,
    refreshLatestNews,
    setChartPeriod,
  } = useStockDetail(ticker);

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs text-red-400 font-mono mb-2">{ticker.toUpperCase()}</p>
          <p className="text-sm text-zinc-500 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-green-500 hover:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            터미널로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Nav */}
      <nav className="shrink-0 border-b border-zinc-800 bg-[#0a0a0a]">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Terminal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-zinc-100 tracking-wider">
              Quant<span className="text-green-500">ix</span>
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-[9px] text-zinc-500 font-mono">{detail.ticker}</span>
          </div>
        </div>
      </nav>

      {/* Stock Header */}
      <div className="shrink-0">
        <StockHeader detail={detail} quote={quote} />
      </div>

      {/* Main: 2-panel layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Chart + Quote */}
        <div className="flex-1 flex flex-col overflow-y-auto terminal-scroll min-w-0 border-r border-zinc-800">
          <StockPriceChart
            bars={chartBars}
            period={chartPeriod}
            isLoading={chartLoading}
            onPeriodChange={setChartPeriod}
          />
          <StockQuotePanel quote={quote} />
        </div>

        {/* Right: News + AI Report */}
        <div className="w-[420px] shrink-0 flex flex-col overflow-y-auto terminal-scroll">
          <RelatedNews
            items={detail.relatedNews}
            ticker={detail.ticker}
            onRefreshLatest={refreshLatestNews}
            isRefreshing={newsRefreshing}
            lastRefreshForced={lastNewsRefreshForced}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="shrink-0 px-3 py-1 border-t border-zinc-800 flex items-center justify-between text-[8px] font-mono text-zinc-700">
        <span>QUANTIX v3.7.2</span>
        <span>&copy; 2025 Quantix</span>
      </div>
    </div>
  );
}
