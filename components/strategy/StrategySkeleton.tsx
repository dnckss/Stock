function P({ w, h = 'h-3' }: { w: string; h?: string }) {
  return <div className={`${h} ${w} bg-zinc-800 animate-pulse rounded`} />;
}

export default function StrategySkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Loading message */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-3 border-b border-zinc-800/40">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-mono text-zinc-500 animate-pulse">
          AI 전략을 생성하고 있습니다...
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[340px] shrink-0 border-r border-zinc-800">
          {/* Market overview */}
          <div className="border-b border-zinc-800">
            <div className="px-3 py-1.5 bg-zinc-800/30 flex items-center justify-between">
              <P w="w-[100px]" h="h-2.5" />
              <P w="w-[50px]" h="h-4" />
            </div>
            <div className="px-3 py-2 space-y-1.5">
              <div className="flex justify-between"><P w="w-[70px]" h="h-2" /><P w="w-[40px]" h="h-3" /></div>
              <div className="h-1 bg-zinc-800 rounded-full animate-pulse" />
            </div>
            <div className="px-3 py-2 space-y-2">
              <P w="w-[95%]" /><P w="w-[85%]" /><P w="w-[70%]" />
            </div>
          </div>
          {/* News */}
          <div className="border-b border-zinc-800">
            <div className="px-3 py-1.5 bg-zinc-800/30"><P w="w-[80px]" h="h-2.5" /></div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-3 py-1.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 animate-pulse" />
                  <P w="w-[70%]" h="h-2.5" />
                </div>
                <div className="flex gap-1 ml-3"><P w="w-8" h="h-3" /><P w="w-8" h="h-3" /></div>
              </div>
            ))}
          </div>
          {/* Econ */}
          <div className="border-b border-zinc-800">
            <div className="px-3 py-1.5 bg-zinc-800/30"><P w="w-[70px]" h="h-2.5" /></div>
            <div className="px-3 py-2 space-y-1.5"><P w="w-[90%]" /><P w="w-[75%]" /></div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-3 py-1.5 border-l-2 border-l-zinc-700"><P w="w-[60%]" h="h-2.5" /></div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col">
          {/* Sector chart */}
          <div className="shrink-0 border-b border-zinc-800">
            <div className="px-3 py-1.5 bg-zinc-800/30"><P w="w-[120px]" h="h-2.5" /></div>
            <div className="p-2 h-[140px] bg-zinc-800/10 animate-pulse" />
          </div>
          {/* Recommendations */}
          <div className="flex-1">
            <div className="px-3 py-1.5 bg-zinc-800/30 border-b border-zinc-800"><P w="w-[110px]" h="h-2.5" /></div>
            <div className="px-3 py-1 bg-zinc-900/80 border-b border-zinc-800/40 flex gap-3">
              <P w="w-[52px]" h="h-2" /><P w="w-[60px]" h="h-2" /><P w="w-[120px]" h="h-2" />
              <div className="flex-1" /><P w="w-[50px]" h="h-2" /><P w="w-[40px]" h="h-2" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-3 py-2.5 border-b border-zinc-800/50 flex items-center gap-3">
                <P w="w-[52px]" h="h-5" />
                <P w="w-[60px]" h="h-3" />
                <P w="w-[120px]" h="h-2.5" />
                <div className="flex-1"><P w="w-[80%]" h="h-2.5" /></div>
                <P w="w-[50px]" h="h-1" />
                <P w="w-[40px]" h="h-2.5" />
                <div className="w-3.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
