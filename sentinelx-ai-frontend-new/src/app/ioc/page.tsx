'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, ShieldCheck, Target, Loader2 } from 'lucide-react';

import IOCSearch from '@/components/ioc/IOCSearch';
import IOCResult from '@/components/ioc/IOCResult';
import ReputationScore from '@/components/ioc/ReputationScore';
import DNSRecords from '@/components/ioc/DNSRecords';
import WHOISInfo from '@/components/ioc/WHOISInfo';
import { Card, CardContent } from '@/components/ui/Card';
import { useIOCStore } from '@/store';

type StatItem = {
  label: string;
  value: string;
  icon: typeof Search;
};

const section = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function IOCPage() {
  const { investigation, loading: storeLoading, recentSearches } = useIOCStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial loading state settles once the page has mounted (no fake API call).
    const t = window.setTimeout(() => setLoading(false), 250);
    return () => window.clearTimeout(t);
  }, []);

  const stats = useMemo<StatItem[]>(() => {
    const total = recentSearches.length;
    const latest = investigation;
    const latestRisk = latest?.riskScore ?? 0;
    const latestVerdict = latest?.verdict ?? null;

    const malicious = total > 0 ? (latestVerdict === 'malicious' || latestRisk >= 70 ? 1 : 0) : 0;
    const safe = total > 0 ? (latestVerdict === 'clean' || latestRisk < 25 ? 1 : 0) : 0;
    const accuracy =
      latest && latest.confidence > 0
        ? `${Math.round(latest.confidence)}%`
        : total > 0
          ? '—'
          : '—';

    return [
      { label: 'Total Investigations', value: String(total), icon: Search },
      { label: 'Malicious Indicators', value: String(malicious), icon: ShieldAlert },
      { label: 'Safe Indicators', value: String(safe), icon: ShieldCheck },
      { label: 'Threat Accuracy', value: accuracy, icon: Target },
    ];
  }, [investigation, recentSearches]);

  const isBusy = storeLoading || loading;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),radial-gradient(circle_at_right,_rgba(139,92,246,0.12),_transparent_30%),linear-gradient(to_bottom,_#020617,_#0f172a)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-cyan-300">
                SentinelX AI / IOC INTEL
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                IOC Investigation Center
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Investigate malicious indicators including IPs, domains, URLs and hashes using
                AI-powered threat intelligence.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }, index) => (
              <motion.div
                key={label}
                variants={section}
                initial="hidden"
                animate="show"
                transition={{ delay: index * 0.08 }}
              >
                <Card className="border border-cyan-400/20 bg-slate-950/60 shadow-lg shadow-cyan-950/10">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {isBusy ? <Loader2 className="inline h-5 w-5 animate-spin" /> : value}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </header>

        <motion.section
          variants={section}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-cyan-950/10 backdrop-blur-xl"
        >
          <IOCSearch />
        </motion.section>

<div className="grid gap-6 xl:grid-cols-3">
          <motion.section
            variants={section}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
            className="xl:col-span-2 min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-cyan-950/10 backdrop-blur-xl"
          >
            <IOCResult />
          </motion.section>

          <motion.section
            variants={section}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.14 }}
            className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-cyan-950/10 backdrop-blur-xl"
          >
            <DNSRecords />
          </motion.section>
        </div>

        <motion.section
          variants={section}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.18 }}
          className="w-full min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-cyan-950/10 backdrop-blur-xl"
        >
          <ReputationScore />
        </motion.section>

        <motion.section
          variants={section}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.22 }}
          className="w-full min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-cyan-950/10 backdrop-blur-xl"
        >
          <WHOISInfo />
        </motion.section>
      </div>
    </motion.main>
  );
}