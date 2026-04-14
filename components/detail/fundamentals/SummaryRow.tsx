export default function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className={`text-[11px] font-mono tabular-nums ${color ?? 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  );
}
