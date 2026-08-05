export function DangerZone() {
  return (
    <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-4">
      <p className="text-sm font-semibold text-rose-200">Danger zone</p>
      <p className="mt-2 text-sm text-slate-300">Deactivating a workspace removes all linked integrations and access grants.</p>
      <button className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-500/12 px-4 py-2 text-sm font-semibold text-rose-200">Deactivate workspace</button>
    </div>
  );
}
