import { UserCircle2 } from "lucide-react";

interface ProfileCardProps {
  name: string;
  role: string;
  email: string;
}

export function ProfileCard({ name, role, email }: ProfileCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-200">
          <UserCircle2 size={18} />
        </div>
        <div>
          <p className="text-base font-semibold text-white">{name}</p>
          <p className="text-sm text-slate-400">{role}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">{email}</p>
    </div>
  );
}
