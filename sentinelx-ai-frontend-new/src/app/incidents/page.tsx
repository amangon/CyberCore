"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Clock, ShieldAlert, User } from "lucide-react";

const incidents = [
  {
    id: "INC-1042",
    title: "Ransomware Encryption Attempt",
    severity: "Critical",
    status: "Investigating",
    asset: "finance-db-01",
    owner: "J. Okafor",
    time: "12 min ago",
    color: "border-red-500/20 bg-red-500/10 text-red-300",
  },
  {
    id: "INC-1041",
    title: "Credential Reuse Attack",
    severity: "High",
    status: "Contained",
    asset: "vpn-gateway-02",
    owner: "M. Chen",
    time: "48 min ago",
    color: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },
  {
    id: "INC-1040",
    title: "Unusual Lateral Movement",
    severity: "Medium",
    status: "Triaging",
    asset: "app-cluster-05",
    owner: "P. Nair",
    time: "2 hrs ago",
    color: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  {
    id: "INC-1039",
    title: "Malicious PowerShell Execution",
    severity: "High",
    status: "Resolved",
    asset: "workstation-118",
    owner: "D. Silva",
    time: "5 hrs ago",
    color: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },
];

const stats = [
  { label: "Open Incidents", value: "12", icon: AlertTriangle },
  { label: "Critical", value: "3", icon: ShieldAlert },
  { label: "Investigating", value: "7", icon: User },
  { label: "Resolved Today", value: "18", icon: Clock },
];

export default function IncidentsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.10),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(to_bottom,#020617,#020617)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_50px_rgba(239,68,68,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-2">
            <p className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              Incident Response
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Security Incidents
            </h1>
            <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
              Track, triage and resolve security incidents across your infrastructure.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">{s.label}</div>
                      <div className="mt-1 text-2xl font-semibold text-white">{s.value}</div>
                    </div>
                    <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-red-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(168,85,247,0.08)] backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Recent Incidents</h2>
            <span className="text-xs text-slate-400">{incidents.length} active records</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {incidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id.toLowerCase()}`}
                className="group block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-red-400/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{incident.id}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${incident.color}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-sm font-semibold text-white">{incident.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {incident.time}
                      </span>
                      <span>{incident.asset}</span>
                      <span>{incident.owner}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

