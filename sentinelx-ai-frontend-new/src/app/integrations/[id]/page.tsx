"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, Clock3, Gauge, Radar, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useIntegrationById } from "@/hooks/useIntegrations";
import { useParams } from "next/navigation";

export default function IntegrationDetailPage() {
  const params = useParams<{ id: string }>();
  const integration = useIntegrationById(params?.id ?? "");

  if (!integration) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,#050816_0%,#090d1a_45%,#0c1327_100%)] px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-slate-950/60 p-10 text-center backdrop-blur-xl">
          <p className="text-lg font-semibold text-white">Integration not found.</p>
          <p className="mt-2 text-sm text-slate-400">The requested connector is not available in the current mock environment.</p>
          <Link href="/integrations" className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white">Back to integrations</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,#050816_0%,#090d1a_45%,#0c1327_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Link href="/integrations" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/12">
          <ArrowLeft size={15} /> Back to integrations
        </Link>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7 shadow-[0_24px_90px_rgba(3,7,18,0.4)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-300">
                <Sparkles size={13} /> {integration.provider}
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white">{integration.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{integration.description}</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-emerald-400/30 bg-emerald-500/12 px-4 py-3 text-sm font-medium text-emerald-300">
              {integration.isEnabled ? "Connected and healthy" : "Configuration pending"}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-slate-400">
                <Gauge size={16} /> <span className="text-sm font-medium">Performance overview</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Health", value: `${integration.healthScore}%` },
                  { label: "Latency", value: `${integration.latencyMs}ms` },
                  { label: "Success", value: `${integration.successRate.toFixed(1)}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 p-5">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck size={16} /> <span className="text-sm font-medium">Connection status</span>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-400">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3">
                  <span>Authentication</span>
                  <span className="font-semibold text-white">{integration.connection.authMethod}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3">
                  <span>SSL</span>
                  <span className="font-semibold text-white">{integration.connection.sslEnabled ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3">
                  <span>Webhook</span>
                  <span className="font-semibold text-white">{integration.connection.webhookConfigured ? "Configured" : "Pending"}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white">
              <Activity size={16} /> <h2 className="text-lg font-semibold">Recent activity</h2>
            </div>
            <div className="mt-5 space-y-3">
              {integration.syncHistory.slice(0, 3).map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{event.summary}</p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-400">{event.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2"><Clock3 size={14} /> {new Date(event.timestamp).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-2"><Zap size={14} /> {event.recordsProcessed.toLocaleString()} records</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white">
              <Radar size={16} /> <h2 className="text-lg font-semibold">Operational metrics</h2>
            </div>
            <div className="mt-5 space-y-3">
              {integration.metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{metric.label}</span>
                    <span className="font-semibold text-white">{metric.value}{metric.unit}</span>
                  </div>
                  {metric.changePercent ? <p className="mt-2 text-xs text-cyan-300">{metric.changePercent > 0 ? "+" : ""}{metric.changePercent}% vs prior window</p> : null}
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
