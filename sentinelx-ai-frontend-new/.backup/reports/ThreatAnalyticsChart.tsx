"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low";
type TimeRange = "24h" | "7d" | "30d" | "90d";
type ActiveChart = "timeline" | "distribution" | "radar" | "sources";

interface ThreatEvent {
  time: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  blocked: number;
  total: number;
}

interface ThreatSource {
  name: string;
  threats: number;
  blocked: number;
  risk: number;
}

interface RadarMetric {
  subject: string;
  score: number;
  benchmark: number;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const COLORS: Record<Severity, string> = {
  critical: "#f43f5e",
  high: "#fb923c",
  medium: "#facc15",
  low: "#34d399",
};

const CHART_COLORS = {
  blocked: "#818cf8",
  total: "#38bdf8",
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(255,255,255,0.35)",
  tooltip: {
    bg: "#0f172a",
    border: "rgba(99,102,241,0.4)",
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const seed = (n: number, offset = 0) =>
  Math.floor(((Math.sin(n + offset) + 1) / 2) * 100);

const TIMELINE_DATA: Record<TimeRange, ThreatEvent[]> = {
  "24h": Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    critical: seed(i, 1) % 12 + 1,
    high: seed(i, 2) % 28 + 5,
    medium: seed(i, 3) % 55 + 10,
    low: seed(i, 4) % 80 + 20,
    blocked: seed(i, 5) % 140 + 30,
    total: seed(i, 6) % 180 + 60,
  })),
  "7d": Array.from({ length: 7 }, (_, i) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return {
      time: days[i],
      critical: seed(i, 7) % 40 + 5,
      high: seed(i, 8) % 90 + 20,
      medium: seed(i, 9) % 200 + 50,
      low: seed(i, 10) % 350 + 100,
      blocked: seed(i, 11) % 600 + 200,
      total: seed(i, 12) % 800 + 300,
    };
  }),
  "30d": Array.from({ length: 30 }, (_, i) => ({
    time: `${i + 1}`,
    critical: seed(i, 13) % 60 + 8,
    high: seed(i, 14) % 130 + 30,
    medium: seed(i, 15) % 280 + 70,
    low: seed(i, 16) % 500 + 120,
    blocked: seed(i, 17) % 900 + 300,
    total: seed(i, 18) % 1100 + 500,
  })),
  "90d": Array.from({ length: 12 }, (_, i) => ({
    time: `Wk ${i + 1}`,
    critical: seed(i, 19) % 200 + 30,
    high: seed(i, 20) % 500 + 100,
    medium: seed(i, 21) % 1100 + 250,
    low: seed(i, 22) % 2000 + 500,
    blocked: seed(i, 23) % 3500 + 1200,
    total: seed(i, 24) % 4500 + 2000,
  })),
};

const SOURCE_DATA: ThreatSource[] = [
  { name: "Phishing",     threats: 4820, blocked: 4390, risk: 91 },
  { name: "Malware",      threats: 3610, blocked: 3100, risk: 86 },
  { name: "Brute Force",  threats: 2940, blocked: 2800, risk: 95 },
  { name: "SQL Inject",   threats: 1780, blocked: 1650, risk: 93 },
  { name: "Zero-Day",     threats: 890,  blocked: 620,  risk: 70 },
  { name: "Insider",      threats: 430,  blocked: 290,  risk: 67 },
];

const RADAR_DATA: RadarMetric[] = [
  { subject: "Detection",  score: 92, benchmark: 75 },
  { subject: "Response",   score: 78, benchmark: 70 },
  { subject: "Prevention", score: 88, benchmark: 80 },
  { subject: "Compliance", score: 95, benchmark: 85 },
  { subject: "Visibility", score: 82, benchmark: 72 },
  { subject: "Recovery",   score: 71, benchmark: 68 },
];

const DISTRIBUTION_DATA = [
  { name: "Critical", value: 342,  color: COLORS.critical },
  { name: "High",     value: 1284, color: COLORS.high     },
  { name: "Medium",   value: 3891, color: COLORS.medium   },
  { name: "Low",      value: 7234, color: COLORS.low      },
];

const SUMMARY_STATS = [
  { label: "Total Threats", value: "12,751", delta: "+8.2%",  up: true,  icon: "⚡" },
  { label: "Blocked",       value: "11,842", delta: "+12.4%", up: true,  icon: "🛡" },
  { label: "Block Rate",    value: "92.9%",  delta: "+1.1%",  up: true,  icon: "📊" },
  { label: "Critical",      value: "342",    delta: "-3.6%",  up: false, icon: "🔴" },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: CHART_COLORS.tooltip.bg,
        border: `1px solid ${CHART_COLORS.tooltip.border}`,
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        minWidth: 160,
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: "0 0 8px",
        }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, flex: 1 }}>
            {entry.name}
          </span>
          <span
            style={{
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Pie Label ────────────────────────────────────────────────────────────────

const PieLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number; name: string;
}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="rgba(255,255,255,0.9)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const axisStyle = {
  tick: { fill: CHART_COLORS.axis, fontSize: 10, fontWeight: 500 as const },
  axisLine: false as const,
  tickLine: false as const,
};

const ChartTab = ({
  id, label, active, onClick,
}: {
  id: ActiveChart; label: string; active: boolean; onClick: (id: ActiveChart) => void;
}) => (
  <button
    onClick={() => onClick(id)}
    aria-pressed={active}
    style={{
      padding: "6px 14px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.03em",
      transition: "all 0.2s ease",
      background: active ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "transparent",
      color: active ? "#fff" : "rgba(255,255,255,0.4)",
      boxShadow: active ? "0 2px 12px rgba(99,102,241,0.4)" : "none",
    }}
  >
    {label}
  </button>
);

const TimeBtn = ({
  range, active, onClick,
}: {
  range: TimeRange; active: boolean; onClick: (r: TimeRange) => void;
}) => (
  <button
    onClick={() => onClick(range)}
    aria-pressed={active}
    style={{
      padding: "4px 10px",
      borderRadius: 5,
      border: `1px solid ${active ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.1)"}`,
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 600,
      background: active ? "rgba(99,102,241,0.2)" : "transparent",
      color: active ? "#a5b4fc" : "rgba(255,255,255,0.4)",
      transition: "all 0.18s ease",
      letterSpacing: "0.04em",
    }}
  >
    {range}
  </button>
);

const StatCard = ({
  label, value, delta, up, icon,
}: (typeof SUMMARY_STATS)[0]) => (
  <div
    style={{
      background:
        "linear-gradient(135deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.018) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "16px 20px",
      flex: "1 1 140px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: -20, right: -20,
        width: 60, height: 60,
        borderRadius: "50%",
        background: up ? "rgba(99,102,241,0.18)" : "rgba(244,63,94,0.14)",
        filter: "blur(20px)",
        pointerEvents: "none",
      }}
    />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 18 }} role="img" aria-label={label}>{icon}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: up ? "#34d399" : "#f43f5e",
          background: up ? "rgba(52,211,153,0.12)" : "rgba(244,63,94,0.12)",
          padding: "2px 7px",
          borderRadius: 20,
          letterSpacing: "0.03em",
        }}
      >
        {delta}
      </span>
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 11,
        color: "rgba(255,255,255,0.38)",
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.02em" }}>
      {title}
    </h3>
    {subtitle && (
      <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.03em" }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ThreatAnalytics() {
  const [timeRange, setTimeRange]       = useState<TimeRange>("7d");
  const [activeChart, setActiveChart]   = useState<ActiveChart>("timeline");
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const timelineData = TIMELINE_DATA[timeRange];

  const toggleSeries = useCallback((key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const visible = (key: string) => !hiddenSeries.has(key);

  // ── Timeline ──────────────────────────────────────────────────────────────

  const renderTimeline = () => (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <SectionHeader
          title="Threat Activity Timeline"
          subtitle="Event volume by severity over selected period"
        />
        <div style={{ display: "flex", gap: 4 }}>
          {(["24h", "7d", "30d", "90d"] as TimeRange[]).map((r) => (
            <TimeBtn key={r} range={r} active={timeRange === r} onClick={setTimeRange} />
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={timelineData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            {(
              [
                ["critical", COLORS.critical],
                ["high",     COLORS.high],
                ["medium",   COLORS.medium],
                ["low",      COLORS.low],
              ] as [string, string][]
            ).map(([key, color]) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="time" {...axisStyle} />
          <YAxis {...axisStyle} />
          <Tooltip content={<CustomTooltip />} />
          {(
            [
              ["low",      COLORS.low,      "Low"],
              ["medium",   COLORS.medium,   "Medium"],
              ["high",     COLORS.high,     "High"],
              ["critical", COLORS.critical, "Critical"],
            ] as [string, string, string][]
          ).map(([key, color, label]) =>
            visible(key) ? (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={1.8}
                fill={`url(#grad-${key})`}
                dot={false}
                activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: "#0f172a" }}
              />
            ) : null
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Clickable legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {(
          [
            ["critical", COLORS.critical, "Critical"],
            ["high",     COLORS.high,     "High"],
            ["medium",   COLORS.medium,   "Medium"],
            ["low",      COLORS.low,      "Low"],
          ] as [string, string, string][]
        ).map(([key, color, label]) => (
          <button
            key={key}
            onClick={() => toggleSeries(key)}
            aria-pressed={visible(key)}
            aria-label={`Toggle ${label} series`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: 4,
              opacity: hiddenSeries.has(key) ? 0.3 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            <span
              style={{
                width: 10, height: 10,
                borderRadius: 2,
                background: color,
                display: "block",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Distribution ──────────────────────────────────────────────────────────

  const renderDistribution = () => {
    const total = DISTRIBUTION_DATA.reduce((s, x) => s + x.value, 0);
    return (
      <div>
        <SectionHeader
          title="Threat Distribution"
          subtitle="Breakdown by severity classification"
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel as never}
                >
                  {DISTRIBUTION_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, minWidth: 160 }}>
            {DISTRIBUTION_DATA.map((d) => {
              const pct = ((d.value / total) * 100).toFixed(1);
              return (
                <div key={d.name} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.65)",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <span
                        style={{
                          width: 8, height: 8,
                          borderRadius: "50%",
                          background: d.color,
                          display: "inline-block",
                        }}
                      />
                      {d.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#fff",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {d.value.toLocaleString()}{" "}
                      <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.07)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: d.color,
                        borderRadius: 2,
                        transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Radar ─────────────────────────────────────────────────────────────────

  const renderRadar = () => (
    <div>
      <SectionHeader
        title="Security Posture Score"
        subtitle="Current performance vs. industry benchmark"
      />
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke={CHART_COLORS.grid} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
            tickCount={4}
            stroke="transparent"
          />
          <Radar
            name="Your Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="Benchmark"
            dataKey="benchmark"
            stroke="#38bdf8"
            fill="#38bdf8"
            fillOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <Legend
            wrapperStyle={{
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              paddingTop: 8,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );

  // ── Sources ───────────────────────────────────────────────────────────────

  const renderSources = () => (
    <div>
      <SectionHeader
        title="Top Threat Sources"
        subtitle="Volume and block rate by attack vector"
      />
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={SOURCE_DATA}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="name" {...axisStyle} />
          <YAxis {...axisStyle} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={2000}
            stroke="rgba(244,63,94,0.4)"
            strokeDasharray="4 4"
            label={{
              value: "Alert threshold",
              fill: "rgba(244,63,94,0.55)",
              fontSize: 9,
              position: "insideTopRight",
            }}
          />
          <Bar
            dataKey="threats"
            name="Total"
            fill={CHART_COLORS.total}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="blocked"
            name="Blocked"
            fill={CHART_COLORS.blocked}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Risk summary table */}
      <div
        style={{
          marginTop: 16,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
        role="region"
        aria-label="Threat source risk summary"
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              {["Source", "Threats", "Blocked", "Block Rate"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOURCE_DATA.map((row, i) => {
              const blockRate = ((row.blocked / row.threats) * 100).toFixed(1);
              const rateNum   = parseFloat(blockRate);
              const rateColor =
                rateNum >= 90 ? COLORS.low :
                rateNum >= 75 ? COLORS.medium :
                                COLORS.critical;
              return (
                <tr
                  key={row.name}
                  style={{
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.15s ease",
                  }}
                >
                  <td
                    style={{
                      padding: "9px 12px",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.75)",
                      fontWeight: 600,
                    }}
                  >
                    {row.name}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {row.threats.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      fontSize: 12,
                      color: "rgba(255,,255,0.5)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {row.blocked.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      fontSize: 12,
                      color: rateColor,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {blockRate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: "#0b1020",
        minHeight: "100vh",
        color: "#fff",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Threat Analytics
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Real-time security monitoring &amp; insights
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: 20,
            }}
          >
            <span
              style={{
                width: 8, height: 8,
                borderRadius: "50%",
                background: "#34d399",
                boxShadow: "0 0 8px rgba(52,211,153,0.8)",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399", letterSpacing: "0.03em" }}>
              SYSTEM SECURE
            </span>
          </div>
        </header>

        {/* Summary Stats */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {SUMMARY_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Main Chart Card */}
        <div
          style={{
            background:
              "linear-gradient(135deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.018) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 20,
              padding: 4,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              width: "fit-content",
            }}
          >
            {(
              [
                ["timeline",     "Timeline"],
                ["distribution", "Distribution"],
                ["radar",        "Posture"],
                ["sources",      "Sources"],
              ] as [ActiveChart, string][]
            ).map(([id, label]) => (
              <ChartTab
                key={id}
                id={id}
                label={label}
                active={activeChart === id}
                onClick={setActiveChart}
              />
            ))}
          </div>

          {activeChart === "timeline"     && renderTimeline()}
          {activeChart === "distribution" && renderDistribution()}
          {activeChart === "radar"        && renderRadar()}
          {activeChart === "sources"      && renderSources()}
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 8, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
            Data refreshed every 5 minutes • Last updated: just now
          </p>
        </footer>
      </div>

      {/* Keyframes for Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}