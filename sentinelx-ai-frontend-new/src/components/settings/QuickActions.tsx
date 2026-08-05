import Link from "next/link";

interface QuickActionsProps {
  actions: Array<{ label: string; href: string }>;
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
