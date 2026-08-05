"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { getDashboard } from "@/services/dashboard.service";
import { getApiErrorMessage } from "@/lib/api";

interface SeverityBucket {
  readonly label: string;
  readonly count: number | null;
  readonly color: string;
  readonly text: string;
  readonly badge: string;
}

const severityConfig: readonly SeverityBucket[] = [
  { label: "Critical", count: null, color: "bg-red-500", text: "text-red-400", badge: "border-red-500/20 bg-red-500/10 text-red-300" },
  { label: "High", count: null, color: "bg-orange-500", text: "text-orange-400", badge: "border-orange-500/20 bg-orange-500/10 text-orange-300" },
  { label: "Medium", count: null, color: "bg-amber-400", text: "text-amber-400", badge: "border-amber-500/20 bg-amber-500/10 text-amber-300" },
  { label: "Low", count: null, color: "bg-emerald-500", text: "text-emerald-400", badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
] as const;

const EMPTY_BUCKETS: SeverityBucket[] = severityConfig.map((item) => ({ ...item }));

export default function IncidentCard() {
  const [total, setTotal] = useState<number | null>(null);
  const [investigating, setInvestigating] = useState<number | null>(null);
  const [resolvedToday, setResolvedToday] = useState<number | null>(null);
  const [buckets, setBuckets] = useState<SeverityBucket[]>(EMPTY_BUCKETS);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getDashboard();
      const incident = dashboard.incidentSummary;

      // The summary mapper always returns object; treat all-zero + no counts
      // as "no data" when the backend didn't provide the field at all.
      const rawPayload = incident;
      const isEmpty = Object.values(rawPayload ?? {}).every((v) => v === 0);

      if (isEmpty) {
        setHasData(false);
        setTotal(null);
        setInvestigating(null);
        setResolvedToday(null);
        setBuckets(EMPTY_BUCKETS);
        return;
      }

      setHasData(true);
      setTotal(incident.total);
      setInvestigating(incident.investigating);
      setResolvedToday(incident.resolvedToday);

      const counts: Record<string, number | null> = {
        Critical: incident.critical,
        High: incident.high,
        Medium: incident.medium,
        Low: incident.low,
      };

      setBuckets(
        severityConfig.map((item) => ({
          ...item,
          count: counts[item.label] ?? null,
        })),
      );
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border-slate-800/80 bg-slate-950/90 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400">
                {loading ? (
                  <div className="h-5 w-5 animate-pulse rounded-md bg-slate-800" />
                ) : error ? (
                  <RefreshCw className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                  Active Incidents
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Security incidents detected
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold tracking-tight text-white">
                {loading ? "—" : total ?? (error ? "—" : "0")}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex animate-pulse items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                      <div className="h-4 w-20 rounded bg-slate-800" />
                    </div>
                    <div className="h-4 w-8 rounded bg-slate-800" />
                  </div>
                ))
              : buckets.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={["h-2.5 w-2.5 rounded-full shadow-lg", item.color].join(" ")} />
                      <span className="text-sm font-medium text-slate-200">{item.label}</span>
                      <Badge className={["ml-1 border", item.badge].join(" ")}>
                        Severity
                      </Badge>
                    </div>
                    <div className={["text-sm font-semibold", item.text].join(" ")}>
                      {item.count ?? "—"}
                    </div>
                  </motion.div>
                ))}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div>
              <div className="text-xs text-slate-500">Investigating</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">
                {loading ? "…" : investigating ?? (error ? "—" : "0")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Resolved Today</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">
                {loading ? "…" : resolvedToday ?? (error ? "—" : "0")}
              </div>
            </div>
          </div>

          {error ? (
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              {error} — Retry
            </button>
          ) : !hasData && !loading ? (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300">
              No active incidents.
            </div>
          ) : (
            <Link
              href="/incidents"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-500/30 hover:bg-slate-900 hover:text-white"
            >
              View All Incidents
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

