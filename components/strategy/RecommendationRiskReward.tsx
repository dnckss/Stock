'use client';

export default function RecommendationRiskReward({
  entryPrice,
  stopLoss,
  targetPrice,
  riskRewardRatio,
}: {
  entryPrice: number | null;
  stopLoss: number | null;
  targetPrice: number | null;
  riskRewardRatio: number | null;
}) {
  let ratio = riskRewardRatio;
  if (ratio === null && entryPrice !== null && stopLoss !== null && targetPrice !== null) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(targetPrice - entryPrice);
    if (risk > 0) ratio = reward / risk;
  }

  if (ratio === null) return null;

  const riskPct = (1 / (1 + ratio)) * 100;
  const rewardPct = (ratio / (1 + ratio)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Risk / Reward
        </span>
        <span className="text-sm font-mono font-bold text-zinc-200 tabular-nums">
          1 : {ratio.toFixed(1)}
        </span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-zinc-800">
        <div
          className="bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
          style={{ width: `${riskPct}%` }}
        />
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${rewardPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-red-400/60">RISK</span>
        <span className="text-[9px] font-mono text-emerald-400/60">REWARD</span>
      </div>
    </div>
  );
}
