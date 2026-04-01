import type {
  StrategyDirection,
  StrategyConfidence,
  MarketRegime,
  RiskWarningLevel,
} from '@/types/dashboard';

export const STRATEGY_TOP_PICKS_COUNT = 5;

// ── Divergence chart colors ──
export const STRATEGY_DIVERGENCE_COLOR_RED = { r: 239, g: 68, b: 68 } as const;
export const STRATEGY_DIVERGENCE_COLOR_GREEN = { r: 34, g: 197, b: 94 } as const;
export const STRATEGY_DIVERGENCE_BAR_ALPHA = 0.86;

// ── Direction ──
export const STRATEGY_DIRECTION_CONFIG: Record<
  StrategyDirection,
  { text: string; bg: string; border: string; glow: string; label: string }
> = {
  BUY: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/40', glow: 'shadow-green-500/10', label: 'BUY' },
  SELL: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', glow: 'shadow-red-500/10', label: 'SELL' },
  SHORT: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/40', glow: 'shadow-purple-500/10', label: 'SHORT' },
  HOLD: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/10', label: 'HOLD' },
};

// ── Confidence ──
export const STRATEGY_CONFIDENCE_CONFIG: Record<
  StrategyConfidence,
  { width: string; color: string; text: string; label: string }
> = {
  high: { width: 'w-full', color: 'bg-emerald-500', text: 'text-emerald-400', label: 'HIGH' },
  medium: { width: 'w-2/3', color: 'bg-yellow-500', text: 'text-yellow-400', label: 'MED' },
  low: { width: 'w-1/3', color: 'bg-zinc-500', text: 'text-zinc-400', label: 'LOW' },
};

// ── Market Regime ──
export const STRATEGY_REGIME_CONFIG: Record<
  MarketRegime,
  { label: string; text: string; bg: string; border: string }
> = {
  bull: { label: 'BULL', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  bear: { label: 'BEAR', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  sideways: { label: 'SIDEWAYS', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  volatile: { label: 'VOLATILE', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
};

// ── Risk Warning ──
export const STRATEGY_RISK_WARNING_CONFIG: Record<
  RiskWarningLevel,
  { border: string; bg: string; text: string; icon: string }
> = {
  critical: { border: 'border-red-500/60', bg: 'bg-red-500/5', text: 'text-red-300', icon: 'text-red-400' },
  high: { border: 'border-orange-500/40', bg: 'bg-orange-500/5', text: 'text-orange-300', icon: 'text-orange-400' },
  medium: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', text: 'text-yellow-300', icon: 'text-yellow-400' },
};

// ── Price chart reference line colors ──
export const PRICE_ENTRY_COLOR = '#3b82f6';
export const PRICE_STOPLOSS_COLOR = '#ef4444';
export const PRICE_TARGET_COLOR = '#22c55e';

// ── Technical indicator thresholds ──
export const RSI_OVERSOLD = 30;
export const RSI_OVERBOUGHT = 70;
