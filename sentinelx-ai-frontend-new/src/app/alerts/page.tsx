"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
  BellRing,
  Siren,
  Search,
  Clock,
} from "lucide-react";

import { AlertCard } from "@/components/alerts/AlertCard";
import { AlertTable } from "@/components/alerts/AlertTable";
import { AlertTrendChart, type AlertTrendPoint } from "@/components/alerts/AlertTrendChart";
import { AlertDistribution, type DistributionItem } from "@/components/alerts/AlertDistribution";

import { getAlerts, getAlertsErrorMessage } from "@/services/alerts.service";
import type { Alert } from "@/types/security";

const severityStyle: Record<string, DistributionItem> = {
  critical: {
    label: "Critical",
    value: 0,
    color: "#f43f5e",
    glowColor: "rgba(244,63,94,0.4)",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/20",
  },
  high: {
    label: "High",
    value: 0,
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.4)",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/20",
  },
  medium: {
    label: "Medium",
    value: 0,
    color: "#eab308",
    glowColor: "rgba(234,179,8,0.4)",
    bgClass: "bg-yellow-500/10",
    textClass: "text-yellow-400",
    borderClass: "border-yellow-500/20",
  },
  low: {
    label: "Low",
    value: 0,
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.4)",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/20",
  },
  info: {
    label: "Informational",
    value: 0,
    color: "#6366f1",
    glowColor: "rgba(99,102,241,0.4)",
    bgClass: "bg-indigo-500/10",
    textClass: "text-indigo-400",
    borderClass: "border-indigo-500/20",
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    investigating: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    averageRisk: 0,
    distribution: [] as DistributionItem[],
  });
  const [trend, setTrend] = useState<AlertTrendPoint[]>([]);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAlerts();
      setAlerts([...data.alerts]);
      setSummary({
        total: data.summary.total,
        open: data.summary.open,
        investigating: data.summary.investigating,
        resolved: data.summary.resolved,
        critical: data.summary.critical,
        high: data.summary.high,
        medium: data.summary.medium,
        low: data.summary.low,
        averageRisk: data.summary.averageRisk,
        distribution: [...data.summary.distribution],
      });
      setTrend([...data.trend]);
    } catch (err) {
      setError(getAlertsErrorMessage(err));
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const distribution = useMemo<DistributionItem[]>(() => {
    if (summary.distribution.length > 0) return summary.distribution;
    return (["critical", "high", "medium", "low", "info"] as const)
      .map((key) => ({
        ...severityStyle[key],
        value: summary[key as keyof typeof summary] as number,
      }))
      .filter((item) => item.value > 0 || item.label === "Critical");
  }, [summary]);

  const trendData = useMemo<AlertTrendPoint[]>(() => trend, [trend]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.10),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(to_bottom,#020617,#020617)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_50px_rgba(244,63,94,0.08)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
                <ShieldAlert className="h-3.5 w-3.5" />
                Alert Operations
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Security Alerts
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
                Monitor, triage and respond to security alerts across your infrastructure.
              </p>
            </div>

            {error ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={loadAlerts}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            ) : (
              <button
                onClick={loadAlerts}
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </button>
            )}
          </div>

          {/* ── KPI cards ─────────────────────────────────────────────── */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AlertCard
              icon={BellRing}
              title="Total Alerts"
              value={summary.total}
              loading={loading}
              color="blue"
              description={`${summary.open} open · ${summary.investigating} investigating`}
              trend={{ direction: summary.open > 0 ? "up" : "neutral", value: summary.open, label: "active" }}
            />
            <AlertCard
              icon={Siren}
              title="Critical"
              value={summary.critical}
              loading={loading}
              color="rose"
              description="Requires immediate attention"
              trend={{ direction: summary.critical > 0 ? "up" : "down", value: summary.critical, label: "critical" }}
            />
            <AlertCard
              icon={AlertTriangle}
              title="High"
              value={summary.high}
              loading={loading}
              color="amber"
              description="Elevated risk level"
              trend={{ direction: summary.high > 0 ? "up" : "down", value: summary.high, label: "high" }}
            />
            <AlertCard
              icon={CheckCircle2}
              title="Resolved"
              value={summary.resolved}
              loading={loading}
              color="emerald"
              description="Closed & acknowledged"
              trend={{ direction: summary.resolved > 0 ? "up" : "neutral", value: summary.resolved, label: "resolved" }}
            />
          </div>
        </motion.section>

        {/* ── Error banner ───────────────────────────────────────────── */}
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-200">Failed to load alerts</p>
                <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={loadAlerts}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </motion.div>
        ) : null}

        {/* ── Charts row ─────────────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-2">
          <motion.section
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(244,63,94,0.06)] backdrop-blur-xl sm:p-6"
          >
            <AlertTrendChart trend={trendData} />
          </motion.section>

          <motion.section
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(168,85,247,0.06)] backdrop-blur-xl sm:p-6"
          >
            <AlertDistribution distribution={distribution} />
          </motion.section>
        </div>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <motion.section
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(244,63,94,0.06)] backdrop-blur-xl sm:p-6"
        >
          <AlertTable alerts={alerts} />
        </motion.section>

        {/* ── Empty state ────────────────────────────────────────────── */}
        {!loading && !error && alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-white">No alerts recorded</h3>
            <p className="max-w-sm text-sm text-slate-400">
              When new security alerts are generated they will appear here in real time.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              Live monitoring active
            </div>
          </motion.div>
        ) : null}
      </div>
    </main>
  );
}
