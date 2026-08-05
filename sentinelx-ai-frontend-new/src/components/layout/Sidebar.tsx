'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSearch,
  LayoutDashboard,
  Link2,
  PackageSearch,
  RadioTower,
  ShieldCheck,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Threat Intelligence', href: '/threats', icon: RadioTower },
  { label: 'Scanner', href: '/scan', icon: PackageSearch },
  { label: 'IOC Lookup', href: '/ioc', icon: FileSearch },
  { label: 'Assets', href: '/assets', icon: Database },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Integrations', href: '/integrations', icon: Link2 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const widthClass = collapsed ? 'w-20' : 'w-[280px]';

  const items = useMemo(
    () =>
      navItems.map((item) => {
        const active =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return { ...item, active };
      }),
    [pathname]
  );

  const renderItem = (item: NavItem & { active: boolean }) => {
    const { label, href, icon: Icon, active, disabled } = item;

    if (disabled) {
      return (
        <div
          key={href}
          title={collapsed ? label : undefined}
          className="block cursor-not-allowed"
          aria-disabled="true"
        >
          <motion.div
            whileHover={{ x: 3, scale: 1.01 }}
            className={[
              'group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 opacity-60',
              'text-slate-400',
            ].join(' ')}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 text-slate-500">
              <Icon className="h-5 w-5" />
            </div>

            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.16 }}
                  className="flex flex-1 items-center justify-between gap-2 text-sm font-medium"
                >
                  <span>{label}</span>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Soon
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      );
    }

    return (
      <Link key={href} href={href} title={collapsed ? label : undefined} className="block">
        <motion.div
          whileHover={{ x: 3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={[
            'group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200',
            active
              ? 'bg-cyan-500/12 text-white ring-1 ring-cyan-400/20'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white',
          ].join(' ')}
        >
          <div
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
              active
                ? 'bg-cyan-400/15 text-cyan-300'
                : 'bg-slate-900/80 text-slate-400 group-hover:bg-slate-800 group-hover:text-cyan-300',
            ].join(' ')}
          >
            <Icon className="h-5 w-5" />
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key={label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                className="text-sm font-medium"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>

          {active ? (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute inset-y-2 right-2 w-1 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]"
            />
          ) : null}
        </motion.div>
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={`fixed left-0 top-0 h-screen ${widthClass} overflow-hidden border-r border-slate-800/80 bg-slate-950/90 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl`}
    >
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-4 flex items-center justify-between gap-3 px-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-400/20">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />
            </div>

            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="min-w-0"
                >
                  <div className="truncate text-sm font-semibold tracking-wide text-white">
                    SentinelX
                  </div>
                  <div className="truncate text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    AI Security Platform
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-cyan-400/30 hover:bg-slate-800 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {items.map((item) => renderItem(item))}
        </nav>

        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner shadow-black/20"
        >
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Security Status
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">System Status</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                SECURE
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">AI Threat Engine</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                ACTIVE
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
}