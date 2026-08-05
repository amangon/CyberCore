"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plug, Server, ShieldAlert, Target } from "lucide-react";

type Stat = {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  target: number;
  decimals?: number;
};

const stats: Stat[] = [
  { icon: ShieldAlert, value: "50K+", label: "Threats Detected", target: 50000 },
  { icon: Server, value: "10K+", label: "Assets Protected", target: 10000 },
  { icon: Target, value: "99.8%", label: "Detection Accuracy", target: 99.8, decimals: 1 },
  { icon: Plug, value: "13+", label: "Security Integrations", target: 13 },
];

function CountUp({
  target,
  decimals = 0,
  suffix,
}: {
  target: number;
  decimals?: number;
  suffix: string;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const duration = 1400;
    const start = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCurrent(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <span>
      {decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()}
      {suffix}
    </span>
  );
}

export default function SecurityStats() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),_transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300/80">
            SentinelX AI
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Trusted Security Intelligence
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            AI-powered cybersecurity infrastructure protecting modern digital environments.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map(({ icon: Icon, value, label, target, decimals }) => {
            const suffix = value.replace(/[0-9.,]/g, "");

            return (
              <motion.article
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 24, scale: 0.98 },
                  show: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_40%)]" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                    >
                      <Icon className="h-6 w-6" />
                    </motion.div>
                    <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
                  </div>

                  <div className="text-4xl font-semibold tracking-tight text-white">
                    <CountUp target={target} decimals={decimals} suffix={suffix} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-300">{label}</p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}