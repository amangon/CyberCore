"use client";

import { motion } from "framer-motion";
import { ArrowLeft, BellRing, KeyRound, RefreshCcw, ShieldCheck, SlidersHorizontal, Webhook } from "lucide-react";
import Link from "next/link";

const settingsSections = [
  {
    title: "Connection policy",
    description: "Define how provider credentials, webhooks, and sync windows behave.",
    icon: KeyRound,
    accent: "from-violet-500/16 to-cyan-500/10",
  },
  {
    title: "Notifications",
    description: "Route health changes, incidents, and rate-limit warnings to the right channels.",
    icon: BellRing,
    accent: "from-emerald-500/16 to-cyan-500/10",
  },
  {
    title: "Sync orchestration",
    description: "Tune cadence, retry windows, and backoff behavior for each integration.",
    icon: RefreshCcw,
    accent: "from-amber-500/16 to-orange-500/10",
  },
  {
    title: "Webhook control",
    description: "Manage shared secrets, signature validation, and outbound delivery routing.",
    icon: Webhook,
    accent: "from-sky-500/16 to-indigo-500/10",
  },
];

export default function IntegrationsSettingsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,#050816_0%,#090d1a_45%,#0c1327_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Link href="/integrations" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/12">
          <ArrowLeft size={15} /> Back to integrations
        </Link>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7 shadow-[0_24px_90px_rgba(3,7,18,0.4)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Integration settings</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Govern every connector with intent</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Secure credentials, tune sync policies, and route notifications without leaving the platform.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/12 px-3 py-2 text-sm font-medium text-emerald-300">
              <ShieldCheck size={15} /> Policy aligned
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {settingsSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div key={section.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * index }} className={`rounded-[24px] border border-white/10 bg-gradient-to-br ${section.accent} p-[1px]`}>
                  <div className="h-full rounded-[23px] bg-slate-950/80 p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/8 p-2.5">
                        <Icon size={16} className="text-cyan-300" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-white">{section.title}</h2>
                        <p className="mt-1 text-sm text-slate-400">{section.description}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                      <span>Policy ready</span>
                      <span className="font-semibold text-white">Configured</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(3,7,18,0.28)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-white">
            <SlidersHorizontal size={16} /> <h2 className="text-lg font-semibold">Control center</h2>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {[
              { title: "Throttle thresholds", value: "Adaptive", detail: "Auto-adjusted per provider" },
              { title: "Webhook retries", value: "5 attempts", detail: "With exponential backoff" },
              { title: "Notification routing", value: "Multi-channel", detail: "Email, Teams, Slack" },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-xl font-semibold text-cyan-300">{item.value}</p>
                <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
