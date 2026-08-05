'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  FileSearch,
  Globe,
  ArrowRight,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getDashboard } from '@/services/dashboard.service';
import { getApiErrorMessage } from '@/lib/api';
import type { DashboardRecentScan } from '@/types/security';

type Status = 'Completed' | 'Running' | 'Failed' | 'Queued';
type Risk = 'Low' | 'Medium' | 'High' | 'Scanning';

type ScanItem = {
  id: string;
  name: string;
  status: Status;
  risk: Risk;
  time: string;
  icon: LucideIcon;
  riskScore: number;
};

const statusStyles: Record<Status, string> = {
  Completed: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  Running: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  Failed: 'border-red-500/20 bg-red-500/10 text-red-300',
  Queued: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
};

const riskStyles: Record<Risk, string> = {
  Low: 'text-emerald-300',
  Medium: 'text-amber-300',
  High: 'text-red-300',
  Scanning: 'text-cyan-300',
};

function scanTypeIcon(type: string): LucideIcon {
  const t = type.toLowerCase();
  if (t === 'file') return FileSearch;
  if (t === 'url') return Globe;
  if (t === 'ip') return Shield;
  if (t === 'hash') return FileSearch;
  return Shield;
}

function toStatus(value: string): Status {
  const v = value.toLowerCase();
  if (v === 'completed' || v === 'safe' || v === 'suspicious' || v === 'malicious') return 'Completed';
  if (v === 'running' || v === 'in_progress' || v === 'processing') return 'Running';
  if (v === 'failed' || v === 'error') return 'Failed';
  if (v === 'queued' || v === 'pending') return 'Queued';
  return 'Completed';
}

function toRisk(score: number, status: string): Risk {
  if (toStatus(status) === 'Running') return 'Scanning';
  if (score >= 80) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
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

export default function RecentScans() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getDashboard();
      const raw = dashboard.recentScans ?? [];

      const mapped = raw
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((scan: DashboardRecentScan) => ({
          id: scan.id,
          name: scan.target || 'Untitled scan',
          status: toStatus(scan.status),
          risk: toRisk(scan.riskScore, scan.status),
          time: toRelativeTime(scan.createdAt),
          icon: scanTypeIcon(scan.type),
          riskScore: scan.riskScore,
        }));

      setScans(mapped);
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
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="rounded-2xl border border-white/5 bg-white/5"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/70 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white">
              Recent Scans
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Latest security analysis activity
            </p>
          </div>
          <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
            <Shield className="h-4 w-4" />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
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
          ) : scans.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-10 text-center">
              <p className="text-sm text-slate-400">No recent scans.</p>
            </div>
          ) : (
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08 } },
              }}
              className="space-y-2"
            >
              {scans.map((scan) => {
                const Icon = scan.icon;
                const isRunning = scan.status === 'Running';

                return (
                  <motion.li
                    key={scan.id || scan.name}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="group rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 transition-colors hover:border-cyan-500/30 hover:bg-slate-900/90"
                  >
                    <Link href={scan.id ? `/scan` : '/scan'} className="block">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/10 p-2 text-cyan-300 transition-colors group-hover:bg-cyan-500/15">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-medium text-white">
                                {scan.name}
                              </h4>
                              <p className="mt-1 text-xs text-slate-400">
                                Time: <span className="text-slate-300">{scan.time}</span>
                              </p>
                            </div>

                            <Badge className={`shrink-0 border ${statusStyles[scan.status]}`}>
                              {scan.status}
                            </Badge>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Risk:</span>
                              <span className={`font-medium ${riskStyles[scan.risk]}`}>
                                {scan.risk}
                              </span>
                            </div>

                            {isRunning ? (
                              <div className="w-28 overflow-hidden rounded-full bg-slate-800/80">
                                <motion.div
                                  className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500"
                                  initial={{ width: '30%' }}
                                  animate={{ width: ['30%', '72%', '44%'] }}
                                  transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-1.5 w-28 rounded-full bg-slate-800/80">
                                <div className="h-1.5 w-full rounded-full bg-emerald-500/70" />
                              </div>
                            )}
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
            href="/scan"
            className="group inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
          >
            View Scan History
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </Card>
  );
}