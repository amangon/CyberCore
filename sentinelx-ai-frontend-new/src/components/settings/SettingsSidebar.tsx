import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, Building2, CreditCard, KeyRound, Lock, Palette, ShieldCheck, Sparkles, Users } from "lucide-react";

const links = [
  { href: "/settings", label: "Overview", icon: Sparkles },
  { href: "/settings/profile", label: "Profile", icon: Users },
  { href: "/settings/security", label: "Security", icon: Lock },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/organization", label: "Organization", icon: Building2 },
  { href: "/settings/notifications", label: "Notifications", icon: BellRing },
  { href: "/settings/theme", label: "Theme", icon: Palette },
  { href: "/settings/api", label: "API", icon: KeyRound },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate-950/65 p-4 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
        <ShieldCheck className="text-cyan-300" size={16} />
        <p className="text-sm font-semibold text-white">SentinelX settings</p>
      </div>
      <nav className="mt-4 space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${active ? "bg-cyan-500/12 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
