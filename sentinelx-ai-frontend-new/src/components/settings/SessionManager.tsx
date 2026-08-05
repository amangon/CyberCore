export function SessionManager() {
  return (
    <div className="space-y-3">
      {[
        { device: "MacBook Pro", status: "Active" },
        { device: "iPhone 15", status: "Idle" },
      ].map((session) => (
        <div key={session.device} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
          <span>{session.device}</span>
          <span className="text-cyan-300">{session.status}</span>
        </div>
      ))}
    </div>
  );
}
