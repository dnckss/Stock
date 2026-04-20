'use client';

import { useState } from 'react';
import { Loader2, Flame, Scale, Shield, Zap, Clock, Calendar, ChevronDown, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PORTFOLIO_STYLES,
  PORTFOLIO_PERIODS,
  PORTFOLIO_BUDGET_PRESETS,
  PORTFOLIO_SECTORS,
  PORTFOLIO_MAX_WEIGHT_DEFAULT,
} from '@/lib/constants';
import type { PortfolioStyle, PortfolioPeriod } from '@/types/dashboard';

export interface PortfolioFormValues {
  budget: number;
  style: PortfolioStyle;
  period: PortfolioPeriod;
  exclude: string;
  include: string;
  preferredSectors: string[];
  maxWeight: number;
  targetReturn: string;
  dividendPreference: boolean;
}

const STYLE_ICONS: Record<string, React.ElementType> = {
  aggressive: Flame,
  balanced: Scale,
  conservative: Shield,
};

const PERIOD_ICONS: Record<string, React.ElementType> = {
  short: Zap,
  medium: Clock,
  long: Calendar,
};

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
  const [include, setInclude] = useState('');
  const [preferredSectors, setPreferredSectors] = useState<string[]>([]);
  const [maxWeight, setMaxWeight] = useState(PORTFOLIO_MAX_WEIGHT_DEFAULT);
  const [targetReturn, setTargetReturn] = useState('');
  const [dividendPreference, setDividendPreference] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const budgetNum = Number(budget);
  const isValid = Number.isFinite(budgetNum) && budgetNum > 0;

  const toggleSector = (sector: string) => {
    setPreferredSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    onSubmit({
      budget: budgetNum,
      style,
      period,
      exclude: exclude.trim(),
      include: include.trim(),
      preferredSectors,
      maxWeight,
      targetReturn: targetReturn.trim(),
      dividendPreference,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section: 투자 기본 설정 ── */}
      <div className="space-y-5">
        {/* Budget */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">투자 금액 (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-500">$</span>
            <input
              type="number"
              min={1}
              step={1}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="10,000"
              disabled={isLoading}
              className="w-full text-sm font-mono bg-zinc-900/60 border border-zinc-800/50 rounded-xl pl-8 pr-4 py-3
                         text-zinc-100 placeholder:text-zinc-600
                         focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                         disabled:opacity-50 transition-colors"
            />
          </div>
          {/* Quick presets */}
          <div className="flex gap-2 mt-2">
            {PORTFOLIO_BUDGET_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBudget(String(v))}
                disabled={isLoading}
                className={`flex-1 text-[11px] font-mono py-1.5 rounded-lg border transition-all duration-200 disabled:opacity-50
                  ${budgetNum === v
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                    : 'border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                  }`}
              >
                ${v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">투자 성향</label>
          <div className="grid grid-cols-3 gap-2.5">
            {PORTFOLIO_STYLES.map((s) => {
              const Icon = STYLE_ICONS[s.key];
              const selected = style === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStyle(s.key as PortfolioStyle)}
                  disabled={isLoading}
                  className={`relative flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all duration-200 disabled:opacity-50
                    ${selected
                      ? 'border-violet-500/50 bg-violet-500/10'
                      : 'border-zinc-800/50 hover:border-zinc-700 hover:bg-white/[0.02]'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${selected ? 'text-violet-400' : 'text-zinc-500'}`} />
                  <span className={`text-sm font-medium ${selected ? 'text-violet-300' : 'text-zinc-300'}`}>
                    {s.label}
                  </span>
                  <span className={`text-[10px] leading-tight text-center ${selected ? 'text-violet-400/70' : 'text-zinc-600'}`}>
                    {s.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Period */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">투자 기간</label>
          <div className="grid grid-cols-3 gap-2.5">
            {PORTFOLIO_PERIODS.map((p) => {
              const Icon = PERIOD_ICONS[p.key];
              const selected = period === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key as PortfolioPeriod)}
                  disabled={isLoading}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 disabled:opacity-50
                    ${selected
                      ? 'border-violet-500/50 bg-violet-500/10'
                      : 'border-zinc-800/50 hover:border-zinc-700 hover:bg-white/[0.02]'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${selected ? 'text-violet-400' : 'text-zinc-500'}`} />
                  <span className={`text-sm font-medium ${selected ? 'text-violet-300' : 'text-zinc-300'}`}>
                    {p.label}
                  </span>
                  <span className={`text-[10px] ${selected ? 'text-violet-400/70' : 'text-zinc-600'}`}>
                    {p.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section: 세부 설정 (collapsible) ── */}
      <div className="border-t border-zinc-800/50 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          <span>세부 설정</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 pt-4">
                {/* Preferred sectors */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    선호 섹터 <span className="text-zinc-600 font-normal">(선택)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PORTFOLIO_SECTORS.map((sector) => {
                      const selected = preferredSectors.includes(sector);
                      return (
                        <button
                          key={sector}
                          type="button"
                          onClick={() => toggleSector(sector)}
                          disabled={isLoading}
                          className={`text-[11px] font-mono px-2.5 py-1.5 rounded-lg border transition-all duration-200 disabled:opacity-50
                            ${selected
                              ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                              : 'border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                            }`}
                        >
                          {sector}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Include tickers */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    포함 종목 <span className="text-zinc-600 font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={include}
                    onChange={(e) => setInclude(e.target.value)}
                    placeholder="AAPL, MSFT"
                    disabled={isLoading}
                    className="w-full text-sm font-mono bg-zinc-900/60 border border-zinc-800/50 rounded-xl px-4 py-2.5
                               text-zinc-100 placeholder:text-zinc-600
                               focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                               disabled:opacity-50 transition-colors"
                  />
                </div>

                {/* Exclude tickers */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    제외 종목 <span className="text-zinc-600 font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={exclude}
                    onChange={(e) => setExclude(e.target.value)}
                    placeholder="TSLA, META"
                    disabled={isLoading}
                    className="w-full text-sm font-mono bg-zinc-900/60 border border-zinc-800/50 rounded-xl px-4 py-2.5
                               text-zinc-100 placeholder:text-zinc-600
                               focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                               disabled:opacity-50 transition-colors"
                  />
                </div>

                {/* Max single stock weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-400">최대 단일 종목 비중</label>
                    <span className="text-sm font-mono font-bold text-violet-400 tabular-nums">{maxWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(Number(e.target.value))}
                    disabled={isLoading}
                    className="w-full h-1.5 rounded-full bg-zinc-800 appearance-none cursor-pointer disabled:opacity-50
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500
                               [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-violet-400
                               [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/20
                               [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-zinc-600">10%</span>
                    <span className="text-[9px] text-zinc-600">60%</span>
                  </div>
                </div>

                {/* Target return */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    목표 수익률 <span className="text-zinc-600 font-normal">(선택)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={targetReturn}
                      onChange={(e) => setTargetReturn(e.target.value)}
                      placeholder="15"
                      disabled={isLoading}
                      className="w-full text-sm font-mono bg-zinc-900/60 border border-zinc-800/50 rounded-xl px-4 py-2.5 pr-10
                                 text-zinc-100 placeholder:text-zinc-600
                                 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                                 disabled:opacity-50 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-500">%</span>
                  </div>
                </div>

                {/* Dividend preference */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={dividendPreference}
                      onChange={(e) => setDividendPreference(e.target.checked)}
                      disabled={isLoading}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 rounded-full bg-zinc-800 border border-zinc-700/50 peer-checked:bg-violet-500/30 peer-checked:border-violet-500/50 transition-all" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-zinc-500 peer-checked:bg-violet-400 peer-checked:translate-x-4 transition-all" />
                  </div>
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    배당주 선호
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full flex items-center justify-center gap-2.5 text-sm font-semibold py-3.5 rounded-xl
                   border border-violet-500/50 bg-gradient-to-r from-violet-600/20 to-violet-500/10 text-violet-300
                   hover:from-violet-600/30 hover:to-violet-500/20 hover:text-violet-200
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI가 포트폴리오를 구성하고 있습니다...
          </>
        ) : (
          '포트폴리오 생성'
        )}
      </button>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
        <AlertTriangle className="shrink-0 w-3.5 h-3.5 text-yellow-500/60 mt-0.5" />
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          AI 분석 결과는 투자 조언이 아닙니다. 모든 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.
        </p>
      </div>
    </form>
  );
}
