export function SettingsSearch() {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-400">
      <span>🔎</span>
      <input placeholder="Search settings" className="w-full bg-transparent outline-none" />
    </label>
  );
}
