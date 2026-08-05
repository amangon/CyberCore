export function AuditLogs() {
  return (
    <div className="space-y-3">
      {[
        { action: "Updated MFA policy", actor: "Ava Chen" },
        { action: "Imported threat intel", actor: "Noah Patel" },
      ].map((item) => (
        <div key={item.action} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
          <p className="text-white">{item.action}</p>
          <p className="mt-1 text-slate-400">{item.actor}</p>
        </div>
      ))}
    </div>
  );
}
