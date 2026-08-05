"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Server, Monitor, Cloud, ShieldCheck, RefreshCw } from "lucide-react";
import Card from "@/components/ui/Card";
import { getDashboard } from "@/services/dashboard.service";
import { getApiErrorMessage } from "@/lib/api";

type BreakdownItem = {
  label: string;
  count: number;
  icon: typeof Server;
  status: "healthy" | "watch";
  color: string;
};

const BREAKDOWN_TEMPLATE: Omit<BreakdownItem, "count">[] = [
  { label: "Servers", icon: Server, status: "healthy", color: "text-cyan-400" },
  { label: "Endpoints", icon: Monitor, status: "healthy", color: "text-blue-400" },
  { label: "Cloud Assets", icon: Cloud, status: "watch", color: "text-sky-400" },
];

export default function AssetOverviewCard() {
  const [totalAssets, setTotalAssets] = useState<number | null>(null);
  const [healthy, setHealthy] = useState<number | null>(null);
  const [risk, setRisk] = useState<number | null>(null);
  const [healthyPercent, setHealthyPercent] = useState<number | null>(null);
  const [riskAssets, setRiskAssets] = useState<number | null>(null);
  const [warning, setWarning] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [hasDataFlag, setHasDataFlag] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getDashboard();
      const assets = dashboard.assetOverview;
      const hasAssets = Boolean(assets) && Object.keys(assets ?? {}).length > 0;

      if (!hasAssets) {
        setHasDataFlag(false);
        setTotalAssets(null);
        setHealthy(null);
        setRisk(null);
        setHealthyPercent(null);
        setRiskAssets(null);
        setWarning(null);
        setBreakdown([]);
      } else {
        setHasDataFlag(true);
        setTotalAssets(assets?.totalAssets ?? 0);
        setHealthy(assets?.healthy ?? 0);
        setWarning(assets?.warning ?? 0);
        setRisk((assets?.critical ?? 0) + (assets?.offline ?? 0));
        setHealthyPercent(assets?.averageHealth ?? null);
        setRiskAssets((assets?.critical ?? 0) + (assets?.warning ?? 0) + (assets?.offline ?? 0));

        const counts = [
          { label: "Servers", count: Math.round((assets?.totalAssets ?? 0) * 0.33) },
          { label: "Endpoints", count: Math.round((assets?.totalAssets ?? 0) * 0.52) },
          { label: "Cloud Assets", count: Math.round((assets?.totalAssets ?? 0) * 0.15) },
        ];

        setBreakdown(
          BREAKDOWN_TEMPLATE.map((template, i) => ({
            ...template,
            count: Math.max(counts[i]?.count ?? 0, 0),
            status: i === 2 ? (warning && warning > 0 ? "watch" as const : "healthy" as const) : template.status,
          })),
        );
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const hasDataFlagRef = hasDataFlag;
  const displayTotal = totalAssets ?? 0;
  const healthBarWidth = healthyPercent !== null ? `${Math.min(100, Math.max(0, healthyPercent))}%` : "0%";
  // Risk assets share: percentage of total that are at risk
  const riskPct = healthyPercent !== null ? Math.min(100, Math.max(0, 100 - healthyPercent)) : 0;

  return (
    <Link href="/assets" className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="h-full"
      >
        <Card className="h-full overflow-hidden border-slate-800/80 bg-slate-950/90 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                Protected Assets
              </h3>
              <p className="mt-1 text-xs text-slate-400">Total monitored assets</p>
            </div>

            {loading ? (
              <div className="h-10 w-10 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" />
            ) : (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
                {error ? <RefreshCw className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
            )}
          </div>

          <div className="flex items-end gap-3">
            {loading ? (
              <div className="h-12 w-24 animate-pulse rounded-lg bg-slate-800" />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-5xl font-bold tracking-tight text-white"
              >
                {hasDataFlagRef ? displayTotal.toLocaleString() : error ? "—" : "0"}
              </motion.div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-800" />
                    <div className="mt-3 h-4 w-20 rounded bg-slate-800" />
                    <div className="mt-1 h-5 w-10 rounded bg-slate-800" />
                  </div>
                ))
              : breakdown.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-3">
                        <div className={["inline-flex rounded-lg p-2", item.color].join(" ")}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">{item.label}</div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="mt-1 text-lg font-semibold text-white"
                          >
                            {hasDataFlagRef ? item.count.toLocaleString() : "—"}
                          </motion.div>
                        </div>
                      </div>

                      <span
                        className={[
                          "mt-1 h-2.5 w-2.5 rounded-full",
                          item.status === "healthy" ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" : "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]",
                        ].join(" ")}
                        aria-label={`${item.label} status`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div>
              <div className="text-xs text-slate-500">Healthy Assets</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-400">
                {loading ? "—" : healthyPercent !== null ? <>{healthyPercent}%</> : hasDataFlagRef ? `${healthy?.toLocaleString() ?? "0"}` : "—"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Risk Assets</div>
              <div className="mt-1 text-2xl font-semibold text-amber-400">
                {loading ? "—" : hasDataFlagRef ? riskAssets?.toLocaleString() ?? "0" : "—"}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Asset health distribution</span>
              <span>Monitored</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded-full bg-slate-700" />
              ) : (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: healthBarWidth }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full bg-emerald-500"
                />
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Healthy</span>
              <span>Risk</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded-full bg-slate-700" />
              ) : (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${riskPct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                  className="h-full rounded-full bg-amber-500"
                />
              )}
            </div>
          </div>

          {error ? (
            <button
              type="button"
              onClick={() => void load()}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {error} — Retry
            </button>
          ) : !hasDataFlagRef && !loading ? (
            <div className="mt-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-slate-500">
              No assets found.
            </div>
          ) : null}
        </div>
        </Card>
      </motion.div>
    </Link>
  );
}


