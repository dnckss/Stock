import { Activity } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-100">
            Quant<span className="text-emerald-400">ix</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">실시간</span>
        </div>
      </div>
    </header>
  );
}
