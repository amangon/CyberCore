"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Bug,
  ChartNoAxesColumn,
  Radar,
  ScanSearch,
  Search,
  Shield,
} from "lucide-react";

type Feature = {
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const features: Feature[] = [
  {
    title: "AI Threat Detection",
    description:
      "Real-time AI analysis to identify malicious activities and cyber attacks.",
    Icon: Brain,
  },
  {
    title: "Threat Intelligence",
    description:
      "Monitor global threats, malware campaigns and threat actors.",
    Icon: Radar,
  },
  {
    title: "Vulnerability Management",
    description: "Discover CVEs, analyze risks and prioritize fixes.",
    Icon: Bug,
  },
  {
    title: "Automated Security Scanning",
    description: "Scan files, URLs, IPs and domains instantly.",
    Icon: ScanSearch,
  },
  {
    title: "IOC Investigation",
    description:
      "Analyze IPs, domains, hashes and indicators of compromise.",
    Icon: Search,
  },
  {
    title: "Security Analytics",
    description: "Visualize security posture and attack trends.",
    Icon: ChartNoAxesColumn,
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_30%)]" />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl">
            <Shield className="h-4 w-4" />
            SentinelX AI
          </div>

          <h2 className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            Advanced Security Intelligence
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
            Powerful AI-driven security tools designed to detect, analyze and
            prevent cyber threats.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {features.map(({ title, description, Icon }) => (
            <motion.article
              key={title}
              variants={itemVariants}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/8 hover:shadow-[0_0_40px_rgba(34,211,238,0.12),0_0_60px_rgba(168,85,247,0.08)]"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 via-blue-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-purple-500/15 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition-transform duration-300 group-hover:scale-110 group-hover:text-white">
                <Icon className="h-7 w-7 transition-transform duration-300 group-hover:rotate-6" />
              </div>

              <h3 className="relative mt-5 text-lg font-semibold text-white">
                {title}
              </h3>

              <p className="relative mt-3 text-sm leading-6 text-slate-300">
                {description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}