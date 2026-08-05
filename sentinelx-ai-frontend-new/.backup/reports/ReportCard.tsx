import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useRef, type ElementType } from "react";

type TrendDirection = "up" | "down" | "neutral";
type AccentColor = "blue" | "purple" | "cyan" | "emerald" | "rose";

interface ReportCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: ElementType;
  trend?: number;
  trendDirection?: TrendDirection;
  color?: AccentColor;
  loading?: boolean;
}

const colorMap: Record<
  AccentColor,
  {
    glow: string;
    gradient: string;
    iconBg: string;
    iconText: string;
    trendUp: string;
    trendDown: string;
    trendNeutral: string;
    border: string;
    shimmer: string;
  }
> = {
  blue: {
    glow: "shadow-blue-500/20",
    gradient: "from-blue-500/20 via-blue-400/10 to-transparent",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-400",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
    trendNeutral: "text-slate-400",
    border: "from-blue-500/60 via-blue-400/30 to-transparent",
    shimmer: "via-blue-400/10",
  },
  purple: {
    glow: "shadow-purple-500/20",
    gradient: "from-purple-500/20 via-purple-400/10 to-transparent",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-400",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
    trendNeutral: "text-slate-400",
    border: "from-purple-500/60 via-purple-400/30 to-transparent",
    shimmer: "via-purple-400/10",
  },
  cyan: {
    glow: "shadow-cyan-500/20",
    gradient: "from-cyan-500/20 via-cyan-400/10 to-transparent",
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-400",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
    trendNeutral: "text-slate-400",
    border: "from-cyan-500/60 via-cyan-400/30 to-transparent",
    shimmer: "via-cyan-400/10",
  },
  emerald: {
    glow: "shadow-emerald-500/20",
    gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
    trendNeutral: "text-slate-400",
    border: "from-emerald-500/60 via-emerald-400/30 to-transparent",
    shimmer: "via-emerald-400/10",
  },
  rose: {
    glow: "shadow-rose-500/20",
    gradient: "from-rose-500/20 via-rose-400/10 to-transparent",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-400",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
    trendNeutral: "text-slate-400",
    border: "from-rose-500/60 via-rose-400/30 to-transparent",
    shimmer: "via-rose-400/10",
  },
};

function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 30, stiffness: 120 });
  const display = useTransform(spring, (v) =>
    v >= 1000
      ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)
      : Math.round(v).toLocaleString("en-US")
  );

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 1.4, ease: "easeOut" });
    return controls.stop;
  }, [value, motionVal]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return unsubscribe;
  }, [display]);

  return <span ref={ref}>0</span>;
}

function TrendBadge({
  trend,
  direction,
  colorKey,
}: {
  trend: number;
  direction: TrendDirection;
  colorKey: AccentColor;
}) {
  const colors = colorMap[colorKey];
  const Icon =
    direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const textColor =
    direction === "up"
      ? colors.trendUp
      : direction === "down"
        ? colors.trendDown
        : colors.trendNeutral;
  const bgColor =
    direction === "up"
      ? "bg-emerald-500/10"
      : direction === "down"
        ? "bg-rose-500/10"
        : "bg-slate-500/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${bgColor} ${textColor}`}
    >
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      <span className="text-xs font-semibold tabular-nums">
        {trend > 0 ? "+" : ""}
        {trend.toFixed(1)}%
      </span>
    </motion.div>
  );
}

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/5 ${className}`}
      role="presentation"
      aria-hidden="true"
    />
  );
}

export function ReportCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendDirection = "neutral",
  color = "blue",
  loading = false,
}: ReportCardProps) {
  const colors = colorMap[color];
  const isNumeric = typeof value === "number";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={loading ? {} : { y: -4, scale: 1.015 }}
      className={[
        "group relative overflow-hidden rounded-2xl p-px",
        "bg-gradient-to-br",
        colors.border,
        "shadow-xl",
        colors.glow,
        "transition-shadow duration-300 hover:shadow-2xl",
        loading ? "cursor-wait" : "cursor-default",
      ].join(" ")}
      aria-busy={loading}
      aria-label={loading ? "Loading KPI data" : `${title}: ${value}`}
    >
      {/* Inner card surface — glassmorphism */}
      <div className="relative flex h-full flex-col gap-4 rounded-2xl bg-slate-900/80 p-5 backdrop-blur-xl sm:p-6">
        {/* Subtle radial gradient overlay */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.gradient} opacity-60`}
          aria-hidden="true"
        />

        {/* Glow orb — top-right */}
        <motion.div
          className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${colors.gradient} blur-2xl`}
          animate={loading ? {} : { opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />

        {/* Header row */}
        <div className="relative flex items-start justify-between gap-3">
          {loading ? (
            <>
              <SkeletonPulse className="h-4 w-2/3" />
              <SkeletonPulse className="h-9 w-9 shrink-0 rounded-xl" />
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium leading-tight tracking-wide text-slate-400 sm:text-base">
                {title}
              </h3>
              {Icon && (
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}
                  aria-hidden="true"
                >
                  <Icon size={18} className={colors.iconText} strokeWidth={1.8} />
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Value row */}
        <div className="relative flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            {loading ? (
              <SkeletonPulse className="h-8 w-32" />
            ) : (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="text-2xl font-bold tabular-nums text-white sm:text-3xl"
                aria-live="polite"
              >
                {isNumeric ? <AnimatedCounter value={value as number} /> : value}
              </motion.p>
            )}

            {/* Description */}
            {loading ? (
              <SkeletonPulse className="mt-1 h-3 w-40" />
            ) : description ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-slate-500 sm:text-sm"
              >
                {description}
              </motion.p>
            ) : null}
          </div>

          {/* Trend badge */}
          {!loading && trend !== undefined && (
            <TrendBadge
              trend={trend}
              direction={trendDirection}
              colorKey={color}
            />
          )}
          {loading && <SkeletonPulse className="h-5 w-14 rounded-full" />}
        </div>

        {/* Bottom shimmer bar */}
        <div
          className={`absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent ${colors.shimmer} to-transparent`}
          aria-hidden="true"
        />
      </div>
    </motion.article>
  );
}

export default ReportCard;