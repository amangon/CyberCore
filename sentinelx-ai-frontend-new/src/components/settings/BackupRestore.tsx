export function BackupRestore() {
  return (
    <div className="space-y-3">
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        <p className="text-white">Last backup completed successfully</p>
        <p className="mt-1">8:00 AM • 2026-08-01</p>
      </div>
      <button className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white">Restore backup</button>
    </div>
  );
}
