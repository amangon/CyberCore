interface OrganizationCardProps {
  name: string;
  region: string;
  plan: string;
}

export function OrganizationCard({ name, region, plan }: OrganizationCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
      <p className="text-sm text-slate-400">Organization</p>
      <p className="mt-2 text-base font-semibold text-white">{name}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{region}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{plan}</span>
      </div>
    </div>
  );
}
