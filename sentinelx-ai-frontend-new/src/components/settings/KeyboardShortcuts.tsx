export function KeyboardShortcuts() {
  return (
    <div className="space-y-3">
      {[
        { action: "Open search", keys: "⌘K" },
        { action: "Focus alerts", keys: "⌥A" },
      ].map((item) => (
        <div key={item.action} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
          <span>{item.action}</span>
          <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-cyan-300">{item.keys}</span>
        </div>
      ))}
    </div>
  );
}
