import { STRATEGY_TOP_PICKS_COUNT } from '@/lib/strategyConstants';

export default function StrategySkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Top: Briefing */}
      <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-zinc-800/70 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-[220px] bg-zinc-800 animate-pulse rounded-md" />
            <div className="h-3 w-[140px] bg-zinc-800/70 animate-pulse rounded-md" />
          </div>
        </div>
        <blockquote className="rounded-xl border border-zinc-800/50 bg-zinc-950/30 p-5 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400/40 to-red-400/20" />
          <div className="space-y-3">
            <div className="h-4 w-[92%] bg-zinc-800 animate-pulse rounded-md" />
            <div className="h-4 w-[88%] bg-zinc-800/70 animate-pulse rounded-md" />
            <div className="h-4 w-[78%] bg-zinc-800/60 animate-pulse rounded-md" />
            <div className="h-4 w-[70%] bg-zinc-800/50 animate-pulse rounded-md" />
          </div>
          <div className="absolute -top-20 left-0 right-0 h-16 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-40" />
        </blockquote>
      </section>

      {/* Middle: Chart + Top Sector */}
      <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-4 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-4 w-[180px] bg-zinc-800 animate-pulse rounded-md" />
                <div className="h-3 w-[120px] bg-zinc-800/70 animate-pulse rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="h-3 w-[72px] bg-zinc-800/70 animate-pulse rounded-md" />
              </div>
            </div>
            <div className="h-[340px] bg-zinc-900/20 rounded-lg animate-pulse" />
          </div>

          <aside className="w-full lg:w-[360px] rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-4 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-800/70 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-[220px] bg-zinc-800 animate-pulse rounded-md" />
                <div className="h-3 w-[160px] bg-zinc-800/70 animate-pulse rounded-md" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-4 w-[96%] bg-zinc-800/80 animate-pulse rounded-md" />
              <div className="h-4 w-[92%] bg-zinc-800/60 animate-pulse rounded-md" />
              <div className="h-4 w-[85%] bg-zinc-800/50 animate-pulse rounded-md" />
              <div className="h-4 w-[70%] bg-zinc-800/40 animate-pulse rounded-md" />
            </div>
          </aside>
        </div>
      </section>

      {/* Bottom: Top Picks */}
      <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-100">AI&apos;s Top Picks</h2>
            <p className="text-xs text-zinc-500">3개의 핵심 종목을 엄선해 제공합니다</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="h-3 w-16 bg-zinc-800 animate-pulse rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: STRATEGY_TOP_PICKS_COUNT }).map((_, i) => (
            <div
              key={i}
              className="group rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-4 relative overflow-hidden"
            >
              <div className="pointer-events-none absolute -top-10 left-0 right-0 h-10 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-30" />
              <div className="flex items-center justify-between mb-3">
                <div className="h-7 w-20 bg-zinc-800 animate-pulse rounded-lg" />
                <div className="h-2 w-10 bg-zinc-800/70 animate-pulse rounded-md" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-[92%] bg-zinc-800 animate-pulse rounded-md" />
                <div className="h-3.5 w-[88%] bg-zinc-800/70 animate-pulse rounded-md" />
                <div className="h-3.5 w-[82%] bg-zinc-800/60 animate-pulse rounded-md" />
                <div className="h-3.5 w-[70%] bg-zinc-800/50 animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

