"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  /** Optional 0-100 trend for the mini chart. */
  trend?: number;
  /** Optional percentage change. */
  change?: number;
  /** Optional accent color class for the icon chip. */
  accent?: string;
  loading?: boolean;
}

/**
 * Count-up animation for numeric values.
 */
function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = React.useState(0);
  const prev = React.useRef(0);

  React.useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (diff === 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + diff * eased);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  change,
  accent = "text-cyan-300 border-cyan-400/20 bg-cyan-400/10",
  loading = false,
}: StatCardProps) {
  const numeric = typeof value === "number" ? value : Number(value);
  const hasCountUp = typeof value === "number" && Number.isFinite(numeric) && numeric > 0;
  const animated = useCountUp(hasCountUp ? numeric : 0);

  const display = hasCountUp
    ? Math.round(animated).toLocaleString()
    : String(value);

  const chartPoints = React.useMemo(() => {
    if (trend === undefined) return [];
    const pts = Array.from({ length: 12 }, (_, i) => {
      const base = Math.max(4, trend * 0.7);
      const wave = Math.sin(i * 0.9) * 6;
      return Math.max(2, Math.min(100, base + wave + (i % 3) * 2));
    });
    return pts;
  }, [trend]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-lg shadow-black/20 backdrop-blur-md"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <div className={`rounded-xl border p-2 ${accent}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tracking-tight text-white">
              {loading ? (
                <span className="inline-block h-6 w-14 animate-pulse rounded bg-white/10" />
              ) : (
                display
              )}
            </p>
            {change !== undefined && (
              <div
                className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
                  change >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>

          {chartPoints.length > 0 && (
            <div className="flex h-8 items-end gap-[3px] opacity-70 transition-opacity group-hover:opacity-100">
              {chartPoints.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${p}%` }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                  className="w-1 rounded-full bg-gradient-to-t from-cyan-500/40 to-cyan-300"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
