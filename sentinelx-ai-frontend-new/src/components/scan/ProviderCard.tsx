"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldQuestion,
  KeyRound,
  Ban,
  Loader2,
  Activity,
  WifiOff,
  CircleSlash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ProviderStatus } from "@/types/security";

/**
 * ProviderCard — renders a single threat-intelligence provider's scan result.
 *
 * The UI is driven ENTIRELY by the backend's explicit provider status enum
 * (`completed`, `not_configured`, `authentication_failed`, `timeout`,
 * `rate_limited`, `service_unavailable`, `network_error`). It never infers
 * "Error". A provider that is intentionally disabled / missing an API key is
 * shown as "Not Configured" — NOT an error.
 */

// ─── Status enum → visual mapping ────────────────────────────────────────────

type StatusMeta = {
  label: string;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
  health: "healthy" | "degraded" | "disabled" | "offline";
  /** Human-readable description shown under the header (never fabricated). */
  description: string;
};

function statusMeta(status: string): StatusMeta {
  const s = String(status).toLowerCase();

  switch (s) {
    case "completed":
    case "200":
    case "ok":
      return {
        label: "Completed",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        icon: CheckCircle2,
        health: "healthy",
        description: "API call succeeded.",
      };
    case "not_configured":
    case "unavailable":
    case "api key missing":
    case "missing api key":
    case "not configured":
      return {
        label: "Not Configured",
        tone: "border-slate-500/30 bg-slate-500/10 text-slate-300",
        icon: CircleSlash2,
        health: "disabled",
        description: "Integration is disabled because no API key is configured.",
      };
    case "authentication_failed":
    case "auth failed":
    case "401":
    case "403":
    case "forbidden":
      return {
        label: "Authentication Failed",
        tone: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        icon: KeyRound,
        health: "offline",
        description: "Invalid API key or credentials.",
      };
    case "timeout":
    case "408":
      return {
        label: "Timeout",
        tone: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        icon: Clock,
        health: "degraded",
        description: "Request timed out.",
      };
    case "rate_limited":
    case "rate limited":
    case "rate limit":
    case "429":
      return {
        label: "Rate Limited",
        tone: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        icon: AlertTriangle,
        health: "degraded",
        description: "Provider quota exceeded.",
      };
    case "service_unavailable":
    case "service unavailable":
    case "internal error":
    case "provider internal error":
    case "500":
    case "503":
      return {
        label: "Service Unavailable",
        tone: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        icon: XCircle,
        health: "offline",
        description: "Provider is down or unavailable.",
      };
    case "network_error":
    case "network":
    case "connection failed":
      return {
        label: "Network Error",
        tone: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        icon: WifiOff,
        health: "offline",
        description: "Connection to the provider failed.",
      };
    case "no_match":
    case "no match":
    case "no data":
    case "no result":
    case "404":
    case "400":
      return {
        label: "No Data",
        tone: "border-slate-500/30 bg-slate-500/10 text-slate-300",
        icon: ShieldQuestion,
        health: "degraded",
        description: "Provider returned no data for this indicator.",
      };
    case "idle":
      return {
        label: "Idle",
        tone: "border-slate-600/30 bg-slate-600/10 text-slate-300",
        icon: Loader2,
        health: "degraded",
        description: "Awaiting scan.",
      };
    case "error":
    case "failed":
      return {
        label: "Error",
        tone: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        icon: XCircle,
        health: "offline",
        description: "An unexpected provider error occurred.",
      };
    default:
      return {
        label: "No Data",
        tone: "border-slate-500/30 bg-slate-500/10 text-slate-300",
        icon: ShieldQuestion,
        health: "degraded",
        description: "Provider returned no data.",
      };
  }
}

function healthMeta(health: string) {
  switch (health) {
    case "healthy":
      return { label: "Healthy", tone: "text-emerald-400", dot: "bg-emerald-400" };
    case "degraded":
      return { label: "Degraded", tone: "text-amber-400", dot: "bg-amber-400" };
    case "disabled":
      return { label: "Disabled", tone: "text-slate-400", dot: "bg-slate-400" };
    case "offline":
      return { label: "Offline", tone: "text-rose-400", dot: "bg-rose-400" };
    default:
      return { label: "Unknown", tone: "text-slate-400", dot: "bg-slate-400" };
  }
}

function verdictBadge(verdict: string) {
  const v = String(verdict || "").toLowerCase();
  if (v === "malicious") return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  if (v === "suspicious") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (v === "clean") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function providerInitial(label: string): string {
  return String(label || "?").charAt(0).toUpperCase();
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

// ─── Latency ─────────────────────────────────────────────────────────────────
// Not called → N/A. Otherwise color-coded: green (<1000ms), yellow
// (1000–3000ms), red (>3000ms).

function latencyMeta(responseTime: number, status: string) {
  const t = Number(responseTime) || 0;
  const notCalled = String(status).toLowerCase() === "not_configured" || t <= 0;
  if (notCalled) {
    return { label: "N/A", tone: "text-slate-500", bar: "bg-slate-600", width: "0%" };
  }
  if (t < 1000) {
    return { label: `${t}ms`, tone: "text-emerald-300", bar: "bg-emerald-400", width: `${Math.min(100, Math.round((t / 5000) * 100))}%` };
  }
  if (t <= 3000) {
    return { label: `${t}ms`, tone: "text-yellow-300", bar: "bg-yellow-400", width: `${Math.min(100, Math.round((t / 5000) * 100))}%` };
  }
  return { label: `${t}ms`, tone: "text-rose-300", bar: "bg-rose-400", width: `${Math.min(100, Math.round((t / 5000) * 100))}%` };
}

export default function ProviderCard({
  provider,
}: {
  provider: ProviderStatus;
}) {
  const meta = statusMeta(provider.status);
  const StatusIcon = meta.icon;
  const health = healthMeta(meta.health);
  const initial = providerInitial(provider.label);
  const latency = latencyMeta(provider.responseTime, provider.status);

  // Not attempted → show "Not Attempted" instead of a timestamp. Only show a
  // timestamp when an actual request was made.
  const notAttempted = provider.status === "not_configured" || provider.status === "idle";
  const attemptedLabel = notAttempted || !provider.lastUpdated
    ? "Not Attempted"
    : `Attempted ${formatTime(provider.lastUpdated)}`;

  // Configuration Required badge for not-configured providers (instead of UNKNOWN).
  const isNotConfigured = String(provider.status).toLowerCase() === "not_configured";

return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[320px] w-full min-w-0 flex-col justify-between gap-4 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] p-6"
    >
      {/* Top Row: logo + name + status badge */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-200">
            {provider.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {provider.label}
            </div>
            <div className="truncate text-[11px] text-slate-500">
              {provider.available ? "Configured" : "Not configured"}
            </div>
          </div>
        </div>
        <Badge className={`shrink-0 border whitespace-nowrap ${meta.tone}`}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {meta.label}
        </Badge>
      </div>

      {/* Verdict Badge */}
      <div className="flex flex-wrap items-center gap-2">
        {isNotConfigured ? (
          <Badge className="border border-slate-500/30 bg-slate-500/10 text-slate-300">
            Configuration Required
          </Badge>
        ) : (
          <Badge className={`border ${verdictBadge(provider.verdict)}`}>
            {String(provider.verdict || "unknown").toUpperCase()}
          </Badge>
        )}
        {provider.confidence > 0 && (
          <span className="text-[11px] text-slate-400">
            Confidence: {provider.confidence}%
          </span>
        )}
      </div>

      {/* Reason Box — never overflows */}
      <div className="min-w-0 break-words rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-snug text-slate-300">
        {meta.description}
      </div>

      {/* Health / Latency / Last Attempt */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px]">
          <Activity className="h-3 w-3 shrink-0 text-cyan-300" />
          <span className="shrink-0 font-medium text-slate-500">Health</span>
          <span className={`ml-auto inline-flex shrink-0 items-center gap-1.5 font-medium ${health.tone}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${health.dot}`} />
            {health.label}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px]">
          <Clock className="h-3 w-3 shrink-0 text-slate-500" />
          <span className="shrink-0 text-slate-500">Latency</span>
          <span className={`ml-auto shrink-0 whitespace-nowrap font-semibold ${latency.tone}`}>
            {latency.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-500">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{attemptedLabel}</span>
        </div>
      </div>

      {/* Progress Bar — always at the bottom */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${latency.bar}`}
          style={{ width: latency.width }}
        />
      </div>
    </motion.div>
  );
}
