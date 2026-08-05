export function NotificationSettings() {
  return (
    <div className="space-y-3">
      {[
        { label: "Email alerts", value: true },
        { label: "Push notifications", value: true },
        { label: "Slack digest", value: false },
      ].map((item) => (
        <label key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
          <span>{item.label}</span>
          <input type="checkbox" defaultChecked={item.value} className="h-4 w-4 rounded border-white/20 bg-slate-950" />
        </label>
      ))}
    </div>
  );
}
