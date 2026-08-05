"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Database,
  Globe2,
  Link2,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

type Integration = {
  name: string;
  category: string;
  status: "Connected";
  icon: React.ComponentType<{ className?: string }>;
};

const integrations: Integration[] = [
  { name: "VirusTotal", category: "Threat Intelligence", status: "Connected", icon: ShieldCheck },
  { name: "AbuseIPDB", category: "IP Reputation", status: "Connected", icon: ShieldAlert },
  { name: "AlienVault OTX", category: "Threat Intelligence", status: "Connected", icon: Shield },
  { name: "Shodan", category: "Network Intelligence", status: "Connected", icon: Globe2 },
  { name: "Google Safe Browsing", category: "URL Protection", status: "Connected", icon: Link2 },
  { name: "NVD", category: "Vulnerability Database", status: "Connected", icon: Database },
];

export default function IntegrationsSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium tracking-[0.22em] text-cyan-200/90">
            <BadgeCheck className="h-3.5 w-3.5" />
            INTEGRATION ECOSYSTEM
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Powerful Security Integrations
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Connect with leading threat intelligence platforms and security APIs to enhance your protection.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {integrations.map((item) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.name}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.98 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
                }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-cyan-950/10 backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-0 rounded-[1.4rem] ring-1 ring-inset ring-white/10" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-950/70 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-white">{item.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{item.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    <motion.span
                      animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="h-2 w-2 rounded-full bg-emerald-300"
                    />
                    {item.status}
                  </div>
                </div>

                <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <motion.span
                      animate={{ scale: [1, 1.55, 1], opacity: [0.8, 0.15, 0.8] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-cyan-400/30"
                    />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Live connection</div>
                    <div className="text-xs text-slate-400">Encrypted API sync active</div>
                  </div>
                </div>

                <Link
                  href="/integrations"
                  className="relative mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:border-cyan-300/20 hover:bg-cyan-400/10 hover:text-cyan-100"
                >
                  View Details
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}