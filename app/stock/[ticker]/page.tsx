'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useStockDetail } from '@/hooks/useStockDetail';
import StockHero from '@/components/detail/StockHero';
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
    isLoading,
    reportLoading,
    newsRefreshing,
    lastNewsRefreshForced,
    error,
    reportError,
    retryReport,
    refreshLatestNews,
  } = useStockDetail(ticker);

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl font-bold">!</span>
          </div>
          <h1 className="text-lg font-mono font-bold text-zinc-100 mb-2">
            {ticker.toUpperCase()}
          </h1>
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
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              Back to Terminal
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-zinc-100 tracking-wider">
              QUANT<span className="text-green-500">AI</span>
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {detail.ticker} Deep Dive
            </span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="stagger-1">
          <StockHero data={detail} />
        </div>
        {detail.history.length > 0 && (
          <div className="stagger-2">
            <DivergenceChart data={detail.history} />
          </div>
        )}
        <div className="stagger-3">
          <AIReport
            ticker={detail.ticker}
            report={report}
            isLoading={reportLoading}
            error={reportError}
            onRetry={retryReport}
          />
        </div>
        <div className="stagger-4">
          <RelatedNews
            items={detail.relatedNews}
            ticker={detail.ticker}
            onRefreshLatest={refreshLatestNews}
            isRefreshing={newsRefreshing}
            lastRefreshForced={lastNewsRefreshForced}
          />
        </div>
      </main>

      <footer className="border-t border-zinc-800 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-[9px] font-mono text-zinc-600">
          <span>AI MODEL v3.7.2</span>
          <span>© 2025 QuantAI Terminal</span>
        </div>
      </footer>
    </div>
  );
}
