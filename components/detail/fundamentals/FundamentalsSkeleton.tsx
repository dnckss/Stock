'use client';

export default function FundamentalsSkeleton() {
  return (
    <div className="px-4 py-5 space-y-4 animate-pulse">
      {/* Tab placeholder */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-7 rounded-lg bg-zinc-800/60"
            style={{ width: `${48 + (i % 3) * 12}px` }}
          />
        ))}
      </div>
      {/* Content placeholder */}
      <div className="space-y-3 pt-2">
        <div className="h-4 w-3/4 rounded bg-zinc-800/50" />
        <div className="h-3 w-full rounded bg-zinc-800/40" />
        <div className="h-3 w-5/6 rounded bg-zinc-800/40" />
        <div className="h-32 w-full rounded-xl bg-zinc-800/30 mt-4" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="h-3 rounded bg-zinc-800/40" />
          <div className="h-3 rounded bg-zinc-800/40" />
          <div className="h-3 rounded bg-zinc-800/40" />
          <div className="h-3 rounded bg-zinc-800/40" />
        </div>
      </div>
    </div>
  );
}
