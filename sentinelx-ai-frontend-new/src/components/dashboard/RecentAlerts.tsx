'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Network,
  ArrowRight,
  RefreshCw,
  Server,
  type LucideIcon,
} from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getDashboard } from '@/services/dashboard.service';
import { getApiErrorMessage } from '@/lib/api';
import type { DashboardRecentAlert } from '@/types/security';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

type AlertItem = {
  id: string;
  title: string;
  source: string;
  time: string;
  severity: Severity;
  icon: LucideIcon;
};

const severityStyles: Record<
  Severity,
  { className: string; labelClassName: string }
> = {
  Critical: {
    className: 'border-red-500/20 bg-red-500/10 text-red-300',
    labelClassName: 'text-red-300',
  },
  High: {
    className: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
    labelClassName: 'text-orange-300',
  },
  Medium: {
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    labelClassName: 'text-amber-300',
  },
  Low: {
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    labelClassName: 'text-emerald-300',
  },
};

function toSeverity(value: string): Severity {
  const normalized = value.toLowerCase();
  if (normalized === 'critical') return 'Critical';
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  return 'Low';
}

function severityIcon(severity: Severity): LucideIcon {
  switch (severity) {
    case 'Critical':
      return ShieldAlert;
    case 'High':
      return AlertTriangle;
    case 'Medium':
      return Network;
    default:
      return Server;
  }
}

function toRelativeTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function RecentAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getDashboard();
      const raw = dashboard.recentAlerts ?? [];

      const mapped = raw
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((alert: DashboardRecentAlert) => {
          const severity = toSeverity(alert.severity);
          return {
            id: alert.id,
            title: alert.title || 'Untitled alert',
            source: alert.source || 'Unknown source',
            time: toRelativeTime(alert.createdAt),
            severity,
            icon: severityIcon(severity),
          };
        });

      setAlerts(mapped);
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
    <Card className="border-slate-800/80 bg-slate-950/90 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur">
      <div className="flex items-start justify-between gap-4 border-b border-slate-800/70 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white">
            Recent Alerts
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Latest detected security events
          </p>
        </div>
        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
          <ShieldAlert className="h-4 w-4" />
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-start gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4"
              >
                <div className="h-9 w-9 rounded-lg bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-800" />
                  <div className="h-3 w-1/3 rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-10 text-center">
            <RefreshCw className="h-6 w-6 text-amber-400" />
            <p className="text-sm text-slate-400">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-10 text-center">
            <p className="text-sm text-slate-400">No recent alerts.</p>
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.08 },
              },
            }}
            className="space-y-2"
          >
            {alerts.map((alert) => {
              const Icon = alert.icon;
              const severity = severityStyles[alert.severity];
              const href = alert.id ? `/alerts/${alert.id}` : '/alerts';

              return (
                <motion.li
                  key={`${alert.id}-${alert.title}`}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="group rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 transition-colors hover:border-cyan-500/30 hover:bg-slate-900/90"
                >
                  <Link href={href} className="block">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/10 p-2 text-cyan-300 transition-colors group-hover:bg-cyan-500/15">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-medium text-white">
                              {alert.title}
                            </h4>
                            <p className="mt-1 text-xs text-slate-400">
                              Source: <span className="text-slate-300">{alert.source}</span>
                            </p>
                          </div>

                          <Badge
                            className={`shrink-0 border ${severity.className}`}
                          >
                            {alert.severity}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>{alert.time}</span>
                          <span className={`font-medium ${severity.labelClassName}`}>
                            {alert.severity} threat
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>

      <div className="border-t border-slate-800/70 px-5 py-4">
        <Link
          href="/alerts"
          className="group inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          View All Alerts
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  );
}

