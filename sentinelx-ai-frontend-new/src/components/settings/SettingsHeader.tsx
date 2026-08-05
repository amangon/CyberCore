import { Sparkles } from "lucide-react";

interface SettingsHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function SettingsHeader({ title, description, action }: SettingsHeaderProps) {
  return (
    <header className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.32)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
            <Sparkles size={13} /> Settings
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </header>
  );
}
