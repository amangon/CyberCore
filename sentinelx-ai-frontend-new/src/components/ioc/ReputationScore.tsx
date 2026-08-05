"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Activity, Clock3, Loader2, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useIOCStore } from "@/store";

type ReputationStatus = "Safe" | "Low" | "Medium" | "High" | "Critical" | "Unknown";

type ThreatSource = {
  name: string;
  status: string;
  score: number;
  lastChecked: string;
};

const DEFAULT_SCORE = 0;
const DEFAULT_SOURCES: ThreatSource[] = [];

/** Single scoring system (Option A): Threat Score where 0 = Safe, 100 = Critical. */
const getStatus = (score: number): ReputationStatus => {
  if (score <= 20) return "Safe";
  if (score <= 40) return "Low";
  if (score <= 60) return "Medium";
  if (score <= 80) return "High";
  return "Critical";
};

const getRiskTone = (score: number) => {
  if (score <= 20) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (score <= 40) return "text-lime-300 border-lime-500/30 bg-lime-500/10";
  if (score <= 60) return "text-yellow-300 border-yellow-500/30 bg-yellow-500/10";
  if (score <= 80) return "text-orange-300 border-orange-500/30 bg-orange-500/10";
  return "text-rose-400 border-rose-500/30 bg-rose-500/10";
};

/** Map raw provider keys to human-readable source names. */
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  virustotal: "VirusTotal",
  abusechThreatFox: "Abuse.ch ThreatFox",
  threatfox: "Abuse.ch ThreatFox",
  malwarebazaar: "MalwareBazaar",
  abusechMalwareBazaar: "MalwareBazaar",
  otx: "AlienVault OTX",
  shodan: "Shodan",
  ipinfo: "IPinfo",
  abuseipdb: "AbuseIPDB",
  greynoise: "GreyNoise",
  criminalip: "Criminal IP",
  pulsedive: "Pulsedive",
  nvd: "NVD",
};

function displayName(raw: string): string {
  const key = raw.trim().toLowerCase();
  return SOURCE_DISPLAY_NAMES[key] ?? raw;
}

/** Map a raw source status to a meaningful Availability label. */
function sourceStatus(value: string | undefined, score?: number): string {
  const v = (value ?? "").toLowerCase();
  if (v.includes("error") || v === "error") return "Unavailable";
  if (v.includes("rate") || v.includes("limited") || v.includes("429")) return "Rate Limited";
  if (v.includes("timeout") || v.includes("timed out")) return "Timeout";
  if (v.includes("no") || v.includes("not found") || v.includes("no data") || v.includes("no match")) return "No Match";
  if (v === "scanned" || v === "available" || v === "ok") return "Available";
  if (score !== undefined && Number.isFinite(score)) return "Available";
  return v && v !== "no data" ? v : "No Match";
}

function toSourceScore(value: number | undefined, fallback = 0): number {
  return value === undefined || !Number.isFinite(value) ? fallback : Math.min(100, Math.max(0, value));
}

function lastChecked(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

/** Derive a per-source threat verdict solely from available source data. */
function sourceVerdict(status: string, score: number): string {
  if (status === "Unavailable" || status === "Rate Limited" || status === "Timeout") return "—";
  if (score >= 80) return "Malicious";
  if (score >= 40) return "Suspicious";
  return "Clean";
}

export default function ReputationScore() {
  const { investigation, loading, analyzed } = useIOCStore();

  // Single Threat Score: use the backend-computed risk score directly (0=Safe, 100=Critical).
  const score = useMemo(() => {
    if (!investigation) return DEFAULT_SCORE;
    return Math.min(100, Math.max(0, investigation.riskScore));
  }, [investigation]);

  const sources = useMemo<ThreatSource[]>(() => {
    if (!investigation || investigation.security.length === 0) return DEFAULT_SOURCES;
    return investigation.security.slice(0, 4).map((source) => {
      const status = sourceStatus(source.status, source.score);
      return {
        name: displayName(source.name),
        status,
        score: toSourceScore(source.score, status === "No Match" ? 0 : -1),
        lastChecked: lastChecked(source.lastChecked ?? ""),
      };
    });
  }, [investigation]);

  const [count, setCount] = useState(0);
  const [circle, setCircle] = useState(0);

const status = useMemo(() => getStatus(score), [score]);

  useEffect(() => {
    if (!analyzed || loading || !investigation) {
      setCount(0);
      setCircle(0);
      return;
    }

    const duration = 1100;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(score * eased));
      setCircle(eased * 100);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, analyzed, loading, investigation]);

// Findings computed from per-source verdicts derived from real source data.
  const findings = useMemo(() => {
    const malicious = sources.filter((s) => sourceVerdict(s.status, s.score) === "Malicious").length;
    const benign = sources.filter((s) => sourceVerdict(s.status, s.score) === "Clean").length;
    const suspicious = sources.filter((s) => sourceVerdict(s.status, s.score) === "Suspicious").length;
    const unknown = sources.filter((s) => sourceVerdict(s.status, s.score) === "—").length;
    return { malicious, benign, suspicious, unknown };
  }, [sources]);

  // Provider agreement: percentage of sources sharing the dominant verdict.
  const providerAgreement = useMemo(() => {
    const total = findings.malicious + findings.benign + findings.suspicious + findings.unknown;
    if (total === 0) return 0;
    const dominant = Math.max(findings.malicious, findings.benign, findings.suspicious);
    return Math.round((dominant / total) * 100);
  }, [findings]);

  // AI recommendation derived from the real score + provider agreement.
  const recommendation = useMemo(() => {
    if (!analyzed || loading || !investigation) return "Run an IOC analysis to generate a recommendation.";
    if (score >= 80) return "Critical threat — isolate affected systems immediately and investigate all related indicators.";
    if (score >= 60) return "High risk — prioritize investigation and block this indicator across your environment.";
    if (score >= 40) return "Suspicious — monitor closely and correlate with other threat intelligence sources.";
    return "Low risk — no immediate action required. Continue routine monitoring.";
  }, [score, analyzed, loading, investigation]);

const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - circle / 100);

  return (
    <Card className="border-cyan-500/20 bg-slate-950/80 text-slate-100 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <CardHeader className="space-y-2 border-b border-white/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">Reputation Score</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Multi-source threat intelligence reputation analysis.
            </CardDescription>
          </div>
<Badge className={`border ${getRiskTone(score)} px-3 py-1`}>
            {analyzed && !loading && status === "Safe"
              ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              : analyzed && !loading && status === "Low"
                ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                : analyzed && !loading && (status === "Medium" || status === "High" || status === "Critical")
                  ? <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                  : <ShieldQuestion className="mr-1.5 h-3.5 w-3.5" />}
            {analyzed && !loading ? status : "Unknown"}
          </Badge>
        </div>
      </CardHeader>

<CardContent className="w-full min-w-0 space-y-6 p-6">
        {/* ── Gauge + Vertical Stats ── */}
        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(240px,300px)_1fr]">
          {/* Circular Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="relative flex min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/15 bg-white/5 p-6 shadow-[inset_0_0_40px_rgba(34,211,238,0.05)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_60%)]" />
            <div className="relative flex flex-col items-center">
              <div className="relative h-44 w-44 max-w-full">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="54" className="fill-none stroke-white/10" strokeWidth="8" />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="54"
                    className="fill-none stroke-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                  ) : (
                    <motion.div
                      key={count}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-5xl font-bold text-white"
                    >
                      {analyzed ? count : "—"}
                    </motion.div>
                  )}
                  <div className="mt-1 text-sm text-slate-400">/100</div>
                </div>
              </div>

              <motion.div
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="mt-4 inline-flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-center text-sm text-cyan-200"
              >
                <Activity className="h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">{analyzed ? "Live reputation analysis" : "Waiting for analysis"}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Vertical stack of stats */}
          <div className="grid w-full min-w-0 auto-rows-min content-start gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <Stat label="Threat Score" value={analyzed ? `${score}/100` : "—"} />
              <Stat label="Confidence" value={analyzed ? `${investigation?.confidence ?? 0}%` : "—"} />
              <Stat label="Risk Level" value={analyzed && !loading ? status : "—"} accent />
              <Stat label="Provider Agreement" value={analyzed ? `${providerAgreement}%` : "—"} />
            </motion.div>

            <div className="grid w-full min-w-0 grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Malicious" value={analyzed ? `${findings.malicious}` : "—"} icon={<ShieldAlert className="h-4 w-4 text-rose-300" />} />
              <Stat label="Benign" value={analyzed ? `${findings.benign}` : "—"} icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />} />
              <Stat label="Suspicious" value={analyzed ? `${findings.suspicious}` : "—"} icon={<ShieldQuestion className="h-4 w-4 text-amber-300" />} />
              <Stat label="Unknown" value={analyzed ? `${findings.unknown}` : "—"} icon={<ShieldQuestion className="h-4 w-4 text-slate-400" />} />
            </div>
          </div>
        </div>

        {/* ── Provider Cards (responsive grid) ── */}
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sources.length > 0 ? (
            sources.map((source, idx) => (
              <motion.div
                key={source.name}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 * idx }}
                className="h-full w-full min-w-0"
              >
                <Card className="flex h-full w-full min-w-0 flex-col overflow-hidden border-white/10 bg-slate-900/60 shadow-none transition-colors hover:border-cyan-400/25">
                  <CardContent className="flex w-full min-w-0 flex-1 flex-col gap-3 p-4">
                    <div className="flex w-full min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="min-w-0 truncate font-medium text-white">{source.name}</div>
                        <div className="mt-1 text-xs text-slate-500">Threat intel source</div>
                      </div>
                      {source.status !== "Unavailable" && source.status !== "Rate Limited" && source.status !== "Timeout" ? (
                        <Badge className="shrink-0 border border-white/10 bg-white/5 text-slate-200">{source.score}</Badge>
                      ) : null}
                    </div>

                    <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
                      <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: idx * 0.15 }}
                        className="inline-flex min-w-0 max-w-full break-words rounded-full border border-cyan-400/15 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200"
                      >
                        {source.status}
                      </motion.div>
                      <Badge className={`shrink-0 border ${
                        sourceVerdict(source.status, source.score) === "Malicious"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                          : sourceVerdict(source.status, source.score) === "Suspicious"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : sourceVerdict(source.status, source.score) === "Clean"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-slate-300"
                      }`}>
                        {sourceVerdict(source.status, source.score)}
                      </Badge>
                    </div>

                    <div className="mt-auto flex w-full min-w-0 items-center gap-2 text-xs text-slate-400">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 break-words">Last checked {source.lastChecked}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full w-full min-w-0 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
              {loading ? "Loading threat sources..." : "No threat source data yet. Run an IOC analysis."}
            </div>
          )}
        </div>

        {/* ── AI Recommendation (full width) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4"
        >
<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">AI Recommendation</p>
            <p className="mt-1 text-sm leading-6 text-slate-200">{recommendation}</p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
return (
    <Card className="h-full w-full min-w-0 border-white/10 bg-white/5 shadow-none">
      <CardContent className="flex h-full w-full min-w-0 flex-col justify-between gap-2 p-4">
        <div className="flex min-w-0 items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          {icon}
          <span className="min-w-0 truncate">{label}</span>
        </div>
        <div className={`min-w-0 text-2xl font-semibold ${accent ? "text-cyan-300" : "text-white"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

