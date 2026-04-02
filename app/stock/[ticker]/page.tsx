'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useStockDetail } from '@/hooks/useStockDetail';
import StockHeader from '@/components/detail/StockHeader';
import StockPriceChart from '@/components/detail/StockPriceChart';
import StockQuotePanel from '@/components/detail/StockQuotePanel';
import DivergenceChart from '@/components/detail/DivergenceChart';
import AIReport from '@/components/detail/AIReport';
import RelatedNews from '@/components/detail/RelatedNews';

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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
    report,
    quote,
    chartBars,
    chartPeriod,
    chartLoading,
    isLoading,
    reportLoading,
    newsRefreshing,
    lastNewsRefreshForced,
    error,
    reportError,
    retryReport,
    refreshLatestNews,
    setChartPeriod,
  } = useStockDetail(ticker);

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
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

      <main className="max-w-4xl mx-auto">
        {/* Stock Header: Ticker + Price + Signal */}
        <StockHeader detail={detail} quote={quote} />

        {/* Price Chart */}
        <StockPriceChart
          bars={chartBars}
          period={chartPeriod}
          isLoading={chartLoading}
          onPeriodChange={setChartPeriod}
        />

        {/* Quote Panel: 호가 + 시세 */}
        <StockQuotePanel quote={quote} />

        {/* Related News */}
        <div className="border-b border-zinc-800">
          <RelatedNews
            items={detail.relatedNews}
            ticker={detail.ticker}
            onRefreshLatest={refreshLatestNews}
            isRefreshing={newsRefreshing}
            lastRefreshForced={lastNewsRefreshForced}
          />
        </div>

        {/* AI Report */}
        <div className="border-b border-zinc-800">
          <AIReport
            ticker={detail.ticker}
            report={report}
            isLoading={reportLoading}
            error={reportError}
            onRetry={retryReport}
          />
        </div>

        {/* Divergence Chart */}
        {detail.history.length > 0 && (
          <div className="border-b border-zinc-800">
            <DivergenceChart data={detail.history} />
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 mt-4">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between text-[8px] font-mono text-zinc-700">
          <span>QUANTIX v3.7.2</span>
          <span>&copy; 2025 Quantix Terminal</span>
        </div>
      </footer>
    </div>
  );
}
