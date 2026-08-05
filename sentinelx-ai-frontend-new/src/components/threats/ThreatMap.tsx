'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, ShieldAlert, Zap, Plus, Minus, Maximize2, Loader2, RefreshCw } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Graticule, Sphere, Marker, Line } from 'react-simple-maps';

import { Badge } from '@/components/ui/Badge';
import { getThreatErrorMessage, getThreats } from '@/services/threat.service';

import geoUrl from '@/lib/world-countries.json';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

type AttackNode = {
  country: string;
  coordinates: [number, number];
  threats: number;
  severity: Severity;
  campaigns: number;
};

type AttackPath = {
  source: AttackNode;
  target: AttackNode;
  severity: Severity;
};

const stats = [
  { label: 'Critical Attacks', value: '0', icon: ShieldAlert },
  { label: 'Active Campaigns', value: '0', icon: Zap },
  { label: 'Blocked Threats', value: '0', icon: Globe },
];

const severityLegend: { label: Severity; tone: string; ring: string }[] = [
  { label: 'Critical', tone: 'bg-red-500', ring: 'shadow-red-500/60' },
  { label: 'High', tone: 'bg-orange-400', ring: 'shadow-orange-400/60' },
  { label: 'Medium', tone: 'bg-amber-300', ring: 'shadow-amber-300/60' },
  { label: 'Low', tone: 'bg-emerald-300', ring: 'shadow-emerald-300/60' },
];

const severityDot: Record<Severity, string> = {
  Critical: 'fill-red-500',
  High: 'fill-orange-400',
  Medium: 'fill-amber-300',
  Low: 'fill-emerald-300',
};

const severityGlow: Record<Severity, string> = {
  Critical: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]',
  High: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.9)]',
  Medium: 'drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]',
  Low: 'drop-shadow-[0_0_8px_rgba(110,231,183,0.9)]',
};

const severityColor: Record<Severity, string> = {
  Critical: '#f87171',
  High: '#fb923c',
  Medium: '#fcd34d',
  Low: '#6ee7b7',
};

const severityLineColor: Record<Severity, string> = {
  Critical: 'rgba(239,68,68,0.5)',
  High: 'rgba(251,146,60,0.4)',
  Medium: 'rgba(252,211,77,0.3)',
  Low: 'rgba(110,231,183,0.2)',
};

const tooltipWidth = 230;

function toSeverity(value: string): Severity {
  const v = value.toLowerCase();
  if (v === 'critical') return 'Critical';
  if (v === 'high') return 'High';
  if (v === 'medium') return 'Medium';
  return 'Low';
}

function buildNodes(
  feed: ReadonlyArray<{
    country?: string;
    coordinates?: readonly [number, number];
    severity?: string;
    title?: string;
    source?: string;
    timestamp?: string;
  }>,
): AttackNode[] {
  const grouped = new Map<string, { coordinates: [number, number]; severity: Severity; threats: number }>();

  for (const item of feed) {
    if (!item.country || !item.coordinates || item.coordinates.length < 2) continue;
    const key = item.country;
    const existing = grouped.get(key);
    if (existing) {
      existing.threats += 1;
      // Upgrade severity if this item is more severe
      const itemSev = toSeverity(String(item.severity ?? 'medium'));
      const sevOrder: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
      if (sevOrder.indexOf(itemSev) > sevOrder.indexOf(existing.severity)) {
        existing.severity = itemSev;
      }
      continue;
    }
    grouped.set(key, {
      coordinates: [Number(item.coordinates[0]) || 0, Number(item.coordinates[1]) || 0],
      severity: toSeverity(String(item.severity ?? 'medium')),
      threats: 1,
    });
  }

  const nodes = Array.from(grouped.entries()).map(([country, data]) => ({
    country,
    coordinates: data.coordinates,
    threats: data.threats,
    severity: data.severity,
    campaigns: Math.max(1, Math.round(data.threats / 3)),
  }));

  return nodes.sort((a, b) => b.threats - a.threats).slice(0, 20);
}

function buildAttackPaths(nodes: AttackNode[]): AttackPath[] {
  if (nodes.length < 2) return [];
  const paths: AttackPath[] = [];
  const topNodes = nodes.slice(0, Math.min(nodes.length, 8));

  // Connect each top node to others to form attack paths
  for (let i = 0; i < topNodes.length; i++) {
    for (let j = i + 1; j < topNodes.length; j++) {
      if (paths.length >= 12) break;
      // Use the higher severity between the two nodes
      const sevOrder: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
      const pathSeverity = sevOrder.indexOf(topNodes[i].severity) >= sevOrder.indexOf(topNodes[j].severity)
        ? topNodes[i].severity
        : topNodes[j].severity;
      paths.push({
        source: topNodes[i],
        target: topNodes[j],
        severity: pathSeverity,
      });
    }
    if (paths.length >= 12) break;
  }

  return paths;
}

function clusterNodes(nodes: AttackNode[], zoom: number): AttackNode[] {
  if (zoom >= 2.5) return nodes; // Don't cluster when zoomed in
  // Simple clustering: merge nodes that are too close together
  const threshold = 5 / zoom; // Degrees of lat/lng
  const merged: AttackNode[] = [];
  const used = new Set<number>();

  for (let i = 0; i < nodes.length; i++) {
if (used.has(i)) continue;
    const cluster = { ...nodes[i] };
    used.add(i);

    for (let j = i + 1; j < nodes.length; j++) {
      if (used.has(j)) continue;
      const dx = Math.abs(nodes[i].coordinates[0] - nodes[j].coordinates[0]);
      const dy = Math.abs(nodes[i].coordinates[1] - nodes[j].coordinates[1]);
      if (dx < threshold && dy < threshold) {
        cluster.threats += nodes[j].threats;
        cluster.campaigns += nodes[j].campaigns;
        // Use higher severity
        const sevOrder: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
        if (sevOrder.indexOf(nodes[j].severity) > sevOrder.indexOf(cluster.severity)) {
          cluster.severity = nodes[j].severity;
        }
        used.add(j);
      }
    }
    merged.push(cluster);
  }

  return merged;
}

export default function ThreatMap() {
  const [attackNodes, setAttackNodes] = useState<AttackNode[]>([]);
  const [liveStats, setLiveStats] = useState<typeof stats>(stats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<AttackNode | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const mapStroke = useMemo(() => 'rgba(103,232,249,0.16)', []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThreats({ limit: 100 });
      const nodes = buildNodes(data.feed);
      setAttackNodes(nodes);
      setLiveStats([
        {
          label: 'Critical Attacks',
          value: nodes.filter((n) => n.severity === 'Critical').length.toLocaleString() || '0',
          icon: ShieldAlert,
        },
        {
          label: 'Active Campaigns',
          value: (data.stats?.activeThreats ?? 0).toLocaleString() || '0',
          icon: Zap,
        },
        {
          label: 'Blocked Threats',
          value: (data.stats?.blockedThreats ?? 0).toLocaleString() || '0',
          icon: Globe,
        },
      ]);
    } catch (err) {
      setError(getThreatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clusteredNodes = useMemo(() => clusterNodes(attackNodes, zoom), [attackNodes, zoom]);
  const attackPaths = useMemo(() => buildAttackPaths(clusteredNodes), [clusteredNodes]);

  const handleCountryEnter = useCallback(
    (geo: { properties: { name?: string } }, evt: React.MouseEvent) => {
      const geoName = (geo.properties.name ?? '').toLowerCase();
      const node = clusteredNodes.find((n) => n.country.toLowerCase() === geoName);
      if (!node) return;
      setTooltip({ x: evt.clientX, y: evt.clientY });
      setHovered(node);
      setTooltipVisible(true);
    },
    [clusteredNodes],
  );

  const handleCountryLeave = useCallback(() => {
    setHovered(null);
    setTooltipVisible(false);
  }, []);

  const handleMarkerEnter = useCallback((node: AttackNode, evt: React.MouseEvent) => {
    setTooltip({ x: evt.clientX, y: evt.clientY });
    setHovered(node);
    setTooltipVisible(true);
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(6, z + 0.6)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(1, z - 0.6)), []);
  const resetZoom = useCallback(() => {
    setZoom(1);
    setCenter([0, 20]);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomIn, zoomOut, resetZoom]);

  // Compute tooltip position based on the stored mouse position, not the ref during render
  const tooltipStyle = useMemo(() => {
    if (!tooltip || !tooltipVisible || !hovered) return {};
    const maxWidth = 320;
    return {
      left: Math.min(Math.max(tooltip.x, 10), maxWidth - tooltipWidth - 10),
      top: Math.max(tooltip.y - 130, 10),
      width: tooltipWidth,
    };
  }, [tooltip, tooltipVisible, hovered]);

  return (
    <div className="relative h-[650px] w-full overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/80 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      {/* Ambient gradients + grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.16),transparent_42%),radial-gradient(circle_at_85%_85%,rgba(168,85,247,0.14),transparent_40%),radial-gradient(circle_at_60%_45%,rgba(56,189,248,0.1),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,23,0.55)_100%)]" />

      <div ref={wrapRef} className="relative h-full w-full">
        {/* Header */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              Real-time telemetry
            </Badge>
            <span className="hidden text-xs uppercase tracking-[0.24em] text-slate-500 sm:inline">
              Global Threat Map
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {severityLegend.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 backdrop-blur-md"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${s.tone} shadow-[0_0_16px_currentColor]`} />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="absolute inset-0">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading threat telemetry...
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-rose-200">
              <ShieldAlert className="h-8 w-8" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-medium text-rose-200 transition hover:bg-rose-500/20"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 145,
                center: [0, 20],
              }}
              width={1200}
              height={620}
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            >
              <ZoomableGroup
                zoom={zoom}
                center={center}
                onMoveEnd={(pos: { zoom: number; coordinates: [number, number] }) => {
                  setZoom(pos.zoom);
                  setCenter(pos.coordinates);
                }}
              >
                <Sphere
                  id="sphere"
                  fill="rgba(2,6,23,0.35)"
                  stroke="rgba(56,189,248,0.18)"
                  strokeWidth={0.6}
                />
                <Graticule stroke="rgba(56,189,248,0.07)" />

                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const geoName = (geo.properties.name ?? '').toLowerCase();
                      const node = clusteredNodes.find(
                        (n) => n.country.toLowerCase() === geoName,
                      );
                      const isActive = !!node;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={
                            isActive
                              ? node.severity === 'Critical'
                                ? 'rgba(239,68,68,0.20)'
                                : node.severity === 'High'
                                  ? 'rgba(251,146,60,0.18)'
                                  : node.severity === 'Medium'
                                    ? 'rgba(252,211,77,0.16)'
                                    : 'rgba(110,231,183,0.14)'
                              : 'rgba(30,64,99,0.28)'
                          }
                          stroke={isActive ? 'rgba(103,232,249,0.45)' : mapStroke}
                          strokeWidth={0.55}
                          onMouseEnter={(evt) => handleCountryEnter(geo, evt)}
                          onMouseLeave={handleCountryLeave}
                          style={{
                            default: { outline: 'none' },
                            hover: {
                              fill: isActive
                                ? 'rgba(34,211,238,0.35)'
                                : 'rgba(56,189,248,0.22)',
                              stroke: 'rgba(34,211,238,0.85)',
                              strokeWidth: 1,
                              outline: 'none',
                            },
                            pressed: { outline: 'none' },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {/* Animated attack paths between countries */}
                {attackPaths.map((path, i) => (
                  <g key={`path-${i}`}>
                    <Line
                      from={path.source.coordinates}
                      to={path.target.coordinates}
                      stroke={severityLineColor[path.severity]}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeDasharray="6 8"
                      className="attack-line"
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Direction arrow dot at midpoint */}
                    <Marker
                      coordinates={[
                        (path.source.coordinates[0] + path.target.coordinates[0]) / 2,
                        (path.source.coordinates[1] + path.target.coordinates[1]) / 2,
                      ]}
                    >
                      <circle
                        r={3}
                        fill={severityColor[path.severity]}
                        opacity={0.8}
                        className="attack-pulse"
                      />
                    </Marker>
                  </g>
                ))}

                {/* Attack nodes with severity-based sizing */}
                {clusteredNodes.map((node, i) => {
                  const markerSize = Math.min(8, 4 + node.threats * 0.5);
                  return (
                    <Marker
                      key={`marker-${i}`}
                      coordinates={node.coordinates}
                      onMouseEnter={(evt) => handleMarkerEnter(node, evt)}
                      onMouseLeave={handleCountryLeave}
                      style={{ pointerEvents: 'all' }}
                    >
                      <motion.g
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                      >
                        <circle
                          r={markerSize * 3}
                          fill={severityColor[node.severity]}
                          opacity={0.12}
                          className="pulse-ring"
                        />
                        <circle
                          r={markerSize * 2}
                          fill={severityColor[node.severity]}
                          opacity={0.25}
                          className="pulse-ring"
                        />
                        <circle
                          r={markerSize}
                          fill={severityColor[node.severity]}
                          className={severityGlow[node.severity]}
                        />
                      </motion.g>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>
          )}
        </div>

        {/* Attack line gradient defs */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.1)" />
              <stop offset="50%" stopColor="rgba(34,211,238,0.9)" />
              <stop offset="100%" stopColor="rgba(168,85,247,0.1)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Zoom controls */}
        <div className="absolute right-3 top-16 z-30 flex flex-col gap-2">
          {[
            { label: 'Zoom in', icon: Plus, onClick: zoomIn },
            { label: 'Zoom out', icon: Minus, onClick: zoomOut },
            { label: 'Reset view', icon: Maximize2, onClick: resetZoom },
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onClick={onClick}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-slate-200 shadow-lg shadow-black/30 backdrop-blur-md transition hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Hover tooltip - positioned using state, not ref during render */}
        {hovered && tooltipVisible && tooltip && (
          <div
            ref={tooltipRef}
            className="pointer-events-none absolute z-40 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
            style={tooltipStyle}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-white">{hovered.country}</p>
              <Badge
                className={`shrink-0 border ${
                  hovered.severity === 'Critical'
                    ? 'border-red-500/40 bg-red-500/10 text-red-300'
                    : hovered.severity === 'High'
                      ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                      : hovered.severity === 'Medium'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {hovered.severity}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Threats</p>
                <p className="mt-0.5 font-semibold text-cyan-300">{hovered.threats}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Campaigns</p>
                <p className="mt-0.5 font-semibold text-cyan-300">{hovered.campaigns}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom status bar */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Live overview</p>
            <p className="mt-1 text-sm text-slate-200">
              {hovered && tooltipVisible
                ? `${hovered.country} • ${hovered.threats} active threats • ${hovered.campaigns} campaigns`
                : `${clusteredNodes.length} countries tracked • ${attackPaths.length} attack paths`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="h-4 w-4 text-cyan-300" />
            Global attack surface mapped
          </div>
        </div>
      </div>

      {/* Right panel: stats */}
      <div className="absolute right-4 top-1/2 z-20 hidden w-56 -translate-y-1/2 flex-col gap-3 lg:flex">
        {liveStats.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
            className="rounded-2xl border border-white/10 bg-slate-950/75 p-3.5 shadow-lg shadow-black/30 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{label}</p>
              <Icon className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white">
              {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : value}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-3.5 backdrop-blur-md"
        >
          <p className="text-sm font-medium text-white">Threat Locations</p>
          <div className="mt-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading locations...
              </div>
            ) : error ? (
              <p className="text-xs text-rose-200">{error}</p>
            ) : clusteredNodes.length === 0 ? (
              <p className="text-xs text-slate-400">No threat locations yet.</p>
            ) : (
              clusteredNodes.map((node) => (
                <button
                  key={node.country}
                  type="button"
                  onMouseEnter={(e) => handleMarkerEnter(node, e)}
                  onMouseLeave={handleCountryLeave}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-left transition hover:border-cyan-400/30 hover:bg-cyan-500/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-200">{node.country}</p>
                    <p className="text-[10px] text-slate-500">{node.threats} threats</p>
                  </div>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${severityDot[node.severity]} ${severityGlow[node.severity]}`} />
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Mobile/tablet stats strip */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex gap-2 overflow-x-auto border-t border-white/10 bg-slate-950/80 px-3 py-2.5 backdrop-blur-md lg:hidden">
        {liveStats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex min-w-[140px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          >
            <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
            <div className="min-w-0">
              <p className="truncate text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
              <p className="text-sm font-semibold text-white">
                {loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 0.7; }
          70% { transform: scale(2.6); opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .pulse-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: pulse-ring 2.4s ease-out infinite;
        }
        .pulse-ring:nth-of-type(2) { animation-delay: 0.8s; }
        @keyframes dash-flow {
          to { stroke-dashoffset: -64; }
        }
        .attack-line {
          animation: dash-flow 2.6s linear infinite;
        }
        @keyframes pulse-attack {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .attack-pulse {
          animation: pulse-attack 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
