"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

const trust = ["AI Threat Detection", "Real-time Monitoring", "Enterprise Security"];

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-6 py-14 text-center shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl sm:px-10 sm:py-16"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />

          <motion.div
            animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-3xl"
          />

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-cyan-300/20 bg-slate-950/70 text-cyan-300 shadow-[0_0_50px_rgba(34,211,238,0.25)]"
          >
            <ShieldCheck className="h-10 w-10" />
            <span className="absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-cyan-300/15" />
          </motion.div>

          <div className="relative mt-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium tracking-[0.22em] text-cyan-200/90">
              <Sparkles className="h-3.5 w-3.5" />
              ENTERPRISE DEFENSE
            </p>

            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Secure Your Digital Infrastructure Today
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Start monitoring threats, analyzing vulnerabilities and protecting your systems with AI-powered cybersecurity intelligence.
            </p>
          </div>

          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:shadow-cyan-400/20"
              >
                Launch SentinelX AI
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-300/20 hover:bg-cyan-400/10 hover:text-cyan-100"
              >
                Explore Dashboard
              </Link>
            </motion.div>
          </div>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            {trust.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm text-slate-200"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
                {item}
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0">
            <motion.span
              animate={{ x: [0, 18, 0], y: [0, -12, 0], opacity: [0.25, 0.7, 0.25] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[18%] top-[24%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.95)]"
            />
            <motion.span
              animate={{ x: [0, -14, 0], y: [0, 16, 0], opacity: [0.2, 0.75, 0.2] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute right-[16%] top-[30%] h-2.5 w-2.5 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,0.95)]"
            />
            <motion.span
              animate={{ x: [0, 10, 0], y: [0, -18, 0], opacity: [0.18, 0.6, 0.18] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute bottom-[22%] left-[28%] h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(96,165,250,0.9)]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}