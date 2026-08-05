"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";
import { getDashboard } from "@/services/dashboard.service";
import { getApiErrorMessage } from "@/lib/api";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number) {
  return score >= 90 ? "#22c55e" : score >= 70 ? "#eab308" : "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Critical";
}

export default function SecurityScoreCard() {
  const [score, setScore] = useState<number | null>(null);
  const [threatsBlocked, setThreatsBlocked] = useState<number | null>(null);
  const [systemsProtected, setSystemsProtected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getDashboard();
        if (!isMounted) return;
        setScore(data.securityScore?.score ?? 0);
        setThreatsBlocked(data.securityScore?.threatsBlocked ?? 0);
        setSystemsProtected(data.securityScore?.systemsProtected ?? 0);
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

  const currentScore = score ?? 0;
  const color = scoreColor(currentScore);
  const dashOffset = CIRCUMFERENCE * (1 - currentScore / 100);

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
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                  Security Score
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  AI calculated security posture
                </p>
              </div>
            </div>

            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: `${color}33`, background: `${color}1a`, color }}
            >
              {loading ? "Loading" : error ? "Unavailable" : scoreLabel(currentScore)}
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center">
            {loading ? (
              <div className="flex h-44 w-44 animate-pulse items-center justify-center">
                <div className="h-44 w-44 rounded-full border-8 border-slate-800" />
              </div>
            ) : error ? (
              <div className="flex h-44 w-44 flex-col items-center justify-center gap-2 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
                <p className="px-4 text-xs text-slate-400">{error}</p>
              </div>
            ) : (
              <div className="relative h-44 w-44">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    fill="none"
                    className="stroke-slate-800"
                    strokeWidth="10"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    initial={{ strokeDashoffset: CIRCUMFERENCE }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    style={{ filter: `drop-shadow(0 0 10px ${color}59)` }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.45 }}
                    className="text-center"
                  >
                    <div className="text-4xl font-bold tracking-tight text-white">
                      {currentScore}%
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                      {currentScore}/100
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm leading-6 text-slate-400">
            AI calculated security posture based on threats, vulnerabilities and
            assets.
          </p>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
            <div>
              <div className="text-xs text-slate-500">Threats blocked</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">
                {loading ? "—" : threatsBlocked?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Systems protected</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">
                {loading ? "—" : systemsProtected?.toLocaleString() ?? "0"}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

