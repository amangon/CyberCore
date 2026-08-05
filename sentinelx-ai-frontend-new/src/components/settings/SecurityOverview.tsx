import { ShieldCheck } from "lucide-react";

export function SecurityOverview() {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-emerald-300">
        <ShieldCheck size={16} />
        <p className="text-sm font-semibold">Security posture healthy</p>
      </div>
      <p className="mt-2 text-sm text-slate-400">MFA, session controls, and device trust are active.</p>
    </div>
  );
}
