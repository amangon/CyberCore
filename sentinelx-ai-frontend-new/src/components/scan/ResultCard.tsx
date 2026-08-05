"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Download,
  ArrowRight,
  Sparkles,
  FileDigit,
  Globe,
  Server,
  Network,
  Activity,
  Clock,
  BadgeCheck,
  Skull,
  FileSearch,
Bug,
  Radio,
  MapPin,
  Building2,
  Fingerprint,
  Radar,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import ProviderCard from "@/components/scan/ProviderCard";
import type { ProviderStatus } from "@/types/security";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ResultStatus = "safe" | "suspicious" | "malicious";

export interface ResultCardProps {
  /** The main target (IP, URL, hash, filename) */
  target: string;
  /** Scan type label */
  scanType: string;
  /** Overall status */
  status: ResultStatus;
  /** Risk score 0-100 */
  riskScore: number;
  /** AI-driven verdict */
  aiVerdict?: string;
  /** Threat level */
  threatLevel?: string;
  /** Detection status */
  detectionStatus?: string;
  /** Timestamp */
  analysisTime?: string;
/** Detection engines e.g. "35/70" */
  detectionEngines?: string;
  /** Detection count */
  detectionCount?: string;
  /** Threat family */
  threatFamily?: string;
  /** Threat name */
  threatName?: string;
  /** Blacklist status */
  blacklistStatus?: string;
  /** Reputation */
  reputation?: string;
  /** First seen */
  firstSeen?: string;
  /** Last analysis */
  lastAnalysis?: string;

  // Network related
  /** Country */
  country?: string;
  /** City */
  city?: string;
  /** ISP */
  isp?: string;
  /** ASN */
  asn?: string;
  /** Organization */
  organization?: string;
  /** Connection type */
  connectionType?: string;
  /** Usage type */
  usageType?: string;
  /** Domain */
  domain?: string;
  /** Hostnames */
  hostnames?: string;
  /** Total reports */
  totalReports?: number;
  /** Positive reports */
  positiveReports?: number;
  /** Last reported */
  lastReported?: string;
  /** Server */
  server?: string;
  /** IP address (for URL scans) */
  ipAddress?: string;
  /** Hosting country (for URL scans) */
  hostingCountry?: string;

  // File related
  /** File type */
  fileType?: string;
  /** File size */
  fileSize?: string;
  /** MD5 hash */
  md5?: string;
  /** SHA256 hash */
  sha256?: string;

  // URL related
  /** Category */
  category?: string;
  /** Domain reputation */
  domainReputation?: string;
  /** SSL status */
  sslStatus?: string;

// Abuse related
  /** Abuse score */
  abuseScore?: number;

// Provider statuses (for provider cards)
  /** Normalized per-provider scan statuses */
  providers?: readonly ProviderStatus[];

  // Callbacks
  onExportReport?: () => void;
  onRunNewScan?: () => void;
  loading?: boolean;
}

// ─── Status configuration ────────────────────────────────────────────────────

const STATUS_CONFIG = {
  safe: {
    label: "SAFE",
    icon: ShieldCheck,
    color: "emerald",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    glow: "shadow-[0_0_40px_rgba(34,197,94,0.12)]",
    ring: "from-emerald-500/25 via-cyan-500/10 to-transparent",
    progress: "from-emerald-400 to-cyan-400",
    scoreColor: "#22c55e",
  },
  suspicious: {
    label: "SUSPICIOUS",
    icon: AlertTriangle,
    color: "amber",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    glow: "shadow-[0_0_40px_rgba(245,158,11,0.12)]",
    ring: "from-amber-500/25 via-orange-500/10 to-transparent",
    progress: "from-amber-400 to-orange-500",
    scoreColor: "#eab308",
  },
  malicious: {
    label: "MALICIOUS",
    icon: Skull,
    color: "rose",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    glow: "shadow-[0_0_40px_rgba(244,63,94,0.12)]",
    ring: "from-rose-500/25 via-red-500/10 to-transparent",
    progress: "from-rose-400 to-purple-500",
    scoreColor: "#ef4444",
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(value: string | undefined | null): string {
  if (!value) return "N/A";
  // Check if it's a Unix timestamp (seconds or milliseconds)
  const num = Number(value);
  if (Number.isFinite(num) && num > 1000000000) {
    // It's likely a Unix timestamp
    const d = num > 1000000000000 ? new Date(num) : new Date(num * 1000);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRiskScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function safeValue(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return "N/A";
  const str = String(value).trim();
  if (!str || str === "0" || str === "0%" || str === "0/0") return "N/A";
  return str;
}

// ─── Info Chip ───────────────────────────────────────────────────────────────

function InfoChip({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  const displayValue = safeValue(value);
  return (
    <div
      className={`group min-w-0 max-w-full w-full rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-all hover:border-cyan-400/20 hover:bg-cyan-500/[0.04] ${className}`}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3 w-3 shrink-0 text-cyan-400/70" />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 min-w-0 text-sm font-medium text-slate-100 break-all line-clamp-3">
        {displayValue}
      </div>
    </div>
  );
}

// ─── Summary Stat ────────────────────────────────────────────────────────────

function SummaryStat({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-3 text-center">
      <span className={`text-lg font-semibold leading-none ${tone}`}>{value}</span>
      <span className="mt-1.5 truncate text-[10px] uppercase tracking-[0.15em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-cyan-400" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {title}
      </span>
    </div>
  );
}

// ─── Risk Score Circle ───────────────────────────────────────────────────────

function RiskScoreCircle({ score, color }: { score: number; color: string }) {
  const RADIUS = 42;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const pct = formatRiskScore(score);
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <div className="relative flex h-24 w-24 items-center justify-center shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          className="stroke-white/[0.06]"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{pct}</span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-slate-500">
          Risk
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ResultCard({
  target,
  scanType,
  status,
  riskScore,
  aiVerdict,
  threatLevel,
  detectionStatus,
  analysisTime,
detectionEngines,
  detectionCount,
  threatFamily,
  threatName,
  blacklistStatus,
  reputation,
  firstSeen,
  lastAnalysis,
  country,
  city,
  isp,
  asn,
  organization,
  connectionType,
  usageType,
  domain,
  hostnames,
  totalReports,
  positiveReports,
  lastReported,
  server,
  ipAddress,
  hostingCountry,
  fileType,
  fileSize,
  md5,
  sha256,
  category,
  domainReputation,
sslStatus,
  abuseScore,
  providers,
onExportReport,
  onRunNewScan,
}: ResultCardProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.safe;
  const StatusIcon = cfg.icon;
  const pct = formatRiskScore(riskScore);

  // Group fields into sections
const threatIntel = [
    ...(threatFamily ? [{ icon: Bug, label: "Threat Family", value: threatFamily }] : []),
    ...(threatName ? [{ icon: Fingerprint, label: "Threat Name", value: threatName }] : []),
    ...(detectionEngines ? [{ icon: Radar, label: "Detection Engines", value: detectionEngines }] : []),
    ...(detectionCount ? [{ icon: Radar, label: "Detection Count", value: detectionCount }] : []),
    ...(detectionStatus ? [{ icon: Activity, label: "Detection Status", value: detectionStatus }] : []),
    ...(blacklistStatus ? [{ icon: Shield, label: "Blacklist Status", value: blacklistStatus }] : []),
    ...(reputation ? [{ icon: BadgeCheck, label: "Reputation", value: reputation }] : []),
    ...(abuseScore !== undefined ? [{ icon: AlertTriangle, label: "Abuse Score", value: `${abuseScore}%` }] : []),
  ];

const networkInfo = [
    ...(country ? [{ icon: MapPin, label: "Country", value: country }] : []),
    ...(city ? [{ icon: MapPin, label: "City", value: city }] : []),
    ...(isp ? [{ icon: Network, label: "ISP", value: isp }] : []),
    ...(asn ? [{ icon: Building2, label: "ASN", value: asn }] : []),
    ...(organization ? [{ icon: Building2, label: "Organization", value: organization }] : []),
    ...(connectionType ? [{ icon: Radio, label: "Connection Type", value: connectionType }] : []),
    ...(usageType ? [{ icon: Radio, label: "Usage Type", value: usageType }] : []),
    ...(domain ? [{ icon: Globe, label: "Domain", value: domain }] : []),
    ...(hostnames ? [{ icon: Globe, label: "Hostnames", value: hostnames }] : []),
    ...(totalReports ? [{ icon: Activity, label: "Total Reports", value: String(totalReports) }] : []),
    ...(positiveReports ? [{ icon: Activity, label: "Positive Reports", value: String(positiveReports) }] : []),
    ...(lastReported ? [{ icon: Clock, label: "Last Reported", value: formatTimestamp(lastReported) }] : []),
    ...(server ? [{ icon: Server, label: "Server", value: server }] : []),
    ...(ipAddress ? [{ icon: Globe, label: "IP Address", value: ipAddress }] : []),
    ...(hostingCountry ? [{ icon: MapPin, label: "Hosting Country", value: hostingCountry }] : []),
  ];

  const fileInfo = [
    ...(fileType ? [{ icon: FileDigit, label: "File Type", value: fileType }] : []),
    ...(fileSize ? [{ icon: FileSearch, label: "File Size", value: fileSize }] : []),
    ...(md5 ? [{ icon: Fingerprint, label: "MD5", value: md5 }] : []),
    ...(sha256 ? [{ icon: Fingerprint, label: "SHA-256", value: sha256 }] : []),
  ];

  const urlInfo = [
    ...(category ? [{ icon: Layers, label: "Category", value: category }] : []),
    ...(domainReputation ? [{ icon: BadgeCheck, label: "Domain Reputation", value: domainReputation }] : []),
    ...(sslStatus ? [{ icon: Shield, label: "SSL Status", value: sslStatus }] : []),
  ];

  const metadata = [
    ...(firstSeen ? [{ icon: Clock, label: "First Seen", value: formatTimestamp(firstSeen) }] : []),
    ...(lastAnalysis ? [{ icon: Clock, label: "Last Analysis", value: formatTimestamp(lastAnalysis) }] : []),
    ...(analysisTime ? [{ icon: Clock, label: "Analysis Time", value: formatTimestamp(analysisTime) }] : []),
    ...(aiVerdict ? [{ icon: Sparkles, label: "AI Verdict", value: aiVerdict }] : []),
    ...(threatLevel ? [{ icon: Activity, label: "Threat Level", value: threatLevel }] : []),
  ];

  const hasThreatIntel = threatIntel.length > 0;
  const hasNetworkInfo = networkInfo.length > 0;
  const hasFileInfo = fileInfo.length > 0;
  const hasUrlInfo = urlInfo.length > 0;
  const hasMetadata = metadata.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-[1px] ${cfg.glow}`}
    >
      <div className={`rounded-3xl bg-gradient-to-br ${cfg.ring} p-[1px]`}>
        <div className="rounded-3xl bg-slate-950/90 p-5 sm:p-6">
          {/* ── Status Badge + Target ── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                <Shield className="h-3.5 w-3.5 text-cyan-300" />
                Security Analysis Result
              </div>
              <Badge className={`${cfg.badge} border text-xs px-3 py-1.5`}>
                <StatusIcon className="mr-1.5 h-4 w-4" />
                {cfg.label}
              </Badge>
<div className="text-lg font-semibold text-white break-all">
                {target}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1">
                  <Globe className="h-3 w-3 text-cyan-400" />
                  {scanType}
                </span>
                {detectionStatus && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1">
                    <Activity className="h-3 w-3 text-cyan-400" />
                    {detectionStatus}
                  </span>
                )}
                {aiVerdict && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1">
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                    AI: {aiVerdict}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <RiskScoreCircle score={riskScore} color={cfg.scoreColor} />
            </div>
          </div>

          {/* ── Risk Score Bar ── */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Risk Score</span>
              <span className="font-medium text-slate-300">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${cfg.progress}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* ── Threat Intelligence Section ── */}
          {hasThreatIntel && (
            <div className="mt-6">
              <SectionHeader icon={ShieldAlert} title="Threat Intelligence" />
              <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {threatIntel.map((item) => (
                  <InfoChip key={item.label} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          )}

          {/* ── Network Information ── */}
          {hasNetworkInfo && (
            <div className="mt-5">
              <SectionHeader icon={Globe} title="Network Information" />
              <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {networkInfo.map((item) => (
                  <InfoChip key={item.label} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          )}

          {/* ── File Information ── */}
          {hasFileInfo && (
            <div className="mt-5">
              <SectionHeader icon={FileDigit} title="File Information" />
              <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {fileInfo.map((item) => (
                  <InfoChip key={item.label} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          )}

          {/* ── URL Information ── */}
          {hasUrlInfo && (
            <div className="mt-5">
              <SectionHeader icon={Globe} title="URL Information" />
              <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {urlInfo.map((item) => (
                  <InfoChip key={item.label} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          )}

          {/* ── Analysis Metadata ── */}
          {hasMetadata && (
            <div className="mt-5">
              <SectionHeader icon={Clock} title="Analysis Metadata" />
              <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {metadata.map((item) => (
                  <InfoChip key={item.label} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          )}

{/* ── Provider Summary ── */}
          {providers && providers.length > 0 && (
            <div className="mt-5">
              <SectionHeader icon={Activity} title="Provider Summary" />
              <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <SummaryStat label="Total" value={providers.length} tone="text-white" />
                <SummaryStat
                  label="Successful"
                  value={providers.filter((p) => p.success).length}
                  tone="text-emerald-300"
                />
                <SummaryStat
                  label="Not Configured"
                  value={providers.filter((p) => String(p.status).toLowerCase() === "not_configured").length}
                  tone="text-slate-300"
                />
                <SummaryStat
                  label="Failed"
                  value={providers.filter((p) => !p.success && p.status !== "idle" && String(p.status).toLowerCase() !== "not_configured").length}
                  tone="text-rose-300"
                />
                <SummaryStat
                  label="Timeouts"
                  value={providers.filter((p) => ["timeout", "rate_limited", "network_error"].includes(String(p.status).toLowerCase())).length}
                  tone="text-yellow-300"
                />
              </div>
            </div>
          )}

{/* ── Provider Statuses ── */}
          {providers && providers.length > 0 && (
            <div className="mt-5">
              <SectionHeader icon={Radar} title="Provider Status" />
              <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
                {providers.map((p, i) => (
                  <ProviderCard key={`${p.provider}-${i}`} provider={p} />
                ))}
              </div>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="mt-6 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            {onExportReport && (
              <Button
                onClick={onExportReport}
                variant="outline"
                className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
              >
                <Download className="mr-2 h-4 w-4 shrink-0" />
                Export Report
              </Button>
            )}
            {onRunNewScan && (
              <Button
                onClick={onRunNewScan}
                className="flex-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white hover:brightness-110 transition"
              >
                Run New Scan
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
