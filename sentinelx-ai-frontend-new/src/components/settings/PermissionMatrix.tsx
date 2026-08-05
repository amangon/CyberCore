export function PermissionMatrix() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
      <div className="grid grid-cols-3 border-b border-white/10 px-3 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
        <span>Scope</span>
        <span>Role</span>
        <span>Status</span>
      </div>
      {[
        { scope: "Dashboard", role: "Admin", status: "Granted" },
        { scope: "Incidents", role: "Analyst", status: "Granted" },
      ].map((item) => (
        <div key={item.scope} className="grid grid-cols-3 border-t border-white/10 px-3 py-3 text-sm text-slate-300">
          <span>{item.scope}</span>
          <span>{item.role}</span>
          <span className="text-emerald-300">{item.status}</span>
        </div>
      ))}
    </div>
  );
}
