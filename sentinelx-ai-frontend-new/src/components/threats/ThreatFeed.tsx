'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { AlertTriangle, Bug, Globe, Link2, Radio, Loader2, RefreshCw } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getThreatErrorMessage, getThreats } from '@/services/threat.service';

type FeedItem = {
  title: string;
  source: string;
  severity: 'Critical' | 'High' | 'Medium';
  time: string;
  icon: typeof AlertTriangle;
};

const severityStyles: Record<FeedItem['severity'], string> = {
  Critical: 'border-red-500/20 bg-red-500/10 text-red-300',
  High: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
  Medium: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
};

const iconMap = {
  AlertTriangle,
  Bug,
  Globe,
  Link2,
} as const;

function toSeverityLabel(value: string): FeedItem['severity'] {
  const v = value.toLowerCase();
  if (v === 'critical') return 'Critical';
  if (v === 'high') return 'High';
  return 'Medium';
}

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'recently';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function toFeedItem(raw: {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  source?: string;
  country?: string;
  timestamp?: string;
  payload?: unknown;
}): FeedItem {
  const payload = (raw.payload ?? {}) as Record<string, unknown>;
  // Choose an icon based on threat type / keywords (visual only, no fake data).
  const haystack = `${raw.title ?? ''} ${raw.type ?? ''} ${raw.description ?? ''}`.toLowerCase();
  const hasCountry = Boolean(raw.country);
  const networkRelated = haystack.includes('ip') || haystack.includes('network');
  const icon: keyof typeof iconMap =
    haystack.includes('malware') || haystack.includes('ransom') || haystack.includes('trojan') || haystack.includes('botnet')
      ? 'Bug'
      : haystack.includes('phish') || haystack.includes('url') || haystack.includes('link') || haystack.includes('domain')
        ? 'Link2'
        : hasCountry || networkRelated
          ? 'Globe'
          : 'AlertTriangle';

  return {
    title: raw.title ?? 'Threat intelligence update',
    source: raw.source ?? 'Global Threat Intelligence',
    severity: toSeverityLabel(String(raw.severity ?? payload.severity ?? 'medium')),
    time: relativeTime(raw.timestamp ?? '') || 'recently',
    icon: iconMap[icon],
  };
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function ThreatFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedStats, setFeedStats] = useState<{ activeCampaigns: string; newIndicators: string; blockedThreats: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThreats({ limit: 50 });
      const items = (data.feed ?? []).slice(0, 12).map((t) =>
        toFeedItem({
          id: t.id,
          title: t.title,
          description: t.description,
          type: t.type,
          severity: t.severity,
          source: t.source,
          country: t.country,
          timestamp: t.timestamp,
          payload: undefined,
        }),
      );
      setFeed(items.length > 0 ? items : []);
      setFeedStats({
        activeCampaigns: data.stats?.activeThreats != null ? data.stats.activeThreats.toLocaleString() : '0',
        newIndicators: data.stats?.newIndicators != null ? data.stats.newIndicators.toLocaleString() : '0',
        blockedThreats: data.stats?.blockedThreats != null ? data.stats.blockedThreats.toLocaleString() : '0',
      });
    } catch (err) {
      setError(getThreatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = feedStats
    ? [
        { label: 'Active Campaigns', value: feedStats.activeCampaigns },
        { label: 'New Indicators', value: feedStats.newIndicators },
        { label: 'Blocked Threats', value: feedStats.blockedThreats },
      ]
    : [
        { label: 'Active Campaigns', value: '0' },
        { label: 'New Indicators', value: '0' },
        { label: 'Blocked Threats', value: '0' },
      ];

  return (
    <Card className="overflow-hidden border border-cyan-500/20 bg-slate-950/80 text-slate-100 shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
          </span>
          <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-300">LIVE</Badge>
        </div>

        <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">Live Threat Feed</h3>
        <p className="mt-1 text-sm text-slate-400">Real-time global cyber intelligence updates.</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative max-h-[560px] overflow-y-auto p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.08),transparent_25%)]" />

        {loading ? (
          <div className="relative flex min-h-[180px] items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live intelligence...
          </div>
        ) : error ? (
          <div className="relative flex min-h-[180px] flex-col items-center justify-center gap-3 text-center text-sm text-rose-200">
            <AlertTriangle className="h-6 w-6" />
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
        ) : feed.length === 0 ? (
          <div className="relative flex min-h-[180px] items-center justify-center text-sm text-slate-400">
            No threat feed items available right now.
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="relative space-y-3">
            {feed.map((t, index) => {
              const Icon = t.icon;

              return (
                <motion.article
                  key={`${t.title}-${index}`}
                  variants={item}
                  className="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900/80"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative mt-0.5">
                      <motion.div
                        className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                        <Icon className="h-5 w-5 text-cyan-300" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="truncate font-medium text-white">{t.title}</h4>
                        <Badge className={severityStyles[t.severity]}>{t.severity}</Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                        <span>{t.source}</span>
                        <span className="text-slate-600">•</span>
                        <span>{t.time}</span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-300" />
            Streaming intel feed
          </span>
        </div>
      </div>
    </Card>
  );
}

