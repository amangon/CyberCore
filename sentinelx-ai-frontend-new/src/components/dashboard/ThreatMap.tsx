'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, ShieldCheck, Globe2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { getDashboard } from '@/services/dashboard.service';
import { getApiErrorMessage } from '@/lib/api';
import type { ThreatItem } from '@/types/security';

type RegionKey = 'us' | 'eu' | 'asia' | 'me';

type ThreatRegion = {
  name: string;
  threats: number;
  top: string;
  x: string;
  y: string;
  size: string;
  delay: number;
  severity: 'critical' | 'high' | 'medium';
};

const REGION_TEMPLATE: Record<RegionKey, Omit<ThreatRegion, 'threats'>> = {
  us: { name: 'United States', top: 'North America', x: '20%', y: '39%', size: '1.05rem', delay: 0, severity: 'high' },
  eu: { name: 'Europe', top: 'EU', x: '50%', y: '31%', size: '0.95rem', delay: 0.2, severity: 'medium' },
  asia: { name: 'Asia', top: 'APAC', x: '72%', y: '39%', size: '1.15rem', delay: 0.35, severity: 'critical' },
  me: { name: 'Middle East', top: 'MEA', x: '57%', y: '43%', size: '0.82rem', delay: 0.5, severity: 'medium' },
};

const COUNTRY_REGION: Record<string, RegionKey> = {
  'united states': 'us',
  'united states of america': 'us',
  usa: 'us',
  us: 'us',
  america: 'us',
  'north america': 'us',
  canada: 'us',
  mexico: 'us',
  germany: 'eu',
  france: 'eu',
  uk: 'eu',
  england: 'eu',
  'united kingdom': 'eu',
  netherlands: 'eu',
  spain: 'eu',
  italy: 'eu',
  poland: 'eu',
  sweden: 'eu',
  switzerland: 'eu',
  austria: 'eu',
  belgium: 'eu',
  ireland: 'eu',
  portugal: 'eu',
  russia: 'eu',
  europe: 'eu',
  'asia pacific': 'asia',
  china: 'asia',
  japan: 'asia',
  india: 'asia',
  'south korea': 'asia',
  taiwan: 'asia',
  singapore: 'asia',
  vietnam: 'asia',
  'hong kong': 'asia',
  indonesia: 'asia',
  thailand: 'asia',
  asia: 'asia',
  'middle east': 'me',
  uae: 'me',
  'united arab emirates': 'me',
  saudi: 'me',
  'saudi arabia': 'me',
  israel: 'me',
  iran: 'me',
  qatar: 'me',
  egypt: 'me',
  turkey: 'me',
};

function mapCountryToRegion(country: string): RegionKey | null {
  const normalized = country.trim().toLowerCase();
  return COUNTRY_REGION[normalized] ?? null;
}

function resolveSeverity(country: string, fallback: ThreatRegion['severity']): ThreatRegion['severity'] {
  return fallback;
}

function buildRegions(feed: readonly ThreatItem[]): ThreatRegion[] {
  const counts: Record<RegionKey, number> = { us: 0, eu: 0, asia: 0, me: 0 };

  feed.forEach((threat) => {
    if (!threat.country) return;
    const key = mapCountryToRegion(threat.country);
    if (key) counts[key] += 1;
  });

  const totalMapped = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalThreats = feed.length;

  // Distribute threats that have no country mapping evenly-ish across regions.
  const leftover = Math.max(0, totalThreats - totalMapped);
  const perRegion = totalMapped > 0 ? Math.floor(leftover / 4) : Math.max(1, Math.ceil(totalThreats / 4));

  return (Object.keys(REGION_TEMPLATE) as RegionKey[]).map((key) => {
    const template = REGION_TEMPLATE[key];
    const threats = Math.max(counts[key], totalMapped === 0 ? perRegion : counts[key] + (counts[key] === 0 ? perRegion : 0));
    const severity = resolveSeverity(key, template.severity);
    return { ...template, threats, severity };
  });
}

function buildStats(feed: readonly ThreatItem[], blockedAttackCount: number | undefined) {
  const critical = feed.filter((t) => t.severity?.toLowerCase() === 'critical').length;
  const high = feed.filter((t) => t.severity?.toLowerCase() === 'high').length;
  const activeCampaigns = feed.filter((t) => t.status ? t.status.toLowerCase() !== 'blocked' : true).length || feed.length;
  const blocked = blockedAttackCount ?? feed.filter((t) => t.status?.toLowerCase() === 'blocked').length;

  return [
    { label: 'Critical attacks', value: String(critical || high || 0), icon: AlertTriangle, tone: 'text-red-400' },
    { label: 'Active campaigns', value: String(activeCampaigns), icon: ShieldAlert, tone: 'text-amber-400' },
    { label: 'Blocked attacks', value: blocked.toLocaleString(), icon: ShieldCheck, tone: 'text-emerald-400' },
  ];
}

type Stat = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
};

const linePairs = [
  ['20%', '39%', '50%', '31%'],
  ['50%', '31%', '72%', '39%'],
  ['57%', '43%', '72%', '39%'],
  ['20%', '39%', '57%', '43%'],
] as const;

export default function ThreatMap(): React.JSX.Element {
  const [regions, setRegions] = useState<ThreatRegion[]>(() => [
    { ...REGION_TEMPLATE.us, threats: 0 },
    { ...REGION_TEMPLATE.eu, threats: 0 },
    { ...REGION_TEMPLATE.asia, threats: 0 },
    { ...REGION_TEMPLATE.me, threats: 0 },
  ]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getDashboard();
      const feed = dashboard.threatFeed ?? [];
      setRegions(buildRegions(feed));
      setStats(buildStats(feed, dashboard.threatLevel?.blockedAttacks));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card className="relative overflow-hidden border-white/10 bg-slate-950/80 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))]" />
      <div className="relative p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-200">
              <Globe2 className="h-3.5 w-3.5" />
              Global Threat Map
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">Global Threat Map</h3>
            <p className="mt-1 text-sm text-slate-400">Live cyber attack activity worldwide</p>
          </div>

          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right sm:block">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Telemetry</div>
            <div className="mt-1 text-sm font-medium text-slate-200">
              {loading ? 'Syncing…' : error ? 'Offline' : 'Realtime global SOC feed'}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl border border-cyan-400/10 bg-slate-900/60"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.35)_70%,rgba(2,6,23,0.85)_100%)]" />

          <div className="relative aspect-[16/9] min-h-[360px]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.08)" />
                  <stop offset="50%" stopColor="rgba(56,189,248,0.45)" />
                  <stop offset="100%" stopColor="rgba(99,102,241,0.08)" />
                </linearGradient>
              </defs>

              {/* map silhouette */}
              <path
                d="M108 239l50-28 50 8 49-22 56 10 49-20 61 17 47-12 41 18 51-10 50 24 64-9 58 21 45 35-18 28-46 14-39-6-28 15-49-8-35 14-44-10-45 18-48-13-49 18-55-9-32 10-44-13-48 6-29-10-16-30z"
                fill="rgba(15,23,42,0.92)"
                stroke="rgba(56,189,248,0.16)"
                strokeWidth="1.5"
              />
              <path
                d="M140 266l36-10 29 4 33-14 41 6 43-15 34 10 39-7 35 14 42-3 42 16 32-2 36 16 32 24-13 18-28 11-25-4-19 11-34-5-24 10-33-8-29 11-33-6-32 11-38-5-21 7-25-8-30 3-23-7-12-22z"
                fill="rgba(34,211,238,0.04)"
                stroke="rgba(34,211,238,0.12)"
                strokeWidth="1"
              />

              {linePairs.map(([x1, y1, x2, y2]) => (
                <line
                  key={`${x1}-${y1}-${x2}-${y2}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#lineGrad)"
                  strokeWidth="1.8"
                  strokeDasharray="7 10"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
              ))}
            </svg>

            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Loading global telemetry…</p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
                <p className="max-w-[260px] text-sm text-slate-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
                >
                  Retry
                </button>
              </div>
            ) : (
              regions.map((region) => (
                <motion.div
                  key={region.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: region.delay, duration: 0.45, ease: 'easeOut' }}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: region.x, top: region.y }}
                >
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: region.delay }}
                      className={`absolute inset-0 rounded-full ${
                        region.severity === 'critical'
                          ? 'bg-red-500/50'
                          : region.severity === 'high'
                            ? 'bg-orange-400/50'
                            : 'bg-cyan-400/50'
                      } blur-md`}
                      style={{ width: region.size, height: region.size }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: region.delay }}
                      className={`relative rounded-full border border-white/25 shadow-[0_0_24px_rgba(34,211,238,0.22)] ${
                        region.severity === 'critical'
                          ? 'bg-red-400'
                          : region.severity === 'high'
                            ? 'bg-orange-400'
                            : 'bg-cyan-400'
                      }`}
                      style={{ width: region.size, height: region.size }}
                    />
                  </div>

                  <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-3 w-44 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 opacity-0 shadow-xl shadow-cyan-950/20 backdrop-blur-md transition-all duration-200 group-hover:opacity-100">
                    <div className="text-xs font-medium text-slate-100">{region.name}</div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Threats</span>
                      <span className="font-semibold text-slate-200">{region.threats}</span>
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">{region.top}</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="h-2 w-16 rounded bg-slate-700" />
                  <div className="mt-2 h-5 w-10 rounded bg-slate-700" />
                </div>
              ))
            : stats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-100">
                      {error ? '—' : value}
                    </div>
                  </div>
                  <Icon className={`h-5 w-5 ${tone}`} />
                </div>
              </div>
            ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Legend</div>
          {[
            { label: 'Critical', dot: 'bg-red-400' },
            { label: 'High', dot: 'bg-orange-400' },
            { label: 'Medium', dot: 'bg-cyan-400' },
          ].map((item) => (
            <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

