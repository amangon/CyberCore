import { useState, useMemo, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeverityItem {
  key: string;
  label: string;
  value: number;
  color: string;
  glowColor: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: SeverityItem;
  percent: number;
  value: number;
  midAngle: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export interface DistributionItem {
  label: string;
  value: number;
  color: string;
  glowColor: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

/** Map a backend distribution item into the chart's SeverityItem shape. */
function toSeverityItem(item: DistributionItem): SeverityItem {
  return {
    key: item.label.toLowerCase(),
    label: item.label,
    value: item.value,
    color: item.color,
    glowColor: item.glowColor,
    bgClass: item.bgClass,
    textClass: item.textClass,
    borderClass: item.borderClass,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function calcPercent(value: number, total: number): string {
  return total === 0 ? "0.0" : ((value / total) * 100).toFixed(1);
}

// ─── Active Shape ─────────────────────────────────────────────────────────────

function ActiveShape(props: ActiveShapeProps) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
  } = props;

  return (
    <g>
      {/* Outer glow ring */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.15}
      />
      {/* Expanded slice */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: `drop-shadow(0 0 8px ${payload.glowColor})`,
        }}
      />
      {/* Inner highlight ring */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius - 1}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { payload: SeverityItem; value: number }[];
  total?: number;
}

function CustomTooltip({ active, payload, total = 0 }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  const pct = calcPercent(item.value, total);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: item.color,
            boxShadow: `0 0 6px ${item.glowColor}`,
          }}
          aria-hidden="true"
        />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {item.label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-white">
        {item.value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        {pct}% of total alerts
      </p>
    </div>
  );
}

// ─── Center Label ─────────────────────────────────────────────────────────────

interface CenterLabelProps {
  cx: number;
  cy: number;
  activeIndex: number | null;
  total: number;
  data: SeverityItem[];
}

function CenterLabel({ cx, cy, activeIndex, total, data }: CenterLabelProps) {
  const active = activeIndex !== null ? data[activeIndex] : null;
  const pct = active ? calcPercent(active.value, total) : null;

  return (
    <g>
      {active ? (
        <>
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={active.color}
            fontSize={11}
            fontWeight={600}
            letterSpacing={2}
            style={{ textTransform: "uppercase" }}
          >
            {active.label}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={28}
            fontWeight={700}
            fontFamily="monospace"
          >
            {formatNumber(active.value)}
          </text>
          <text
            x={cx}
            y={cy + 32}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#64748b"
            fontSize={12}
            fontWeight={500}
          >
            {pct}%
          </text>
        </>
      ) : (
        <>
          <text
            x={cx}
            y={cy - 16}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#94a3b8"
            fontSize={11}
            fontWeight={500}
            letterSpacing={1.5}
          >
            TOTAL ALERTS
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={30}
            fontWeight={700}
            fontFamily="monospace"
          >
            {formatNumber(total)}
          </text>
          <text
            x={cx}
            y={cy + 32}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#64748b"
            fontSize={11}
          >
            last 24 hours
          </text>
        </>
      )}
    </g>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────────────────

interface LegendItemProps {
  item: SeverityItem;
  total: number;
  isActive: boolean;
  isAnyActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
}

function LegendItem({
  item,
  total,
  isActive,
  isAnyActive,
  onEnter,
  onLeave,
}: LegendItemProps) {
  const pct = calcPercent(item.value, total);
  const dimmed = isAnyActive && !isActive;

  return (
    <li
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`
        group flex cursor-default items-center justify-between
        rounded-xl border px-3 py-2.5
        transition-all duration-200
        ${isActive
          ? `${item.bgClass} ${item.borderClass} shadow-lg`
          : dimmed
            ? "border-white/[0.03] bg-transparent opacity-40"
            : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05]"
        }
      `}
      aria-label={`${item.label}: ${item.value.toLocaleString()} alerts, ${pct}%`}
    >
      {/* Left: swatch + label */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-200"
          style={{
            backgroundColor: item.color,
            boxShadow: isActive ? `0 0 8px ${item.glowColor}` : "none",
          }}
          aria-hidden="true"
        />
        <span
          className={`truncate text-sm font-medium transition-colors duration-200 ${
            isActive ? item.textClass : "text-slate-400"
          }`}
        >
          {item.label}
        </span>
      </div>

      {/* Right: value + percentage bar */}
      <div className="ml-3 flex shrink-0 items-center gap-3">
        <span className="text-sm font-bold tabular-nums text-white">
          {item.value.toLocaleString()}
        </span>
        <div className="flex w-14 flex-col items-end gap-1">
          <span
            className={`text-xs font-semibold tabular-nums ${
              isActive ? item.textClass : "text-slate-500"
            }`}
          >
            {pct}%
          </span>
          {/* Mini progress bar */}
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: item.color,
                opacity: dimmed ? 0.2 : 1,
                boxShadow: isActive ? `0 0 4px ${item.glowColor}` : "none",
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </li>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AlertDistribution({ distribution = [] }: { distribution?: readonly DistributionItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

const SEVERITY_DATA = useMemo<SeverityItem[]>(
    () => distribution.map((item) => toSeverityItem(item)),
    [distribution],
  );

  const total = useMemo(
    () => SEVERITY_DATA.reduce((s, d) => s + d.value, 0),
    [SEVERITY_DATA]
  );

  const criticalPct = useMemo(
    () => parseFloat(calcPercent(SEVERITY_DATA[0]?.value ?? 0, total)),
    [SEVERITY_DATA, total]
  );

  const handleMouseEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  return (
    <section
      className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-slate-900/70 p-5 shadow-xl backdrop-blur-xl"
      aria-label="Alert severity distribution"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">
            Alert Distribution
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            By severity · Last 24 hours ·{" "}
            <time dateTime="2026-08-01T08:35:45Z">08:35 UTC</time>
          </p>
        </div>

        {/* Critical spike badge */}
        {criticalPct >= 4 && (
          <div
            className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1"
            role="status"
            aria-label={`Critical alerts at ${criticalPct.toFixed(1)}%`}
          >
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-rose-400">
              {criticalPct.toFixed(1)}% Critical
            </span>
          </div>
        )}
      </div>

      {/* Chart + Legend layout */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        {/* Donut */}
        <div
          className="relative mx-auto w-full max-w-xs shrink-0 lg:mx-0"
          style={{ height: 280 }}
          aria-hidden="true"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SEVERITY_DATA}
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="78%"
                dataKey="value"
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                activeShape={ActiveShape as never}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                isAnimationActive
                animationBegin={0}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {SEVERITY_DATA.map((entry, index) => (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.3
                    }
                    style={{ outline: "none", cursor: "pointer" }}
                  />
                ))}
              </Pie>

              {/* Center label rendered as a custom shape via label prop */}
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={0}
                dataKey="value"
                isAnimationActive={false}
                label={(props) => (
                  <CenterLabel
                    cx={props.cx}
                    cy={props.cy}
                    activeIndex={activeIndex}
                    total={total}
                    data={SEVERITY_DATA}
                  />
                )}
                labelLine={false}
              >
                <Cell fill="transparent" />
              </Pie>

              <Tooltip
                content={(props: unknown) => (
                  <CustomTooltip
                    active={(props as { active?: boolean })?.active}
                    payload={(props as { payload?: TooltipProps["payload"] })?.payload}
                    total={total}
                  />
                )}
                wrapperStyle={{ outline: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <ul
          className="flex flex-1 flex-col gap-2"
          role="list"
          aria-label="Severity breakdown"
        >
          {SEVERITY_DATA.map((item, index) => (
            <LegendItem
              key={item.key}
              item={item}
              total={total}
              isActive={activeIndex === index}
              isAnyActive={activeIndex !== null}
              onEnter={() => setActiveIndex(index)}
              onLeave={() => setActiveIndex(null)}
            />
          ))}
        </ul>
      </div>

      {/* Footer bar */}
      <div
        className="overflow-hidden rounded-full"
        role="img"
        aria-label="Proportional severity breakdown bar"
      >
        <div className="flex h-1.5 w-full">
          {SEVERITY_DATA.map((item, index) => {
            const pct = (item.value / total) * 100;
            return (
              <div
                key={item.key}
                className="h-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color,
                  opacity:
                    activeIndex === null || activeIndex === index ? 1 : 0.2,
                  boxShadow:
                    activeIndex === index
                      ? `0 0 6px ${item.glowColor}`
                      : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Footer meta */}
      <p className="text-center text-[10px] text-slate-600">
        Hover slices or legend rows to inspect · Data refreshes every 60 seconds
      </p>
    </section>
  );
}