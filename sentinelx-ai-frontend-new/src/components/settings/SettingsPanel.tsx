import type { ComponentType, ReactNode } from "react";
import { Sparkles, type LucideIcon } from "lucide-react";

interface SettingsPanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function SettingsPanel({
  title,
  description,
  icon: Icon = Sparkles,
  children,
  className = "",
  footer,
}: SettingsPanelProps) {
  return (
    <section className={`rounded-[24px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_12px_40px_rgba(2,8,23,0.18)] backdrop-blur-xl ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-2.5 text-cyan-200">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
      {footer ? <div className="mt-5">{footer}</div> : null}
    </section>
  );
}
