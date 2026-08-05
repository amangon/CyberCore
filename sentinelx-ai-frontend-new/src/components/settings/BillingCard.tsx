interface BillingCardProps {
  plan: string;
  amount: string;
}

export function BillingCard({ plan, amount }: BillingCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">Billing</p>
      <p className="mt-2 text-lg font-semibold text-white">{plan}</p>
      <p className="mt-1 text-sm text-slate-400">{amount}</p>
    </div>
  );
}
