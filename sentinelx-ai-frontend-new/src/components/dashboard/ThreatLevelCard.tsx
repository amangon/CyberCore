"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getDashboard } from "@/services/dashboard.service";
import { getApiErrorMessage } from "@/lib/api";

const levels = [
  { label: "Low", color: "bg-emerald-500", glow: "shadow-emerald-500/30" },
  { label: "Medium", color: "bg-yellow-400", glow: "shadow-yellow-400/30" },
  { label: "High", color: "bg-orange-500", glow: "shadow-orange-500/40" },
  { label: "Critical", color: "bg-red-500", glow: "shadow-red-500/60" },
] as const;

const LEVEL_MAP: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function levelColor(level: string) {
  switch (level.toLowerCase()) {
    case "critical":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    case "high":
      return "border-orange-500/20 bg-orange-500/10 text-orange-300";
    case "medium":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
    default:
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  return `${Math.floor(h / 24)} days ago`;
}

export default function ThreatLevelCard() {
  const [level, setLevel] = useState<string>("low");
  const [score, setScore] = useState<number | null>(null);
  const [activeThreats, setActiveThreats] = useState<number | null>(null);
  const [blockedAttacks, setBlockedAttacks] = useState<number | null>(null);
const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>("Unknown");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getDashboard();
        if (!isMounted) return;

const threatLevel = data.threatLevel;
        const nextLevel = threatLevel?.level ?? "low";
        const iso = threatLevel?.lastUpdated ?? null;
        setLevel(nextLevel);
        setScore(threatLevel?.score ?? null);
        setActiveThreats(threatLevel?.activeThreats ?? null);
        setBlockedAttacks(threatLevel?.blockedAttacks ?? null);
        setLastUpdated(iso);
        setLastUpdatedText(iso ? formatRelative(iso) : "Unknown");
        setError(null);
      } catch (err) {
        if (isMounted) setError(getApiErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

const levelIndex = LEVEL_MAP[level.toLowerCase()] ?? 0;
  const currentScore = score ?? 0;
  const displayLevel = level.toUpperCase();

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
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-2 text-orange-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                  Current Threat Level
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  AI analysis detected increased suspicious activities across infrastructure.
                </p>
              </div>
            </div>

            <Badge className={`border ${loading ? "border-slate-500/20 bg-slate-500/10 text-slate-300" : levelColor(level)}`}>
              {loading ? "Loading" : error ? "Unavailable" : displayLevel}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Threat Score
              </div>
              <div className="mt-2 text-4xl font-bold tracking-tight text-white">
                {loading ? "—" : `${currentScore}/100`}
              </div>
            </div>

            {loading ? (
              <div className="flex h-2 w-full max-w-[180px] animate-pulse gap-2">
                {levels.map((item) => (
                  <div key={item.label} className="h-2 w-12 rounded-full bg-slate-700" />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {levels.map((item, idx) => {
                  const active = idx <= levelIndex;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ scaleX: 0.7, opacity: 0.35 }}
                      animate={{ scaleX: active ? 1 : 0.85, opacity: active ? 1 : 0.35 }}
                      transition={{ duration: 0.35, delay: idx * 0.08 }}
                      className={[
                        "h-2 w-12 rounded-full origin-left",
                        active ? `${item.color} ${item.glow} shadow-lg` : "bg-slate-700",
                      ].join(" ")}
                      title={item.label}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {levels.map((item, idx) => (
              <div key={item.label} className="space-y-2">
                <div
                  className={[
                    "mx-auto h-2.5 w-2.5 rounded-full",
                    idx <= levelIndex ? item.color : "bg-slate-700",
                  ].join(" ")}
                />
                <div
                  className={[
                    "text-xs font-medium",
                    idx === levelIndex ? "text-slate-100" : "text-slate-500",
                  ].join(" ")}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-4">
            <div>
              <div className="text-xs text-slate-500">Active threats</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">
                {loading ? "—" : activeThreats?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Blocked attacks</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">
                {loading ? "—" : blockedAttacks?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div className="text-right">
<div className="text-xs text-slate-500">Last updated</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">
                {loading ? "—" : lastUpdatedText}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

