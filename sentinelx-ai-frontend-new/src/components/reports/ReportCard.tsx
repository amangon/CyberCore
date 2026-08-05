"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, type LucideIcon } from "lucide-react";

interface ReportCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  trend: number;
  trendDirection: "up" | "down" | "neutral";
  color: "blue" | "purple" | "cyan" | "emerald" | "rose";
  loading?: boolean;
  suffix?: string;
}

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  blue: { border: "border-blue-500/20", bg: "bg-blue-500/10", text: "text-blue-400" },
  purple: { border: "border-purple-500/20", bg: "bg-purple-500/10", text: "text-purple-400" },
  cyan: { border: "border-cyan-500/20", bg: "bg-cyan-500/10", text: "text-cyan-400" },
  emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  rose: { border: "border-rose-500/20", bg: "bg-rose-500/10", text: "text-rose-400" },
};

export function ReportCard({ title, value, description, icon: Icon, trend, trendDirection, color, loading = false, suffix }: ReportCardProps) {
  const colors = colorMap[color] ?? colorMap.blue;

  return (
    <motion.div
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-xl"
      whileHover={{ y: -2, borderColor: "rgba(56, 189, 248, 0.25)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl border ${colors.border} ${colors.bg} ${colors.text} p-2.5`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="text-3xl font-bold text-white">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-slate-800" />
          ) : (
            <>
              {value.toLocaleString()}
              {suffix ? <span className="text-lg text-slate-400">{suffix}</span> : null}
            </>
          )}
        </div>

        {!loading && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trendDirection === "up" ? "text-emerald-400" : trendDirection === "down" ? "text-rose-400" : "text-slate-400"
          }`}>
            {trendDirection === "up" ? <ArrowUp className="h-3.5 w-3.5" /> : trendDirection === "down" ? <ArrowDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </motion.div>
  );
}
