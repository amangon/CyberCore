interface StorageUsageCardProps {
  used: string;
  total: string;
}

export function StorageUsageCard({ used, total }: StorageUsageCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">Storage usage</p>
      <p className="mt-2 text-lg font-semibold text-white">{used} of {total}</p>
    </div>
  );
}
