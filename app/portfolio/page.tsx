'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchPortfolio, parsePortfolioResult } from '@/lib/api';
import PortfolioForm from '@/components/portfolio/PortfolioForm';
import PortfolioResultView from '@/components/portfolio/PortfolioResultView';
import type { PortfolioFormValues } from '@/components/portfolio/PortfolioForm';
import type { PortfolioResult } from '@/types/dashboard';

export default function PortfolioPage() {
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (values: PortfolioFormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const raw = await fetchPortfolio({
        budget: values.budget,
        style: values.style,
        period: values.period,
        exclude: values.exclude || undefined,
      });
      const parsed = parsePortfolioResult(raw);
      if (!parsed) {
        setError('포트폴리오 결과를 파싱할 수 없습니다');
      } else {
        setResult(parsed);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '포트폴리오를 생성할 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="font-mono text-[9px] uppercase tracking-widest">Terminal</span>
            </Link>
            <span className="text-zinc-800">|</span>
            <span className="font-mono text-[11px] font-bold text-zinc-100 tracking-wider">
              Quant<span className="text-green-500">ix</span>
            </span>
            <span className="text-[9px] text-zinc-600 font-mono">PORTFOLIO</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Form */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <h1 className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              AI 포트폴리오 빌더
            </h1>
          </div>
          <PortfolioForm onSubmit={handleSubmit} isLoading={isLoading} />
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-[11px] text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && <PortfolioResultView data={result} />}
      </main>

      <footer className="border-t border-zinc-800 mt-8">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between text-[8px] font-mono text-zinc-700">
          <span>QUANTIX PORTFOLIO ENGINE</span>
          <span>&copy; 2025 Quantix</span>
        </div>
      </footer>
    </div>
  );
}
