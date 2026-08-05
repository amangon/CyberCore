"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { Shield, Activity, Loader2 } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

function LoginFormFallback() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.16),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.12),transparent_30%)]" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-2 lg:px-10 lg:py-0"
      >
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center"
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm text-cyan-100 backdrop-blur-xl">
              <Shield className="h-4 w-4 text-cyan-300" />
              SentinelX AI
            </div>

            <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              AI-powered cybersecurity intelligence platform
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Protecting digital infrastructure with AI intelligence
            </p>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Security Monitoring</p>
                    <p className="text-xs text-slate-400">Live threat telemetry</p>
                  </div>
                </div>
                <Activity className="h-5 w-5 text-cyan-300" />
              </div>

              <div className="mt-6 flex h-28 items-end gap-3">
                <div className="h-10 w-2 rounded-full bg-cyan-400/70 animate-pulse" />
                <div className="h-16 w-2 rounded-full bg-cyan-300/80 animate-pulse [animation-delay:150ms]" />
                <div className="h-8 w-2 rounded-full bg-violet-400/70 animate-pulse [animation-delay:300ms]" />
                <div className="h-20 w-2 rounded-full bg-cyan-300/90 animate-pulse [animation-delay:450ms]" />
                <div className="h-12 w-2 rounded-full bg-violet-400/80 animate-pulse [animation-delay:600ms]" />
                <div className="h-24 w-2 rounded-full bg-cyan-400/80 animate-pulse [animation-delay:750ms]" />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 24, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.05 }}
          className="flex items-center justify-center"
        >
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-cyan-400/15 via-transparent to-violet-500/15 blur-2xl" />
<div className="rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}