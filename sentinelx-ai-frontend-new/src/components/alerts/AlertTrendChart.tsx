import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type TimeRange = "24h" | "7d" | "30d";

interface DataPoint {
  time: string;
  timestamp: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export interface AlertTrendPoint {
  time: string;
  timestamp: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    color: "#f43f5e",
    dotColor: "#fb7185",
  },
  high: {
    label: "High",
    color: "#f97316",
    dotColor: "#fb923c",
  },
  medium: {
    label: "Medium",
    color: "#eab308",
    dotColor: "#facc15",
  },
  low: {
    label: "Low",
    color: "#3b82f6",
    dotColor: "#60a5fa",
  },
} as const;

type SeverityKey = keyof typeof SEVERITY_CONFIG;

// ─── Mock Data Generators ─────────────────────────────────────────────────────

function generateHourlyData(): DataPoint[] {
  const now = new Date("2026-08-01T08:00:00.000Z");
  const points: DataPoint[] = [];

  // Simulate a realistic 24h pattern: quiet overnight, spike at 02–04 UTC
  // (common botnet window), busy during business hours
  const baseline = {
    critical: [2, 1, 1, 3, 8, 4, 2, 3, 5, 7, 9, 11, 10, 9, 8, 12, 14, 13, 10, 8, 6, 5, 4, 3],
    high:     [8, 5, 4, 9,18,12, 8,10,14,18,22,26, 24,22,20,28,32,30, 24,20,16,14,11, 9],
    medium:   [18,12,10,14,28,20,15,18,24,30,36,42, 40,38,34,44,50,48, 40,34,28,24,20,16],
    low:      [30,22,18,20,38,28,22,26,34,42,50,58, 56,52,48,60,68,65, 56,48,40,36,30,26],
  };

  for (let i = 0; i < 24; i++) {
    const ts = new Date(now);
    ts.setUTCHours(now.getUTCHours() - 23 + i);
    ts.setUTCMinutes(0, 0, 0);

    const jitter = (base: number) =>
      Math.max(0, base + Math.floor((Math.random() - 0.5) * base * 0.25));

    points.push({
      time: ts.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }),
      timestamp: ts.getTime(),
      critical: jitter(baseline.critical[i]),
      high: jitter(baseline.high[i]),
      medium: jitter(baseline.medium[i]),
      low: jitter(baseline.low[i]),
    });
  }

  return points;
}

function generateDailyData(): DataPoint[] {
  const now = new Date("2026-08-01T00:00:00.000Z");
  const points: DataPoint[] = [];

  const baseValues = [
    { critical: 48,  high: 124, medium: 280, low: 420 },
    { critical: 62,  high: 158, medium: 340, low: 510 },
    { critical: 35,  high: 98,  medium: 220, low: 340 },
    { critical: 71,  high: 180, medium: 390, low: 580 },
    { critical: 89,  high: 210, medium: 460, low: 690 },
    { critical: 54,  high: 138, medium: 310, low: 460 },
    { critical: 43,  high: 112, medium: 248, low: 374 },
  ];

  for (let i = 0; i < 7; i++) {
    const ts = new Date(now);
    ts.setUTCDate(now.getUTCDate() - 6 + i);

    const b = baseValues[i];
    const jitter = (v: number) =>
      Math.max(0, v + Math.floor((Math.random() - 0.5) * v * 0.1));

    points.push({
      time: ts.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      timestamp: ts.getTime(),
      critical: jitter(b.critical),
      high: jitter(b.high),
      medium: jitter(b.medium),
      low: jitter(b.low),
    });
  }

  return points;
}

function generateMonthlyData(): DataPoint[] {
  const now = new Date("2026-08-01T00:00:00.000Z");
  const points: DataPoint[] = [];

  const baseValues = [
    { critical: 320, high: 820,  medium: 1840, low: 2760 },
    { critical: 410, high: 1050, medium: 2360, low: 3540 },
    { critical: 285, high: 730,  medium: 1640, low: 2460 },
    { critical: 520, high: 1330, medium: 2990, low: 4490 },
  ];

  for (let i = 0; i < 4; i++) {
    const ts = new Date(now);
    ts.setUTCDate(now.getUTCDate() - 28 + i * 7);

    const b = baseValues[i];
    const jitter = (v: number) =>
      Math.max(0, v + Math.floor((Math.random() - 0.5) * v * 0.08));

    points.push({
      time: `Week ${i + 1}`,
      timestamp: ts.getTime(),
      critical: jitter(b.critical),
      high: jitter(b.high),
      medium: jitter(b.medium),
      low: jitter(b.low),
    });
  }

  return points;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0);

  return (
    <div
      className="rounded-xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl"
      role="tooltip"
    >
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <ul className="space-y-1.5">
        {payload.map((entry) => {
          const key = entry.dataKey as SeverityKey;
          const cfg = SEVERITY_CONFIG[key];
          return (
            <li key={entry.dataKey} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                  aria-hidden="true"
                />
                {cfg.label}
              </span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {entry.value.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-2.5 border-t border-white/10 pt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">Total</span>
        <span className="text-xs font-bold tabular-nums text-slate-200">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Custom Legend ────────────────────────────────────────────────────────────

interface CustomLegendProps {
  visibleSeries: Record<SeverityKey, boolean>;
  onToggle: (key: SeverityKey) => void;
  data: DataPoint[];
}

function CustomLegend({ visibleSeries, onToggle, data }: CustomLegendProps) {
  const totals = useMemo(() => {
    return (Object.keys(SEVERITY_CONFIG) as SeverityKey[]).reduce(
      (acc, key) => {
        acc[key] = data.reduce((sum, d) => sum + d[key], 0);
        return acc;
      },
      {} as Record<SeverityKey, number>
    );
  }, [data]);

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 px-4 pb-1"
      role="list"
      aria-label="Chart series legend"
    >
      {(Object.entries(SEVERITY_CONFIG) as [SeverityKey, typeof SEVERITY_CONFIG[SeverityKey]][]).map(
        ([key, cfg]) => {
          const active = visibleSeries[key];
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              role="listitem"
              aria-pressed={active}
              aria-label={`${active ? "Hide" : "Show"} ${cfg.label} series`}
              className={`
                flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5
                text-xs font-medium transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
                ${
                  active
                    ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    : "border-white/5 bg-transparent text-slate-600 hover:text-slate-400"
                }
              `}
            >
              <span
                className="h-2.5 w-2.5 rounded-full transition-opacity duration-200"
                style={{
                  backgroundColor: active ? cfg.color : "#475569",
                  boxShadow: active ? `0 0 6px ${cfg.color}80` : "none",
                }}
                aria-hidden="true"
              />
              {cfg.label}
              <span
                className={`tabular-nums transition-colors duration-200 ${
                  active ? "text-slate-400" : "text-slate-700"
                }`}
              >
                {totals[key].toLocaleString()}
              </span>
            </button>
          );
        }
      )}
    </div>
  );
}

// ─── Time Filter ──────────────────────────────────────────────────────────────

interface TimeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TIME_FILTERS: { label: string; value: TimeRange }[] = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
];

function TimeFilter({ value, onChange }: TimeFilterProps) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-slate-800/60 p-0.5"
      role="group"
      aria-label="Time range filter"
    >
      {TIME_FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          aria-pressed={value === f.value}
          className={`
            rounded-md px-3 py-1 text-xs font-semibold transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
            ${
              value === f.value
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }
          `}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

function SummaryStats({ data }: { data: DataPoint[] }) {
  const stats = useMemo(() => {
    return (Object.keys(SEVERITY_CONFIG) as SeverityKey[]).map((key) => {
      const values = data.map((d) => d[key]);
      const total = values.reduce((s, v) => s + v, 0);
      const max = Math.max(...values);
      const last = values[values.length - 1];
      const prev = values[values.length - 2] ?? last;
      const delta = prev === 0 ? 0 : ((last - prev) / prev) * 100;

      return { key, total, max, delta };
    });
  }, [data]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map(({ key, total, delta }) => {
        const cfg = SEVERITY_CONFIG[key];
        const isUp = delta > 0;
        const isDown = delta < 0;
        return (
          <div
            key={key}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
            aria-label={`${cfg.label}: ${total.toLocaleString()} total`}
          >
            <p className="text-xs font-medium text-slate-500">{cfg.label}</p>
            <p
              className="mt-1 text-xl font-bold tabular-nums text-white"
              style={{ textShadow: `0 0 20px ${cfg.color}40` }}
            >
              {total.toLocaleString()}
            </p>
            {delta !== 0 && (
              <p
                className={`mt-0.5 text-xs font-medium tabular-nums ${
                  isUp ? "text-rose-400" : isDown ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs prev
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AlertTrendChart({ trend }: { trend?: readonly AlertTrendPoint[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [visibleSeries, setVisibleSeries] = useState<Record<SeverityKey, boolean>>({
    critical: true,
    high: true,
    medium: true,
    low: true,
  });

  const data = useMemo(() => {
    // Prefer real backend trend data when provided.
    if (trend && trend.length > 0) {
      return trend.map((point) => ({
        time: point.time,
        timestamp: point.timestamp,
        critical: point.critical,
        high: point.high,
        medium: point.medium,
        low: point.low,
      }));
    }
    if (timeRange === "24h") return generateHourlyData();
    if (timeRange === "7d") return generateDailyData();
    return generateMonthlyData();
  }, [timeRange, trend]);

  const peakIndex = useMemo(() => {
    let max = 0;
    let idx = 0;
    data.forEach((d, i) => {
      const sum = d.critical + d.high + d.medium + d.low;
      if (sum > max) { max = sum; idx = i; }
    });
    return idx;
  }, [data]);

  const handleToggle = (key: SeverityKey) => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // always keep at least one series visible
      const anyVisible = Object.values(next).some(Boolean);
      return anyVisible ? next : prev;
    });
  };

  const timeRangeLabel: Record<TimeRange, string> = {
    "24h": "Last 24 Hours",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
  };

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-slate-900/70 p-5 shadow-xl backdrop-blur-xl"
      aria-label="Security alerts trend chart"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Alert Trends</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {timeRangeLabel[timeRange]} · Updated just now
          </p>
        </div>
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary stats */}
      <SummaryStats data={data} />

      {/* Legend */}
      <CustomLegend
        visibleSeries={visibleSeries}
        onToggle={handleToggle}
        data={data}
      />

      {/* Chart */}
      <div className="h-72 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
          >
            <defs>
              {(Object.keys(SEVERITY_CONFIG) as SeverityKey[]).map((key) => (
                <linearGradient
                  key={key}
                  id={`gradient-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={SEVERITY_CONFIG[key].color}
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor={SEVERITY_CONFIG[key].color}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff08"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              padding={{ left: 8, right: 8 }}
            />

            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
              }
              width={38}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#ffffff15",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Peak activity reference line */}
            <ReferenceLine
              x={data[peakIndex]?.time}
              stroke="#ffffff18"
              strokeDasharray="4 4"
              label={{
                value: "Peak",
                fill: "#475569",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />

            {(Object.keys(SEVERITY_CONFIG) as SeverityKey[]).map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={SEVERITY_CONFIG[key].label}
                stroke={SEVERITY_CONFIG[key].color}
                strokeWidth={visibleSeries[key] ? 2 : 0}
                fill={`url(#gradient-${key})`}
                fillOpacity={visibleSeries[key] ? 1 : 0}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: SEVERITY_CONFIG[key].dotColor,
                  stroke: SEVERITY_CONFIG[key].color,
                  strokeWidth: 2,
                }}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
                hide={!visibleSeries[key]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-slate-600">
        Hover over the chart to inspect individual data points · Click legend items to toggle series
      </p>
    </section>
  );
}