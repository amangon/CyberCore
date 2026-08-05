"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BellRing, CheckCheck, FileWarning, Lock, Mail, ShieldAlert } from "lucide-react";

const notifications = [
  {
    id: 1,
    title: "Critical alert: Ransomware encryption attempt detected",
    body: "An automated encryption attempt was blocked against finance-db-01.",
    time: "12 min ago",
    icon: ShieldAlert,
    tone: "text-red-300 border-red-400/20 bg-red-500/10",
  },
  {
    id: 2,
    title: "New vulnerability detected",
    body: "CVE-2024-4244 found in 3 assets across the infrastructure.",
    time: "1 hr ago",
    icon: FileWarning,
    tone: "text-amber-300 border-amber-400/20 bg-amber-500/10",
  },
  {
    id: 3,
    title: "Security score updated",
    body: "Your workspace security score increased from 82% to 87%.",
    time: "3 hrs ago",
    icon: Lock,
    tone: "text-emerald-300 border-emerald-400/20 bg-emerald-500/10",
  },
  {
    id: 4,
    title: "Weekly report ready",
    body: "Your weekly security intelligence report is available to download.",
    time: "1 day ago",
    icon: Mail,
    tone: "text-cyan-300 border-cyan-400/20 bg-cyan-500/10",
  },
];

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(to_bottom,#020617,#020617)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                <BellRing className="h-3.5 w-3.5" />
                Notifications
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Notification Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
                Security alerts, intelligence updates and platform activity.
              </p>
            </div>
            <Link
              href="/settings/notifications"
              className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <CheckCheck className="h-4 w-4" />
              Notification settings
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(168,85,247,0.08)] backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Latest activity</h2>
            <span className="text-xs text-slate-400">{notifications.length} unread</span>
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/20 hover:bg-white/10"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${notification.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white">{notification.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{notification.body}</p>
                    <span className="mt-2 inline-block text-xs text-slate-500">{notification.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

