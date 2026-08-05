export function ActivityTimeline() {
  return (
    <div className="space-y-3">
      {[
        { title: "Workspace synced", time: "2m ago" },
        { title: "Incident triage updated", time: "18m ago" },
      ].map((item) => (
        <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
          <p className="text-white">{item.title}</p>
          <p className="mt-1 text-slate-400">{item.time}</p>
        </div>
      ))}
    </div>
  );
}
