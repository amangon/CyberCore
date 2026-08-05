"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ChevronRight,
  Filter,
  Globe2,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useIntegrations } from "@/hooks/useIntegrations";
import type { IntegrationStatus } from "@/types/integration";

const STATUS_META: Record<IntegrationStatus | "all", { label: string; className: string }> = {
  all: { label: "All", className: "bg-white/10 text-white/80" },
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-300" },
  degraded: { label: "Degraded", className: "bg-amber-500/15 text-amber-300" },
  pending: { label: "Pending", className: "bg-sky-500/15 text-sky-300" },
  disconnected: { label: "Disconnected", className: "bg-rose-500/15 text-rose-300" },
  error: { label: "Error", className: "bg-rose-500/15 text-rose-300" },
};

const CATEGORY_META = {
  "threat-intelligence": "Threat intel",
  siem: "SIEM",
  edr: "EDR",
  cloud: "Cloud",
  collaboration: "Collab",
  itsm: "ITSM",
  automation: "Automation",
  custom: "Custom",
} as const;

function StatusPill({ status }: { status: IntegrationStatus }) {
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${STATUS_META[status].className}`}>{STATUS_META[status].label}</span>;
}

export default function IntegrationsPage() {
  const {
    items,
    total,
    query,
    setQuery,
    status,
    setStatus,
    category,
    setCategory,
    provider,
    setProvider,
    onlyEnabled,
    setOnlyEnabled,
    setPage,
    resetFilters,
  } = useIntegrations();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,#050816_0%,#090d1a_45%,#0c1327_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(3,7,18,0.45)] backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-300">
              <Sparkles size={13} /> SentinelX Integrations
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Enterprise connectivity command center</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">Monitor trust, health, and throughput across your security ecosystem from one place.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/integrations/settings" className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/12">Manage settings</Link>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              <Plus size={16} /> New connection
            </button>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(3,7,18,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Overview</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Healthy and high-throughput orchestration</h2>
              </div>
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/12 px-3 py-2 text-sm font-medium text-emerald-300">24 connected</div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { label: "Avg. health", value: "93%", caption: "+3.6% vs last week" },
                { label: "Requests / day", value: "88.4k", caption: "+12.1% uplift" },
                { label: "Rate limit headroom", value: "74%", caption: "Stable across providers" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.caption}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-[28px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(3,7,18,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Reliability posture</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Quick health snapshot</h2>
              </div>
              <ShieldCheck className="text-emerald-300" size={18} />
            </div>
            <div className="mt-6 space-y-3">
              {[
                { label: "Active connectors", value: "24", tone: "emerald" },
                { label: "Degraded", value: "3", tone: "amber" },
                { label: "Critical errors", value: "1", tone: "rose" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.tone === "emerald" ? "text-emerald-300" : item.tone === "amber" ? "text-amber-300" : "text-rose-300"}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_24px_80px_rgba(3,7,18,0.28)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none sm:w-72" placeholder="Search integrations" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                <Filter size={14} />
                <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="bg-transparent outline-none">
                  <option value="all" className="bg-slate-900">All status</option>
                  <option value="active" className="bg-slate-900">Active</option>
                  <option value="degraded" className="bg-slate-900">Degraded</option>
                  <option value="pending" className="bg-slate-900">Pending</option>
                  <option value="disconnected" className="bg-slate-900">Disconnected</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                <Globe2 size={14} />
                <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="bg-transparent outline-none">
                  <option value="all" className="bg-slate-900">All categories</option>
                  <option value="threat-intelligence" className="bg-slate-900">Threat Intelligence</option>
                  <option value="siem" className="bg-slate-900">SIEM</option>
                  <option value="edr" className="bg-slate-900">EDR</option>
                  <option value="cloud" className="bg-slate-900">Cloud</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                <Zap size={14} />
                <select value={provider} onChange={(event) => setProvider(event.target.value as typeof provider)} className="bg-transparent outline-none">
                  <option value="all" className="bg-slate-900">All providers</option>
                  <option value="Microsoft Defender" className="bg-slate-900">Microsoft Defender</option>
                  <option value="CrowdStrike" className="bg-slate-900">CrowdStrike</option>
                  <option value="VirusTotal" className="bg-slate-900">VirusTotal</option>
                  <option value="Splunk" className="bg-slate-900">Splunk</option>
                </select>
              </label>
              <button onClick={() => setOnlyEnabled((previous) => !previous)} className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${onlyEnabled ? "bg-violet-500/20 text-violet-200" : "bg-white/5 text-slate-300"}`}>
                {onlyEnabled ? "Enabled only" : "All connectors"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {items.map((integration) => (
              <motion.article key={integration.id} whileHover={{ y: -4, scale: 1.01 }} className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/8 to-white/4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-lg">{integration.icon}</div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{integration.name}</h3>
                        <p className="text-sm text-slate-400">{integration.provider}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-400">{integration.description}</p>
                  </div>
                  <StatusPill status={integration.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">{CATEGORY_META[integration.category]}</span>
                  {integration.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">{tag}</span>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Health</p>
                    <p className="mt-1 text-lg font-semibold text-white">{integration.healthScore}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Latency</p>
                    <p className="mt-1 text-lg font-semibold text-white">{integration.latencyMs}ms</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Success</p>
                    <p className="mt-1 text-lg font-semibold text-white">{integration.successRate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Activity size={14} /> Last sync {new Date(integration.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <Link href={`/integrations/${integration.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
                    Open details <ChevronRight size={15} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          {items.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-400">
              <p className="text-lg font-semibold text-white">No integrations matched your filters.</p>
              <p className="mt-2">Try widening the search or reset the filters to view the full catalog.</p>
              <button onClick={resetFilters} className="mt-4 rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white">Reset filters</button>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-slate-400">
            <p>Showing {items.length} of {total} integrations</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((previous) => Math.max(1, previous - 1))} className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Previous</button>
              <button onClick={() => setPage((previous) => previous + 1)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Next</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
