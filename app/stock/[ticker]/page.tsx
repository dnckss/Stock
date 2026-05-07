'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ExternalLink, Star, StickyNote, Bell } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useStockMemo } from '@/hooks/useStockMemo';
import { useAlerts } from '@/hooks/useAlerts';
import { useStockDetail } from '@/hooks/useStockDetail';
import { useStockFundamentals } from '@/hooks/useStockFundamentals';
import StockHeader from '@/components/detail/StockHeader';
import StockPriceChart from '@/components/detail/StockPriceChart';
import StockQuotePanel from '@/components/detail/StockQuotePanel';
import FundamentalsPanel from '@/components/detail/fundamentals/FundamentalsPanel';

import RelatedNews from '@/components/detail/RelatedNews';
import StockAnalysisPanel from '@/components/detail/StockAnalysis';

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
    analysis,
    analysisLoading,
    analysisError,
    isLoading,
    newsRefreshing,
    lastNewsRefreshForced,
    error,
    retryAnalysis,
    refreshLatestNews,
    setChartPeriod,
  } = useStockDetail(ticker);

  const {
    data: fundamentals,
    isLoading: fundamentalsLoading,
    error: fundamentalsError,
    refreshSection,
    sectionRefreshing,
  } = useStockFundamentals(detail ? ticker : null);
  const watchlist = useWatchlist();
  const { memo, setMemo } = useStockMemo(ticker);
  const { add: addAlert, requestPermission } = useAlerts();
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertDir, setAlertDir] = useState<'above' | 'below'>('above');

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
      <PageHeader title={detail.ticker}>
        <button
          type="button"
          onClick={() => watchlist.toggle(detail.ticker)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-yellow-400 transition-colors"
          title={watchlist.has(detail.ticker) ? '관심 종목 해제' : '관심 종목 추가'}
        >
          <Star className={`w-4 h-4 ${watchlist.has(detail.ticker) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          <span className="hidden sm:block">{watchlist.has(detail.ticker) ? '관심 종목' : '관심 추가'}</span>
        </button>
        <button
          type="button"
          onClick={async () => { await requestPermission(); setShowAlertForm((p) => !p); }}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          title="가격 알림"
        >
          <Bell className="w-4 h-4" />
        </button>
      </PageHeader>

      {/* Alert form */}
      {showAlertForm && (
        <div className="shrink-0 px-4 py-2 border-b border-zinc-800/40 bg-zinc-900/50 flex items-center gap-2">
          <select
            value={alertDir}
            onChange={(e) => setAlertDir(e.target.value as 'above' | 'below')}
            className="text-xs bg-zinc-800 border border-zinc-700/50 rounded px-2 py-1.5 text-zinc-300"
          >
            <option value="above">이상 도달</option>
            <option value="below">이하 도달</option>
          </select>
          <input
            type="number"
            value={alertPrice}
            onChange={(e) => setAlertPrice(e.target.value)}
            placeholder="목표가"
            className="text-xs font-mono bg-zinc-800 border border-zinc-700/50 rounded px-2 py-1.5 text-zinc-200 w-[100px] placeholder:text-zinc-600"
          />
          <button
            onClick={() => {
              const price = Number(alertPrice);
              if (price > 0) { addAlert(detail.ticker, price, alertDir); setAlertPrice(''); setShowAlertForm(false); }
            }}
            disabled={!Number(alertPrice)}
            className="text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700/50 rounded px-3 py-1.5 disabled:opacity-30 transition-colors"
          >
            설정
          </button>
          <button onClick={() => setShowAlertForm(false)} className="text-xs text-zinc-600 hover:text-zinc-400 ml-auto transition-colors">
            취소
          </button>
        </div>
      )}

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
          <FundamentalsPanel
            data={fundamentals}
            isLoading={fundamentalsLoading}
            error={fundamentalsError}
            sectionRefreshing={sectionRefreshing}
            onRefreshSection={refreshSection}
          />
          {/* 투자 메모 */}
          <div className="px-4 py-3 border-t border-zinc-800/40">
            <div className="flex items-center gap-1.5 mb-2">
              <StickyNote className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] font-mono text-zinc-600 uppercase">메모</span>
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="이 종목에 대한 메모를 남겨보세요..."
              rows={3}
              className="w-full text-xs bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2
                         text-zinc-300 placeholder:text-zinc-700 resize-none
                         focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          {/* 토스증권 바로가기 */}
          <div className="px-4 py-4">
            <a
              href={`https://tossinvest.com/stocks/${detail.ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
                         border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60
                         text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              토스증권에서 보기
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
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
          <StockAnalysisPanel
            analysis={analysis}
            isLoading={analysisLoading}
            error={analysisError}
            onRetry={retryAnalysis}
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
