"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server,
  Monitor,
  Cloud,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Activity,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  Clock,
  Bug,
  Package,
  Smartphone,
  Globe,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getAssets, getAssetsErrorMessage } from "@/services/assets.service";
import type { Asset } from "@/types/security";

// ─── Types ───────────────────────────────────────────────────────────────────

type AssetStatus = "healthy" | "warning" | "critical" | "offline";
type RiskLevel = "low" | "medium" | "high" | "critical";
type AssetType = "server" | "endpoint" | "cloud" | "mobile" | "network";

interface ActivityEvent {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  type: AssetStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<AssetStatus, { label: string; color: string; bg: string; dot: string }> = {
  healthy: { label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  warning: { label: "Warning", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  offline: { label: "Offline", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", dot: "bg-slate-400" },
};

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  high: { label: "High", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const typeIcon: Record<AssetType, React.ReactNode> = {
  server: <Server className="w-3.5 h-3.5" />,
  endpoint: <Monitor className="w-3.5 h-3.5" />,
  cloud: <Cloud className="w-3.5 h-3.5" />,
  mobile: <Smartphone className="w-3.5 h-3.5" />,
  network: <Globe className="w-3.5 h-3.5" />,
};

const activityIcon: Record<AssetStatus, React.ReactNode> = {
  healthy: <Server className="w-4 h-4" />,
  warning: <Package className="w-4 h-4" />,
  critical: <Bug className="w-4 h-4" />,
  offline: <WifiOff className="w-4 h-4" />,
};

const healthColor = (h: number) => {
  if (h >= 80) return "bg-emerald-500";
  if (h >= 50) return "bg-amber-500";
  if (h > 0) return "bg-red-500";
  return "bg-slate-600";
};

const activityTypeColor: Record<AssetStatus, string> = {
  healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const riskBarColor: Record<string, { color: string; textColor: string; trackColor: string }> = {
  "Critical Risk": { color: "bg-red-500", textColor: "text-red-400", trackColor: "bg-red-500/10" },
  "High Risk": { color: "bg-orange-500", textColor: "text-orange-400", trackColor: "bg-orange-500/10" },
  "Medium Risk": { color: "bg-amber-500", textColor: "text-amber-400", trackColor: "bg-amber-500/10" },
  "Low Risk": { color: "bg-emerald-500", textColor: "text-emerald-400", trackColor: "bg-emerald-500/10" },
};

const donutColors: Record<string, string> = {
  Healthy: "#10b981",
  Warning: "#f59e0b",
  Critical: "#ef4444",
  Offline: "#64748b",
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-700/60" />
        <div className="w-16 h-4 rounded bg-slate-700/60" />
      </div>
      <div className="w-24 h-7 rounded bg-slate-700/60 mb-2" />
      <div className="w-32 h-3 rounded bg-slate-700/60" />
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend: number;
  accent: string;
  loading?: boolean;
}

function KpiCard({ title, value, description, icon, trend, accent, loading }: KpiCardProps) {
  if (loading) return <SkeletonCard />;
  const positive = trend >= 0;
  return (
    <div className={`group relative rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-5 hover:border-${accent}-500/40 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-${accent}-500/5 cursor-default overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br from-${accent}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-${accent}-500/15 border border-${accent}-500/20 flex items-center justify-center text-${accent}-400 group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        </div>
        <div className="text-2xl font-bold text-white mb-0.5 tabular-nums">{value}</div>
        <div className="text-xs font-medium text-slate-400">{title}</div>
        <div className="text-xs text-slate-500 mt-1">{description}</div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: AssetStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${c.bg} ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
}

interface RiskBadgeProps {
  risk: RiskLevel;
}

function RiskBadge({ risk }: RiskBadgeProps) {
  const c = riskConfig[risk];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
}

interface HealthBarProps {
  value: number;
}

function HealthBar({ value }: HealthBarProps) {
  return (
    <div className="flex items-center gap-2.5 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${healthColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{value}%</span>
    </div>
  );
}

// Donut chart via SVG (data-driven from live asset summary)
function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string; pct: number }[]; total: number }) {
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circ = 2 * Math.PI * r;

const arcs = segments.map((seg, index) => {
    const start = segments
      .slice(0, index)
      .reduce((sum, prev) => sum + (prev.pct / 100) * circ, 0);
    const len = (seg.pct / 100) * circ;
    return { ...seg, strokeDasharray: `${len} ${circ - len}`, strokeDashoffset: circ - start };
  });

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="18" />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth="18"
              strokeDasharray={arc.strokeDasharray}
              strokeDashoffset={arc.strokeDashoffset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 1s ease, stroke-dashoffset 1s ease" }}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white">{total.toLocaleString()}</span>
          <span className="text-xs text-slate-400">Total Assets</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 w-full">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-slate-300">{seg.label}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400">{seg.value.toLocaleString()}</span>
              <span className="text-xs text-slate-500 w-10 text-right">{seg.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Risk gauge arc via SVG
function RiskGauge({ score }: { score: number }) {
  const r = 28;
  const circ = Math.PI * r; // half circle
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#10b981";

  return (
    <svg width="64" height="40" viewBox="0 0 64 40">
      {/* track */}
      <path
        d="M 4 36 A 28 28 0 0 1 60 36"
        fill="none"
        stroke="#1e293b"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* fill */}
      <path
        d="M 4 36 A 28 28 0 0 1 60 36"
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    healthy: 0,
    warning: 0,
    critical: 0,
    offline: 0,
    servers: 0,
    endpoints: 0,
    cloud: 0,
    averageHealth: 0,
    riskScore: 0,
    riskBreakdown: [] as { label: string; count: number; percent: number }[],
    activity: [] as ActivityEvent[],
  });

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAssets();
      setAssets([...data.assets]);
      setSummary({
        total: data.summary.total,
        healthy: data.summary.healthy,
        warning: data.summary.warning,
        critical: data.summary.critical,
        offline: data.summary.offline,
        servers: data.summary.servers,
        endpoints: data.summary.endpoints,
        cloud: data.summary.cloud,
        averageHealth: data.summary.averageHealth,
        riskScore: data.summary.riskScore,
        riskBreakdown: [...data.summary.riskBreakdown],
        activity: data.summary.activity.map((event) => ({
          id: event.id,
          icon: activityIcon[event.type] ?? activityIcon.healthy,
          title: event.title,
          description: event.description,
          time: event.time,
          type: event.type,
        })),
      });
    } catch (err) {
      setError(getAssetsErrorMessage(err));
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredAssets = assets.filter((a) => {
    const matchSearch =
      a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.owner ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.os ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const topVulnerableAssets = assets
    .filter((a) => (a.openCVEs ?? 0) > 0)
    .sort((a, b) => (b.openCVEs ?? 0) - (a.openCVEs ?? 0))
    .slice(0, 5);

  const total = summary.total || assets.length;
  const healthyPct = total > 0 ? Math.round((summary.healthy / total) * 1000) / 10 : 0;
  const criticalPct = total > 0 ? Math.round((summary.critical / total) * 1000) / 10 : 0;
  const offlinePct = total > 0 ? Math.round((summary.offline / total) * 1000) / 10 : 0;
  const warningPct = total > 0 ? Math.round((summary.warning / total) * 1000) / 10 : 0;

  const donutSegments = [
    { label: "Healthy", value: summary.healthy, color: donutColors.Healthy, pct: healthyPct },
    { label: "Warning", value: summary.warning, color: donutColors.Warning, pct: warningPct },
    { label: "Critical", value: summary.critical, color: donutColors.Critical, pct: criticalPct },
    { label: "Offline", value: summary.offline, color: donutColors.Offline, pct: offlinePct },
  ];

  const kpiData = [
    { title: "Total Assets", value: total.toLocaleString(), description: "Across all asset classes", icon: <Database className="w-5 h-5" />, trend: 1.8, accent: "blue" },
    { title: "Healthy Assets", value: summary.healthy.toLocaleString(), description: `${healthyPct}% of total`, icon: <CheckCircle className="w-5 h-5" />, trend: 2.1, accent: "emerald" },
    { title: "Critical Assets", value: summary.critical.toLocaleString(), description: "Requires immediate action", icon: <AlertTriangle className="w-5 h-5" />, trend: -4.3, accent: "red" },
    { title: "Offline Assets", value: summary.offline.toLocaleString(), description: "Heartbeat lost", icon: <WifiOff className="w-5 h-5" />, trend: -1.2, accent: "slate" },
    { title: "Servers", value: summary.servers.toLocaleString(), description: "On-prem & virtual", icon: <Server className="w-5 h-5" />, trend: 0.9, accent: "violet" },
    { title: "Endpoints", value: summary.endpoints.toLocaleString(), description: "Workstations & laptops", icon: <Monitor className="w-5 h-5" />, trend: 3.4, accent: "sky" },
    { title: "Cloud Assets", value: summary.cloud.toLocaleString(), description: "AWS, Azure, GCP", icon: <Cloud className="w-5 h-5" />, trend: 7.2, accent: "cyan" },
    { title: "Avg Health Score", value: summary.averageHealth.toFixed(1), description: "Across all assets", icon: <Activity className="w-5 h-5" />, trend: 3.1, accent: "amber" },
  ];

  const riskBreakdown = (summary.riskBreakdown.length > 0
    ? summary.riskBreakdown
    : [
        { label: "Critical Risk", count: summary.critical, percent: criticalPct },
        { label: "High Risk", count: 0, percent: 0 },
        { label: "Medium Risk", count: 0, percent: 0 },
        { label: "Low Risk", count: summary.healthy, percent: healthyPct },
      ]
  ).map((r) => {
    const config = riskBarColor[r.label] ?? riskBarColor["Low Risk"];
    return { ...r, ...config };
  });

  const statusFilterOptions: { value: AssetStatus | "all"; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "healthy", label: "Healthy" },
    { value: "warning", label: "Warning" },
    { value: "critical", label: "Critical" },
    { value: "offline", label: "Offline" },
  ];

  const overallRiskScore = summary.riskScore;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23334155%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-100 pointer-events-none" />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Assets</h1>
            </div>
            <p className="text-slate-400 text-sm ml-11">
              Manage and monitor all enterprise assets across your organization.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap ml-11 sm:ml-0">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-sm font-medium hover:bg-slate-700/80 hover:border-slate-600 transition-all duration-200 hover:text-white">
              <Upload className="w-4 h-4" />
              Import Assets
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-sm font-medium hover:bg-slate-700/80 hover:border-slate-600 transition-all duration-200 hover:text-white">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={loadAssets}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 border border-blue-500/50 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {error ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-200">Failed to load assets</p>
                <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={loadAssets}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : null}

        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {kpiData.map((kpi, i) =>
            loading ? (
              <SkeletonCard key={i} />
            ) : (
              <KpiCard key={kpi.title} {...kpi} />
            )
          )}
        </div>

        {/* ── Second Row: Health + Risk ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Enterprise Asset Health */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">Enterprise Asset Health</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time distribution across all asset classes</p>
              </div>
              <button
                onClick={loadAssets}
                className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loading ? (
              <div className="h-44 rounded-xl bg-slate-700/40 animate-pulse" />
            ) : (
              <DonutChart segments={donutSegments} total={total} />
            )}
          </div>

          {/* Asset Risk Breakdown */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">Asset Risk Breakdown</h2>
                <p className="text-xs text-slate-400 mt-0.5">Aggregate risk score across the enterprise</p>
              </div>
              <div className="flex flex-col items-center">
                <RiskGauge score={overallRiskScore} />
                <span className="text-xs text-slate-400 -mt-1">Score: {overallRiskScore}</span>
              </div>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-8 rounded-lg bg-slate-700/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {riskBreakdown.map((r) => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-300">{r.label}</span>
                      <span className={`text-xs font-semibold ${r.textColor}`}>
                        {r.count} <span className="text-slate-500 font-normal">({r.percent}%)</span>
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${r.trackColor} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full ${r.color} transition-all duration-700`}
                        style={{ width: `${r.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Third Row: Top Vulnerable Assets + Recent Activity ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Top Vulnerable Assets */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Top Vulnerable Assets</h2>
                <p className="text-xs text-slate-400 mt-0.5">Assets with the highest open CVE counts</p>
              </div>
              <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-700/40 animate-pulse" />
                ))}
              </div>
            ) : topVulnerableAssets.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
                <CheckCircle className="w-8 h-8 opacity-40" />
                <p className="text-sm">No vulnerable assets detected.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topVulnerableAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-700/40 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-600/60 transition-all duration-200 cursor-default"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
                        {typeIcon[asset.type]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{asset.hostname}</div>
                        <div className="text-xs text-slate-500 truncate">{asset.os} · {asset.owner}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <RiskBadge risk={asset.severity ?? "low"} />
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-red-400 w-16 justify-end">
                        <Bug className="w-3.5 h-3.5" />
                        {asset.openCVEs ?? 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-700/40 animate-pulse" />
                ))}
              </div>
            ) : summary.activity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
                <Clock className="w-8 h-8 opacity-40" />
                <p className="text-sm">No recent activity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summary.activity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${activityTypeColor[event.type]}`}>
                      {event.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white">{event.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{event.description}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Asset Inventory Table ──────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Asset Inventory</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? "Loading assets…" : `Showing ${filteredAssets.length} of ${assets.length} assets`}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hostname, IP, owner, OS…"
                  className="pl-9 pr-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all w-64"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AssetStatus | "all")}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-sm text-slate-300 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all cursor-pointer"
                >
                  {statusFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-slate-700/50 bg-slate-900/30">
                  <th className="text-left font-medium text-slate-400 px-6 py-3 whitespace-nowrap">Hostname</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-3 whitespace-nowrap">IP Address</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-3 whitespace-nowrap">Owner</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-3 whitespace-nowrap">OS</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-3 whitespace-nowrap">Health</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-3 whitespace-nowrap">Risk</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-3 whitespace-nowrap">CVEs</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-3 whitespace-nowrap">Last Seen</th>
                  <th className="text-right font-medium text-slate-400 px-6 py-3 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/60">
                      <td colSpan={10} className="px-6 py-4">
                        <div className="h-5 rounded bg-slate-700/40 animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Search className="w-8 h-8 opacity-40" />
                        <p className="text-sm">
                          {error ? "Failed to load assets. Click retry to try again." : "No assets match your search or filter."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
                            {typeIcon[asset.type]}
                          </div>
                          <span className="font-medium text-white">{asset.hostname}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">{asset.ipAddress}</td>
                      <td className="px-4 py-3.5 text-slate-300">{asset.owner ?? "—"}</td>
                      <td className="px-4 py-3.5 text-slate-400">{asset.os ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <HealthBar value={asset.health} />
                      </td>
                      <td className="px-4 py-3.5">
                        <RiskBadge risk={asset.risk} />
                      </td>
                      <td className="px-4 py-3.5">
                        {(asset.openCVEs ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
                            <Bug className="w-3.5 h-3.5" />
                            {asset.openCVEs}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            0
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{asset.lastSeen ?? "—"}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700/60 transition-all opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
