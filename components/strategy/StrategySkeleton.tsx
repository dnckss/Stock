import { STRATEGY_TOP_PICKS_COUNT } from '@/lib/strategyConstants';

function PulseBar({ width, height = 'h-3.5' }: { width: string; height?: string }) {
  return <div className={`${height} ${width} bg-zinc-800 animate-pulse rounded`} />;
}

export default function StrategySkeleton() {
  return (
    <main className="max-w-[1400px] mx-auto px-4 py-4 space-y-3">
      {/* Market Briefing */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 animate-pulse" />
          <PulseBar width="w-[140px]" height="h-3" />
        </div>
        <div className="p-4 space-y-2.5">
          <PulseBar width="w-[95%]" />
          <PulseBar width="w-[88%]" />
          <PulseBar width="w-[76%]" />
          <PulseBar width="w-[82%]" />
        </div>
      </section>

      {/* News Themes + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3 rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800">
            <PulseBar width="w-[100px]" height="h-3" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-zinc-800/60 space-y-2">
              <PulseBar width="w-[60%]" />
              <div className="flex gap-1.5 ml-3.5">
                <div className="h-4 w-10 bg-zinc-800/60 animate-pulse rounded" />
                <div className="h-4 w-10 bg-zinc-800/60 animate-pulse rounded" />
              </div>
              <div className="ml-3.5"><PulseBar width="w-[85%]" height="h-3" /></div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800">
            <PulseBar width="w-[90px]" height="h-3" />
          </div>
          <div className="px-4 py-3 border-b border-zinc-800/60 space-y-2">
            <PulseBar width="w-[90%]" />
            <PulseBar width="w-[70%]" />
          </div>
          <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800">
            <PulseBar width="w-[80px]" height="h-3" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="px-4 py-2.5 border-b border-zinc-800/40 border-l-2 border-l-zinc-700 space-y-1.5">
              <PulseBar width="w-[55%]" />
              <PulseBar width="w-[40%]" height="h-2.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Sector Heatmap */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 border-r border-zinc-800">
            <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800">
              <PulseBar width="w-[130px]" height="h-3" />
            </div>
            <div className="p-4">
              <div className="h-[320px] bg-zinc-800/20 rounded animate-pulse" />
            </div>
          </div>
          <aside className="w-full lg:w-[320px]">
            <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800">
              <PulseBar width="w-[90px]" height="h-3" />
            </div>
            <div className="p-4 space-y-3">
              <PulseBar width="w-[60px]" height="h-2.5" />
              <PulseBar width="w-[160px]" height="h-5" />
              <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/30 p-3 space-y-2">
                <PulseBar width="w-[50px]" height="h-2.5" />
                <PulseBar width="w-[95%]" />
                <PulseBar width="w-[80%]" />
                <PulseBar width="w-[65%]" />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Top Picks */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800">
          <PulseBar width="w-[100px]" height="h-3" />
        </div>
        {Array.from({ length: STRATEGY_TOP_PICKS_COUNT }).map((_, i) => (
          <div key={i} className="p-4 border-b border-zinc-800/60">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="shrink-0 lg:w-[200px] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-20 bg-zinc-800 animate-pulse rounded-lg" />
                  <div className="h-7 w-12 bg-zinc-800/70 animate-pulse rounded" />
                </div>
                <div className="space-y-1">
                  <PulseBar width="w-full" height="h-2.5" />
                  <div className="h-1 w-full bg-zinc-800 rounded-full" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <PulseBar width="w-[50px]" height="h-2.5" />
                <PulseBar width="w-[94%]" />
                <PulseBar width="w-[88%]" />
                <PulseBar width="w-[72%]" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
