export function BrandingSettings() {
  return (
    <div className="space-y-3">
      <label className="block text-sm text-slate-300">
        <span className="mb-2 block">Company name</span>
        <input defaultValue="SentinelX AI" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      </label>
      <label className="block text-sm text-slate-300">
        <span className="mb-2 block">Primary accent</span>
        <input defaultValue="Violet" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      </label>
    </div>
  );
}
