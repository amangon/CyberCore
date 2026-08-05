interface OrganizationHealthCardProps {
  status: string;
}

export function OrganizationHealthCard({ status }: OrganizationHealthCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">Organization health</p>
      <p className="mt-2 text-lg font-semibold text-white">{status}</p>
    </div>
  );
}
