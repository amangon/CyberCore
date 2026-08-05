interface LicenseCardProps {
  type: string;
  expires: string;
}

export function LicenseCard({ type, expires }: LicenseCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">License</p>
      <p className="mt-2 text-lg font-semibold text-white">{type}</p>
      <p className="mt-1 text-sm text-slate-400">Expires {expires}</p>
    </div>
  );
}
