interface SupportCardProps {
  tier: string;
  contact: string;
}

export function SupportCard({ tier, contact }: SupportCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">Support</p>
      <p className="mt-2 text-lg font-semibold text-white">{tier}</p>
      <p className="mt-1 text-sm text-slate-400">{contact}</p>
    </div>
  );
}
