'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { FUNDAMENTALS_TABS, FUNDAMENTALS_DEFAULT_TAB } from '@/lib/constants';
import type { FundamentalsData, FundamentalsSectionKey } from '@/types/dashboard';
import FundamentalsSkeleton from './FundamentalsSkeleton';
import ProfileSection from './ProfileSection';
import IndicatorsSection from './IndicatorsSection';
import ProfitabilitySection from './ProfitabilitySection';
import GrowthSection from './GrowthSection';
import StabilitySection from './StabilitySection';
import EarningsSection from './EarningsSection';

interface FundamentalsPanelProps {
  data: FundamentalsData | null;
  isLoading: boolean;
  error: string | null;
  sectionRefreshing: FundamentalsSectionKey | null;
  onRefreshSection: (section: FundamentalsSectionKey) => void;
}

export default function FundamentalsPanel({
  data,
  isLoading,
  error,
  sectionRefreshing,
  onRefreshSection,
}: FundamentalsPanelProps) {
  const [activeTab, setActiveTab] = useState<FundamentalsSectionKey>(
    FUNDAMENTALS_DEFAULT_TAB as FundamentalsSectionKey,
  );

  return (
    <div className="border-b border-zinc-800">
      {/* Section header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          펀더멘털
        </span>
        {sectionRefreshing && (
          <RefreshCw className="w-3 h-3 text-zinc-500 animate-spin" />
        )}
      </div>

      {/* Tab bar */}
      <div className="px-4 pb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {FUNDAMENTALS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading && <FundamentalsSkeleton />}

      {!isLoading && error && (
        <div className="px-4 py-6 text-center">
          <p className="text-[11px] text-red-400 mb-2">{error}</p>
          <button
            type="button"
            onClick={() => onRefreshSection(activeTab)}
            className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2.5 py-1 transition-colors"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            재시도
          </button>
        </div>
      )}

      {!isLoading && !error && data && (
        <div>
          {activeTab === 'profile' && <ProfileSection profile={data.profile} />}
          {activeTab === 'indicators' && <IndicatorsSection indicators={data.indicators} />}
          {activeTab === 'profitability' && <ProfitabilitySection quarters={data.profitability} />}
          {activeTab === 'growth' && <GrowthSection quarters={data.growth} />}
          {activeTab === 'stability' && <StabilitySection quarters={data.stability} />}
          {activeTab === 'earnings' && <EarningsSection earnings={data.earnings} />}
        </div>
      )}

      {!isLoading && !error && !data && (
        <div className="px-4 py-6 text-center">
          <span className="text-[11px] text-zinc-600">펀더멘털 데이터가 없습니다</span>
        </div>
      )}
    </div>
  );
}
