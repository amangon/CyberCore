"use client";

import { motion } from "framer-motion";
import { Shield, Cpu, Zap } from "lucide-react";

export default function AIRobot() {
  return (
    <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl sm:min-h-[640px] lg:min-h-[720px]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.14),transparent_28%)]" />

      <motion.div
        aria-hidden="true"
        className="absolute h-72 w-72 rounded-full border border-cyan-400/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute h-96 w-96 rounded-full border border-fuchsia-400/15 border-dashed"
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-2xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex w-full max-w-5xl items-center justify-center">
        <div className="relative flex w-full items-center justify-center">
          <motion.div
            className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-cyan-400/30 bg-slate-900/80 px-4 py-2 text-[10px] font-semibold tracking-[0.35em] text-cyan-200 shadow-lg shadow-cyan-500/20 backdrop-blur-md"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            SENTINEL AI CORE
          </motion.div>

          <motion.div
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-2xl border border-cyan-400/20 bg-slate-900/70 px-4 py-3 shadow-lg shadow-cyan-500/10 backdrop-blur-md"
            animate={{ x: [0, -8, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-[0.3em] text-slate-400">
                  THREAT DETECTION
                </div>
                <div className="mt-1 text-sm font-bold text-white">99.8% Accuracy</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-2xl border border-fuchsia-400/20 bg-slate-900/70 px-4 py-3 shadow-lg shadow-fuchsia-500/10 backdrop-blur-md"
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-fuchsia-400/10 p-2 text-fuchsia-300">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-[0.3em] text-slate-400">
                  SYSTEM STATUS
                </div>
                <div className="mt-1 text-sm font-bold text-white">Protected</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute -bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-emerald-400/20 bg-slate-900/80 px-4 py-2 text-[10px] font-semibold tracking-[0.35em] text-emerald-300 shadow-lg shadow-emerald-500/10 backdrop-blur-md"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          >
            AI SECURITY ENGINE · ONLINE
          </motion.div>

          <div className="relative flex items-center justify-center">
            <motion.div
              aria-hidden="true"
              className="absolute inset-[-4rem] rounded-full border border-cyan-400/15"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-[2.5rem] bg-cyan-400/20 blur-3xl" />
              <div className="relative flex h-[320px] w-[260px] items-center justify-center rounded-[2.5rem] border border-cyan-400/20 bg-slate-900/60 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl sm:h-[380px] sm:w-[300px] lg:h-[460px] lg:w-[360px]">
                <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.1),rgba(15,23,42,0.55))]" />
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-x-6 top-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
                  animate={{ opacity: [0.35, 1, 0.35], scaleX: [0.7, 1, 0.7] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative flex h-full w-full items-center justify-center">
                  <motion.div
                    className="absolute h-[220px] w-[220px] rounded-full border border-cyan-400/25"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute h-[170px] w-[170px] rounded-full border border-fuchsia-400/20 border-dashed"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />

                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-cyan-300/20 bg-slate-950/80 shadow-inner shadow-cyan-500/20 sm:h-52 sm:w-52 lg:h-60 lg:w-60">
                      <motion.div
                        className="absolute inset-4 rounded-full border border-cyan-400/25"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-8 rounded-full border border-fuchsia-400/20"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                      />

                      <div className="relative flex flex-col items-center gap-3">
                        <motion.div
                          className="relative h-20 w-20 rounded-full border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.25)] sm:h-24 sm:w-24"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),rgba(34,211,238,0.15)_25%,transparent_60%)]" />
                          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.95)]" />
                        </motion.div>

                        <div className="text-center">
                          <div className="text-sm font-semibold tracking-[0.35em] text-cyan-100">
                            Sentinel AI Core
                          </div>
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.28em] text-emerald-300">
                            <Zap className="h-3.5 w-3.5" />
                            ONLINE
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-0"
                  >
                    {[...Array(12)].map((_, i) => (
                      <motion.span
                        key={i}
                        className="absolute h-1 w-1 rounded-full bg-cyan-300"
                        style={{
                          left: `${10 + ((i * 7) % 80)}%`,
                          top: `${8 + ((i * 11) % 82)}%`,
                        }}
                        animate={{
                          opacity: [0.2, 1, 0.2],
                          scale: [1, 1.8, 1],
                          y: [0, -8, 0],
                        }}
                        transition={{
                          duration: 2.5 + (i % 4),
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.18,
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}