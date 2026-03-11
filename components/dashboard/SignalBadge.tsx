import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'positive' | 'negative' | 'neutral';

interface SignalBadgeProps {
  label: string;
  value: string;
  icon?: ReactNode;
  variant: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  positive: 'text-green-400 bg-green-500/10 border-green-500/20',
  negative: 'text-red-400 bg-red-500/10 border-red-500/20',
  neutral: 'text-zinc-300 bg-zinc-800/60 border-zinc-700/50',
};

export default function SignalBadge({
  label,
  value,
  icon,
  variant,
}: SignalBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium tabular-nums transition-colors',
        VARIANT_STYLES[variant],
      )}
    >
      {icon}
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
