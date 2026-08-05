export function PasswordChangeCard() {
  return (
    <div className="space-y-3">
      <input placeholder="Current password" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      <input placeholder="New password" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      <button className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Update password</button>
    </div>
  );
}
