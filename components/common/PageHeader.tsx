'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({
  backHref = '/',
  backLabel = 'Terminal',
  title,
  children,
}: {
  backHref?: string;
  backLabel?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <nav className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:block">{backLabel}</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-zinc-100 tracking-tight">
              Quant<span className="text-emerald-400">ix</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{title}</span>
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-4">
            {children}
          </div>
        )}
      </div>
    </nav>
  );
}
