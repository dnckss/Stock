interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export default function ChartTooltip({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/90 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <p className="mb-2.5 border-b border-zinc-800 pb-2 text-xs font-medium text-zinc-400">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-8">
            <span className="flex items-center gap-2 text-sm text-zinc-400">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="text-sm font-semibold tabular-nums text-zinc-100">
              {entry.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
