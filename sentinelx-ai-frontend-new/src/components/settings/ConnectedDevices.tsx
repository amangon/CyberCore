export function ConnectedDevices() {
  return (
    <div className="space-y-3">
      {[
        { name: "Workstation-01", trusted: true },
        { name: "Tablet-02", trusted: false },
      ].map((device) => (
        <div key={device.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
          <span>{device.name}</span>
          <span className={device.trusted ? "text-emerald-300" : "text-amber-300"}>{device.trusted ? "Trusted" : "Review"}</span>
        </div>
      ))}
    </div>
  );
}
