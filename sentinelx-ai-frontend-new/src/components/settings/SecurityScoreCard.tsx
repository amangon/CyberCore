interface SecurityScoreCardProps {
  score: number;
}

export function SecurityScoreCard({ score }: SecurityScoreCardProps) {
  return (
    <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4">
      <p className="text-sm text-emerald-200">Security score</p>
      <p className="mt-2 text-2xl font-semibold text-white">{score}%</p>
    </div>
  );
}
