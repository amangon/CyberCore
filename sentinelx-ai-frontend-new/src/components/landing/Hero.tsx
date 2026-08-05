"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import AIRobot from "@/components/landing/AIRobot";

const stats = [
  { value: "50K+", label: "Threats Detected" },
  { value: "10K+", label: "Assets Protected" },
  { value: "99.8%", label: "Detection Accuracy" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#020617] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] opacity-15" />
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.16, 0.34, 0.16], y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-10 top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.12, 0.28, 0.12], x: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-10 top-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
              <Sparkles className="h-3.5 w-3.5" />
              AI Powered Cybersecurity Platform
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Secure Your Digital World
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                With AI-Powered Threat Intelligence
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Detect threats, analyze vulnerabilities and protect your infrastructure with advanced artificial intelligence security systems.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 font-semibold text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.18)] transition hover:from-cyan-300 hover:to-blue-400"
                >
                  Launch SentinelX
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-slate-100 backdrop-blur-md transition hover:border-cyan-400/25 hover:bg-white/10"
                >
                  Explore Dashboard
                </Link>
              </motion.div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Trusted by security teams worldwide
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 + index * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-lg shadow-slate-950/20 backdrop-blur-xl"
                >
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative z-10"
          >
            <AIRobot />
          </motion.div>
        </div>
      </div>

      <motion.div
        aria-hidden="true"
        animate={{ y: [0, 24, 0], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] bg-[length:100%_6px] opacity-20" />
    </section>
  );
}