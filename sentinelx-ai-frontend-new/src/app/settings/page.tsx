"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BellRing,
  ChevronRight,
  DatabaseZap,
  KeyRound,
  Lock,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import settingsService from "@/services/settings.service";

interface DashboardSummary {
  profileCompletion: number;
  securityScore: number;
  activeSessions: number;
  connectedDevices: number;
  teamMembers: number;
  lastBackup: string;
  mfaEnabled: boolean;
}

interface DashboardState {
  summary: DashboardSummary | null;
  profileName: string;
  organizationName: string;
}

const QUICK_LINKS = [
  {
    title: "Profile",
    description: "Shape identity, contact details, and role visibility.",
    href: "/settings/profile",
    icon: Users,
    accent: "from-cyan-500/20 to-violet-500/10",
  },
  {
    title: "Security",
    description: "Control MFA, password policy, and trusted sessions.",
    href: "/settings/security",
    icon: Lock,
    accent: "from-emerald-500/20 to-cyan-500/10",
  },
  {
    title: "Team",
    description: "Manage permissions, members, and role assignments.",
    href: "/settings/team",
    icon: Users,
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    title: "Notifications",
    description: "Tune alerts, workflows, and inbound channels.",
    href: "/settings/notifications",
    icon: BellRing,
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    title: "Theme",
    description: "Switch between light, dark, and system appearance.",
    href: "/settings/theme",
    icon: Palette,
    accent: "from-sky-500/20 to-cyan-500/10",
  },
  {
    title: "Billing",
    description: "Track plan health, renewal dates, and upgrade options.",
    href: "/settings/billing",
    icon: Sparkles,
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    title: "API",
    description: "Review keys, webhooks, usage, and health signals.",
    href: "/settings/api",
    icon: KeyRound,
    accent: "from-indigo-500/20 to-blue-500/10",
  },
];

export default function SettingsPage() {
  const [state, setState] = useState<DashboardState>({
    summary: null,
    profileName: "",
    organizationName: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [summary, profile, organization] = await Promise.all([
          settingsService.getDashboardSummary(),
          settingsService.getProfile(),
          settingsService.getOrganization(),
        ]);

        if (!isMounted) {
          return;
        }

        setState({
          summary,
          profileName: profile.fullName,
          organizationName: organization.name,
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = state.summary;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(135deg,#040816_0%,#07111e_40%,#0d1728_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
                <Sparkles size={13} /> Settings
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">Manage your organization, security, and platform preferences</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Monitor posture, fine-tune governance, and keep every operational surface aligned from a single premium control plane.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/12">
                Reset
              </button>
              <button className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20">
                Save changes
              </button>
              <button className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                Export settings
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.28)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Overview</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Control center snapshot</h2>
              </div>
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/12 px-3 py-2 text-sm font-medium text-emerald-300">
                Live mock state
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Security score", value: summary ? `${summary.securityScore}%` : "--", icon: ShieldCheck },
                { label: "Active sessions", value: summary ? `${summary.activeSessions}` : "--", icon: Activity },
                { label: "Connected devices", value: summary ? `${summary.connectedDevices}` : "--", icon: DatabaseZap },
                { label: "Team members", value: summary ? `${summary.teamMembers}` : "--", icon: Users },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">{item.label}</p>
                      <Icon size={16} className="text-cyan-300" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[28px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Context</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Current workspace posture</h2>
              </div>
              <ShieldCheck className="text-violet-300" size={18} />
            </div>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Primary operator</p>
                <p className="mt-1 text-lg font-semibold text-white">{loading ? "Loading…" : state.profileName}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Organization</p>
                <p className="mt-1 text-lg font-semibold text-white">{loading ? "Loading…" : state.organizationName}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Last backup</p>
                <p className="mt-1 text-lg font-semibold text-white">{summary ? new Date(summary.lastBackup).toLocaleString() : "--"}</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/65 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Quick actions</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Jump to the most relevant settings</h2>
            </div>
            <button className="rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/12">
              View all
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {QUICK_LINKS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/8 to-white/4 p-4"
                >
                  <div className={`inline-flex rounded-2xl bg-gradient-to-br ${item.accent} p-3`}>
                    <Icon size={18} className="text-cyan-200" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                  <Link href={item.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
                    Open section <ArrowRight size={15} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/65 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Security posture</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Recommended follow-ups</h2>
              </div>
              <ChevronRight className="text-slate-400" size={18} />
            </div>
            <div className="mt-5 space-y-3">
              {[
                { title: "Enable MFA for all administrators", detail: "Current state is already active for the workspace." },
                { title: "Review connected device trust", detail: "Two endpoints require explicit trust reassessment." },
                { title: "Archive older audit events", detail: "Keep retention and compliance reporting aligned." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Workspace health</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Operational readiness</h2>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Healthy
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-400">Profile completion</span>
                <span className="text-sm font-semibold text-white">{summary ? `${summary.profileCompletion}%` : "--"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-400">MFA enabled</span>
                <span className="text-sm font-semibold text-emerald-300">{summary?.mfaEnabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-400">Notification channels</span>
                <span className="text-sm font-semibold text-cyan-300">Email, Push, Slack</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
