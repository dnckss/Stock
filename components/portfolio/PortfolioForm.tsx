'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PORTFOLIO_STYLES, PORTFOLIO_PERIODS } from '@/lib/constants';
import type { PortfolioStyle, PortfolioPeriod } from '@/types/dashboard';

export interface PortfolioFormValues {
  budget: number;
  style: PortfolioStyle;
  period: PortfolioPeriod;
  exclude: string;
}

export default function PortfolioForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (values: PortfolioFormValues) => void;
  isLoading: boolean;
}) {
  const [budget, setBudget] = useState('');
  const [style, setStyle] = useState<PortfolioStyle>('balanced');
  const [period, setPeriod] = useState<PortfolioPeriod>('medium');
  const [exclude, setExclude] = useState('');

  const budgetNum = Number(budget);
  const isValid = Number.isFinite(budgetNum) && budgetNum > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    onSubmit({ budget: budgetNum, style, period, exclude: exclude.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Budget */}
      <div>
        <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
          투자 금액 (USD)
        </label>
        <input
          type="number"
          min={1}
          step={1}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="5000"
          disabled={isLoading}
          className="w-full text-sm font-mono bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
          투자 성향
        </label>
        <div className="flex gap-2">
          {PORTFOLIO_STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStyle(s.key as PortfolioStyle)}
              disabled={isLoading}
              className={`flex-1 text-[11px] font-mono py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                style === s.key
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period */}
      <div>
        <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
          투자 기간
        </label>
        <div className="flex gap-2">
          {PORTFOLIO_PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key as PortfolioPeriod)}
              disabled={isLoading}
              className={`flex-1 text-[10px] font-mono py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                period === p.key
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exclude */}
      <div>
        <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
          제외 종목 <span className="text-zinc-600">(선택)</span>
        </label>
        <input
          type="text"
          value={exclude}
          onChange={(e) => setExclude(e.target.value)}
          placeholder="TSLA, META"
          disabled={isLoading}
          className="w-full text-[11px] font-mono bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full flex items-center justify-center gap-2 text-[11px] font-mono font-bold py-2.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            AI가 포트폴리오를 구성하고 있습니다...
          </>
        ) : (
          '포트폴리오 생성'
        )}
      </button>
    </form>
  );
}
