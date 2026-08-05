import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

type TrendDirection = "up" | "down" | "neutral";
type CardColor = "blue" | "purple" | "emerald" | "rose" | "amber" | "cyan";

interface AlertCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  trend?: {
    direction: TrendDirection;
    value: number;
    label?: string;
  };
  description?: string;
  color?: CardColor;
  loading?: boolean;
}

const colorConfig: Record<
  CardColor,
  {
    gradient: string;
    border: string;
    iconBg: string;
    iconColor: string;
    glow: string;
    trendUp: string;
    trendDown: string;
  }
> = {
  blue: {
    gradient: "from-blue-500/10 via-blue-400/5 to-transparent",
    border: "from-blue-500/60 via-blue-400/20 to-transparent",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    glow: "shadow-blue-500/10",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
  },
  purple: {
    gradient: "from-purple-500/10 via-purple-400/5 to-transparent",
    border: "from-purple-500/60 via-purple-400/20 to-transparent",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
    glow: "shadow-purple-500/10",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
  },
  emerald: {
    gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent",
    border: "from-emerald-500/60 via-emerald-400/20 to-transparent",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    glow: "shadow-emerald-500/10",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
  },
  rose: {
    gradient: "from-rose-500/10 via-rose-400/5 to-transparent",
    border: "from-rose-500/60 via-rose-400/20 to-transparent",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    glow: "shadow-rose-500/10",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
  },
  amber: {
    gradient: "from-amber-500/10 via-amber-400/5 to-transparent",
    border: "from-amber-500/60 via-amber-400/20 to-transparent",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    glow: "shadow-amber-500/10",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
  },
  cyan: {
    gradient: "from-cyan-500/10 via-cyan-400/5 to-transparent",
    border: "from-cyan-500/60 via-cyan-400/20 to-transparent",
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
    glow: "shadow-cyan-500/10",
    trendUp: "text-emerald-400",
    trendDown: "text-rose-400",
  },
};

function useAnimatedCounter(target: number, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const start = performance.now();
    const from = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(from + (target - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return count;
}

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/5 ${className}`}
      aria-hidden="true"
    />
  );
}

function TrendBadge({
  trend,
  colors,
}: {
  trend: NonNullable<AlertCardProps["trend"]>;
  colors: (typeof colorConfig)[CardColor];
}) {
  const isUp = trend.direction === "up";
  const isDown = trend.direction === "down";
  const isNeutral = trend.direction === "neutral";

  const colorClass = isUp
    ? colors.trendUp
    : isDown
      ? colors.trendDown
      : "text-slate-400";

  const bgClass = isUp
    ? "bg-emerald-500/10"
    : isDown
      ? "bg-rose-500/10"
      : "bg-slate-500/10";

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass} ${bgClass} transition-all duration-300`}
      aria-label={`Trend: ${trend.direction} ${trend.value}%`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {!isNeutral && (
        <span>
          {isUp ? "+" : "-"}
          {Math.abs(trend.value)}%
        </span>
      )}
      {trend.label && <span className="opacity-75">{trend.label}</span>}
    </span>
  );
}

export function AlertCard({
  icon: Icon,
  title,
  value,
  trend,
  description,
  color = "blue",
  loading = false,
}: AlertCardProps) {
  const colors = colorConfig[color];
  const isNumeric = typeof value === "number";
  const animatedValue = useAnimatedCounter(
    isNumeric ? (value as number) : 0,
    1200,
    !loading && isNumeric
  );

  const displayValue = loading
    ? 0
    : isNumeric
      ? animatedValue.toLocaleString()
      : value;

  return (
    <article
      className={`
        group relative overflow-hidden rounded-2xl
        bg-slate-900/70 backdrop-blur-xl
        border border-white/[0.06]
        shadow-xl ${colors.glow}
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-2xl hover:border-white/[0.10]
        focus-within:ring-2 focus-within:ring-white/20
        cursor-default select-none
      `}
      aria-busy={loading}
      aria-label={`${title}: ${loading ? "Loading" : displayValue}`}
    >
      {/* Gradient border top */}
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${colors.border}`}
        aria-hidden="true"
      />

      {/* Background gradient wash */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          {loading ? (
            <SkeletonPulse className="h-10 w-10 rounded-xl" />
          ) : (
            <div
              className={`
                flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                ${colors.iconBg} ${colors.iconColor}
                ring-1 ring-white/5
                transition-transform duration-300 group-hover:scale-110
              `}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}

          {/* Trend badge */}
          {loading ? (
            <SkeletonPulse className="h-5 w-16 rounded-full" />
          ) : (
            trend && <TrendBadge trend={trend} colors={colors} />
          )}
        </div>

        {/* Value */}
        <div className="mt-4">
          {loading ? (
            <SkeletonPulse className="h-8 w-24 rounded-lg" />
          ) : (
            <p
              className="text-3xl font-bold tracking-tight text-white tabular-nums transition-all duration-200"
              aria-live="polite"
            >
              {displayValue}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="mt-1">
          {loading ? (
            <SkeletonPulse className="h-4 w-32 rounded" />
          ) : (
            <p className="text-sm font-medium text-slate-400">{title}</p>
          )}
        </div>

        {/* Description */}
        {(description || loading) && (
          <div className="mt-3 border-t border-white/[0.05] pt-3">
            {loading ? (
              <SkeletonPulse className="h-3 w-full rounded" />
            ) : (
              <p className="text-xs leading-relaxed text-slate-500">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hover glow spot */}
      <div
        className={`
          absolute -bottom-6 -right-6 h-24 w-24 rounded-full
          bg-gradient-to-br ${colors.gradient}
          blur-2xl opacity-0 transition-opacity duration-500
          group-hover:opacity-60
        `}
        aria-hidden="true"
      />
    </article>
  );
}