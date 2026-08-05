'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  FileUser,
  LogOut,
  Menu,
  MoonStar,
  Search,
  Settings2,
  UserCircle2,
  SunMedium,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type TopbarProps = {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  notificationCount?: number;
};

export default function Topbar({
  title = 'Security Dashboard',
  subtitle = 'Monitor your security posture',
  onMenuClick,
  notificationCount,
}: TopbarProps) {
  const { user, loading, logout } = useAuth();
  const [themeDark, setThemeDark] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-cyan-400/30 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-white sm:text-lg">{title}</h1>
            <p className="truncate text-xs text-slate-400 sm:text-sm">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            className="hidden xl:flex"
            aria-label="Global search"
          >
            <div className="flex h-11 w-[340px] items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 text-slate-300 shadow-inner shadow-black/20 transition focus-within:border-cyan-400/30 hover:border-slate-700">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search threats, assets, vulnerabilities..."
                className="w-full cursor-pointer bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                aria-label="Global search"
                readOnly
              />
              <kbd className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-medium text-slate-400">
                ⌘ K
              </kbd>
            </div>
          </Link>

          <Link
            href="/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-cyan-400/30 hover:bg-slate-800 hover:text-white"
            aria-label={`Notifications: ${notificationCount ?? 0}`}
          >
            <Bell className="h-5 w-5" />
            {notificationCount ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                {notificationCount}
              </span>
            ) : null}
          </Link>

          <div className="hidden sm:flex">
            <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 shadow-inner shadow-black/20">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="leading-tight">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">AI Engine</div>
                <div className="text-sm font-semibold text-emerald-300">ONLINE</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setThemeDark((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-cyan-400/30 hover:bg-slate-800 hover:text-white"
            aria-label="Toggle theme"
          >
            {themeDark ? <MoonStar className="h-5 w-5" /> : <SunMedium className="h-5 w-5" />}
          </button>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left transition hover:border-cyan-400/30 hover:bg-slate-800"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-sm font-semibold uppercase">
                    {user?.fullName ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("") : <UserCircle2 className="h-5 w-5" />}
                  </span>
                )}
              </div>

              <div className="hidden md:block">
                <div className="text-sm font-semibold text-white">
                  {loading ? "Loading..." : user?.fullName ?? "Guest"}
                </div>
                <div className="text-xs text-slate-400">
                  {loading ? "…" : user?.email ?? "Not signed in"}
                </div>
              </div>

              <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
                  role="menu"
                >
                  <div className="border-b border-slate-800 px-3 py-2.5">
                    <div className="text-sm font-semibold text-white">
                      {user?.fullName ?? "Guest"}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {user?.email ?? "Not signed in"}
                    </div>
                    {user?.role ? (
                      <span className="mt-1.5 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        {user.role}
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href="/settings/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
                    role="menuitem"
                  >
                    <FileUser className="h-4 w-4 text-slate-400" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
                    role="menuitem"
                  >
                    <Settings2 className="h-4 w-4 text-slate-400" />
                    Account Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

