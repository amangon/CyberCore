'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Bug, Users, Loader2 } from 'lucide-react';

import ThreatMap from '@/components/threats/ThreatMap';
import ThreatFeed from '@/components/threats/ThreatFeed';
import MalwareIntelligence from '@/components/threats/MalwareIntelligence';
import CVEList from '@/components/threats/CVEList';
import APTGroups from '@/components/threats/APTGroups';
import { getThreatErrorMessage, getThreats } from '@/services/threat.service';

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const, staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

export default function ThreatsPage() {
  const [stats, setStats] = useState<{ label: string; value: string; icon: typeof AlertTriangle }[]>([
    { label: 'Active Threats', value: '—', icon: AlertTriangle },
    { label: 'Critical CVEs', value: '—', icon: ShieldAlert },
    { label: 'Malware Families', value: '—', icon: Bug },
    { label: 'APT Groups', value: '—', icon: Users },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getThreats({ limit: 50 });
        if (!active) return;
        setStats([
          {
            label: 'Active Threats',
            value: (data.stats?.activeThreats ?? 0).toLocaleString() || '0',
            icon: AlertTriangle,
          },
          {
            label: 'Critical CVEs',
            value: (data.stats?.criticalCVEs ?? 0).toLocaleString() || '0',
            icon: ShieldAlert,
          },
          {
            label: 'Malware Families',
            value: (data.stats?.malwareFamilies ?? 0).toLocaleString() || '0',
            icon: Bug,
          },
          {
            label: 'APT Groups',
            value: (data.stats?.aptGroups ?? 0).toLocaleString() || '0',
            icon: Users,
          },
        ]);
      } catch (err) {
        if (active) {
          const message = getThreatErrorMessage(err);
          setStats([
            { label: 'Active Threats', value: '—', icon: AlertTriangle },
            { label: 'Critical CVEs', value: '—', icon: ShieldAlert },
            { label: 'Malware Families', value: '—', icon: Bug },
            { label: 'APT Groups', value: '—', icon: Users },
          ]);
          console.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.main
      className="min-h-screen bg-slate-950 text-slate-100"
      initial="hidden"
      animate="show"
      variants={pageVariants}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.section
          variants={itemVariants}
          className="mb-8 rounded-3xl border border-cyan-500/20 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
              SentinelX AI • Threat Intelligence Center
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Threat Intelligence Center
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              Monitor global cyber threats, malware campaigns, vulnerabilities and threat actors using AI intelligence.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <motion.div
                  key={label}
                  variants={itemVariants}
                  className="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg shadow-black/20 backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">{label}</p>
                    <Icon className="h-5 w-5 text-cyan-300 transition-colors group-hover:text-cyan-200" />
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    {loading ? <Loader2 className="inline h-6 w-6 animate-spin" /> : value}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-12">
          <motion.section
            variants={itemVariants}
            className="xl:col-span-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-medium text-white">Global Threat Activity</h2>
            </div>
            <div className="p-2 sm:p-4">
              <ThreatMap />
            </div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="xl:col-span-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-purple-950/20 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-medium text-white">Live Threat Intelligence</h2>
            </div>
            <div className="p-4">
              <ThreatFeed />
            </div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="xl:col-span-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-medium text-white">Malware Intelligence</h2>
            </div>
            <div className="p-4">
              <MalwareIntelligence />
            </div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="xl:col-span-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-medium text-white">Vulnerability Intelligence</h2>
            </div>
            <div className="p-4">
              <CVEList />
            </div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="xl:col-span-12 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-purple-950/20 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-medium text-white">Threat Actors</h2>
            </div>
            <div className="p-4">
              <APTGroups />
            </div>
          </motion.section>
        </div>
      </div>
    </motion.main>
  );
}