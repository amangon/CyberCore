export function APIConfiguration() {
  return (
    <div className="space-y-3">
      <label className="block text-sm text-slate-300">
        <span className="mb-2 block">Webhook endpoint</span>
        <input defaultValue="https://api.sentinelx.ai/webhooks" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      </label>
      <label className="block text-sm text-slate-300">
        <span className="mb-2 block">Signature verification</span>
        <input defaultValue="Required" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      </label>
    </div>
  );
}
