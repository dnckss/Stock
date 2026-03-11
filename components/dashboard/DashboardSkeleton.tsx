export default function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Signal Skeleton */}
      <div className="flex flex-col items-center space-y-6 py-10 sm:py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-800" />
          <div className="h-4 w-px bg-zinc-800" />
          <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-800" />
        </div>
        <div className="h-20 w-56 animate-pulse rounded-xl bg-zinc-800/60 sm:h-24 sm:w-72 lg:h-28" />
        <div className="h-4 w-32 animate-pulse rounded-md bg-zinc-800" />
        <div className="h-3 w-40 animate-pulse rounded-md bg-zinc-800/50" />
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-32 animate-pulse rounded-full bg-zinc-800/60" />
          <div className="h-10 w-32 animate-pulse rounded-full bg-zinc-800/60" />
          <div className="h-10 w-32 animate-pulse rounded-full bg-zinc-800/60" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/80 p-6">
        <div className="mb-6 flex justify-between">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-pulse rounded bg-zinc-800" />
            <div className="h-6 w-52 animate-pulse rounded-md bg-zinc-800" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-800" />
            <div className="h-4 w-28 animate-pulse rounded-md bg-zinc-800" />
          </div>
        </div>
        <div className="h-[350px] w-full animate-pulse rounded-xl bg-zinc-800/30 sm:h-[400px]" />
      </div>

      {/* Report Skeleton */}
      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/80 p-6 sm:p-8 md:p-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-5 w-44 animate-pulse rounded-md bg-zinc-800" />
            <div className="h-3.5 w-36 animate-pulse rounded-md bg-zinc-800/60" />
          </div>
        </div>
        <div className="mb-8 h-px bg-zinc-800" />
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded-md bg-zinc-800" />
          <div className="h-4 w-full animate-pulse rounded-md bg-zinc-800/50" />
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-zinc-800/50" />
          <div className="h-4 w-4/5 animate-pulse rounded-md bg-zinc-800/50" />
          <div className="mt-6 h-6 w-40 animate-pulse rounded-md bg-zinc-800" />
          <div className="h-4 w-full animate-pulse rounded-md bg-zinc-800/50" />
          <div className="h-4 w-11/12 animate-pulse rounded-md bg-zinc-800/50" />
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-800/50" />
          <div className="mt-6 h-6 w-36 animate-pulse rounded-md bg-zinc-800" />
          <div className="h-4 w-full animate-pulse rounded-md bg-zinc-800/50" />
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-zinc-800/50" />
        </div>
      </div>
    </div>
  );
}
