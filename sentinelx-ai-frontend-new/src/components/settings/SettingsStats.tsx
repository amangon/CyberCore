interface SettingsStatsProps {
  items: Array<{ label: string; value: string }>;
}

export function SettingsStats({ items }: SettingsStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">{item.label}</p>
          <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
