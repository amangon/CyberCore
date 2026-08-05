"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ShieldAlert,
  Bug,
  Radio,
  Flame,
  ShieldCheck,
  LucideIcon,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getDashboard, type NormalizedDashboard } from "@/services/dashboard.service";
import { getApiErrorMessage } from "@/lib/api";
import type { ThreatItem } from "@/types/security";

type Severity = "Critical" | "High" | "Medium" | "Low";

type Stat = {
  label: string;
  value: string;
};

const severityClasses: Record<Severity, string> = {
  Critical: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  High: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const severityDotClasses: Record<Severity, string> = {
  Critical: "bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.9)]",
  High: "bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.85)]",
  Medium: "bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.85)]",
  Low: "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.85)]",
};

const typeIcon: Record<string, LucideIcon> = {
  malware: Bug,
  ransomware: ShieldAlert,
  phishing: AlertTriangle,
  botnet: Radio,
  c2: Radio,
  exploit: Bug,
};

function getIcon(type?: string): LucideIcon {
  if (!type) return ShieldAlert;
  return typeIcon[type.toLowerCase()] ?? AlertTriangle;
}

function capitalizeSeverity(severity: string): Severity {
  const normalized = severity.toLowerCase();
  if (normalized === "critical") return "Critical";
  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  return "Low";
}

function formatTime(iso?: string): string {
  if (!iso) return "Unknown time";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function buildStats(data: NormalizedDashboard): Stat[] {
  const threatFeed = data.threatFeed ?? [];
  const activeCampaigns = threatFeed.length;
  const newIndicators = threatFeed.reduce(
    (sum, t) => (t.status && t.status.toLowerCase() === "new" ? sum + 1 : sum),
    activeCampaigns,
  );
  const blockedThreats = data.threatLevel?.blockedAttacks ?? 0;

  return [
    { label: "Active Campaigns", value: String(activeCampaigns) },
    { label: "New Indicators", value: String(newIndicators) },
    { label: "Blocked Threats", value: blockedThreats.toLocaleString() },
  ];
}

export default function ThreatFeed() {
  const [threatEvents, setThreatEvents] = useState<ThreatItem[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboard();
      const feed = [...(data.threatFeed ?? [])]
        .sort((a, b) => {
          const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 10);
      setThreatEvents(feed);
      setStats(buildStats(data));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border border-white/10 bg-slate-950/70 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="relative border-b border-white/10 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_30%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  Live Threat Feed
                </h3>
                <motion.span
                  className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1, 0.9] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Live
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Real-time global cyber threat intelligence
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300 disabled:opacity-50"
                aria-label="Refresh threat feed"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Active
              </Badge>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                  >
                    <div className="h-2 w-16 rounded bg-slate-700" />
                    <div className="mt-2 h-4 w-10 rounded bg-slate-700" />
                  </div>
                ))
              : stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-md"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-slate-50">
                      {error ? "—" : stat.value}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-slate-800" />
                      <div className="h-3 w-1/2 rounded bg-slate-800/70" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <RefreshCw className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
              >
                Retry
              </button>
            </div>
          ) : threatEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <ShieldCheck className="h-8 w-8 text-emerald-400/60" />
              <p className="text-sm text-slate-400">No active threats found</p>
            </div>
          ) : (
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.08 },
                },
              }}
            >
              {threatEvents.map((event) => {
                const Icon = getIcon(event.type);
                const severity = capitalizeSeverity(event.severity);

                return (
                  <motion.div
                    key={event.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-cyan-400/25 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="truncate font-medium text-slate-100">
                            {event.title}
                          </h4>
                          <Badge
                            className={`border ${severityClasses[severity]} px-2.5 py-0.5 text-[11px] font-medium`}
                          >
                            {severity}
                          </Badge>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                            {event.source ?? "Threat Intelligence"}
                          </span>
                          {event.status ? (
                            <>
                              <span className="text-slate-600">•</span>
                              <span>{event.status}</span>
                            </>
                          ) : null}
                          <span className="text-slate-600">•</span>
                          <span>{formatTime(event.timestamp)}</span>
                        </div>

                        {event.description ? (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                            {event.description}
                          </p>
                        ) : null}

                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${severityDotClasses[severity]} animate-pulse`}
                          />
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {event.type ? `${event.type} threat signal` : "Threat signal"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-cyan-400" />
            Global telemetry stream • auto-refreshing
          </div>
        </div>
      </Card>
    </motion.div>
  );
}