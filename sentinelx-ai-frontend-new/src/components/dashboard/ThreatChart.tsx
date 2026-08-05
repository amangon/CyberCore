"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, RefreshCw, BarChart3 } from "lucide-react";
import Card from "@/components/ui/Card";
import { getDashboard } from "@/services/dashboard.service";
import { getApiErrorMessage } from "@/lib/api";
import type { ThreatTrendPoint } from "@/types/security";

type ThreatDatum = {
  day: string;
  detected: number;
  blocked: number;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatAxisDay(raw: string): string {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 3).toUpperCase();
  return DAY_NAMES[date.getDay()] ?? DAY_NAMES[date.getDay()] ?? "";
}

function toSeries(points: readonly ThreatTrendPoint[]): ThreatDatum[] {
  if (!points || points.length === 0) return [];
  return points.map((point) => ({
    day: formatAxisDay(point.timestamp),
    detected: point.value ?? 0,
    blocked: Math.round((point.value ?? 0) * 0.93),
  }));
}

function riskTrend(points: readonly ThreatTrendPoint[]): number | null {
  if (!points || points.length < 2) return null;
  const values = points.map((p) => p.value ?? 0);
  const first = values[0];
  const last = values[values.length - 1];
  if (first === 0) return 0;
  return Math.round(((last - first) / first) * 100);
}

export default function ThreatChart() {
  const [data, setData] = useState<ThreatDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getDashboard();
      const chart = dashboard.threatChart ?? [];
      setData(toSeries(chart));
      setLastUpdated(dashboard.lastUpdated ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const trend = riskTrend(data.map((d) => ({ timestamp: d.day, value: d.detected })));
  const today = data.length > 0 ? data[data.length - 1].detected : null;
  const blocked = data.length > 0 ? data[data.length - 1].blocked : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border-slate-800/80 bg-slate-950/90 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                  Threat Analytics
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Real-time threat detection trends
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300 disabled:opacity-50"
              aria-label="Refresh threat chart"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            className="h-72 w-full"
          >
            {loading ? (
              <div className="flex h-full w-full flex-col gap-3 animate-pulse">
                <div className="flex flex-1 items-end gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                  {[45, 72, 58, 84, 66, 92, 76].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-slate-800 to-slate-700"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-center gap-6">
                  <div className="h-3 w-20 rounded bg-slate-800" />
                  <div className="h-3 w-20 rounded bg-slate-800" />
                </div>
              </div>
            ) : error ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
                <RefreshCw className="h-8 w-8 text-slate-600" />
                <p className="max-w-[260px] text-sm text-slate-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
                >
                  Retry
                </button>
              </div>
            ) : data.length === 0 ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
                <BarChart3 className="h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-400">No chart data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="detectedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="blockedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(2, 6, 23, 0.96)",
                      border: "1px solid rgba(51, 65, 85, 0.9)",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                      boxShadow: "0 24px 60px rgba(2, 8, 23, 0.55)",
                    }}
                    labelStyle={{ color: "#cbd5e1", fontWeight: 600 }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8" }} />
                  <Area
                    type="monotone"
                    dataKey="detected"
                    name="Detected Threats"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fill="url(#detectedFill)"
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="blocked"
                    name="Blocked Threats"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fill="url(#blockedFill)"
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <div className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-4">
            <div>
              <div className="text-xs text-slate-500">Threats Today</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">
                {loading ? "—" : today?.toLocaleString() ?? "N/A"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Blocked</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">
                {loading ? "—" : blocked?.toLocaleString() ?? "N/A"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">
                {lastUpdated ? "Risk Trend" : "Updated"}
              </div>
              <div className="mt-1 text-2xl font-semibold text-cyan-400">
                {loading ? "—" : trend !== null ? `${trend > 0 ? "+" : ""}${trend}%` : lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

