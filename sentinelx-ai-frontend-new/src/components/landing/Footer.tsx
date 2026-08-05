"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const product = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Threat Intelligence", href: "/threats" },
  { label: "Scanner", href: "/scan" },
  { label: "Integrations", href: "/integrations" },
  { label: "Reports", href: "/reports" },
];
const security = [
  { label: "Threat Detection", href: "/threats" },
  { label: "Vulnerability Management", href: "/assets" },
  { label: "IOC Analysis", href: "/ioc" },
  { label: "API Security", href: "/settings/api" },
];
const company = [
  { label: "About", href: "/" },
  { label: "Documentation", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl sm:p-8"
        >
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-white">SentinelX AI</div>
                  <div className="text-xs text-slate-400">Cybersecurity Intelligence</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                AI-powered cybersecurity intelligence platform for modern digital protection.
              </p>
            </motion.div>

            {[
              ["Product", product],
              ["Security", security],
              ["Company", company],
            ].map(([title, items], idx) => (
              <motion.div
                key={String(title)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.06 * (idx + 1) }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  {String(title)}
                </h3>
                <ul className="mt-4 space-y-3">
                  {(items as { label: string; href: string }[]).map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-slate-300 transition hover:text-cyan-200"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                Security Status
              </div>

              <div className="mt-5 space-y-4">
                {[
                  ["SYSTEM STATUS", "ONLINE", "emerald"],
                  ["AI ENGINE", "ACTIVE", "cyan"],
                  ["THREAT MONITORING", "RUNNING", "violet"],
                ].map(([label, value, tone]) => (
                  <div key={label as string} className="flex items-center justify-between gap-4">
                    <div className="text-xs tracking-[0.16em] text-slate-400">{label as string}</div>
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className={[
                          "h-2 w-2 rounded-full",
                          tone === "emerald"
                            ? "bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]"
                            : tone === "cyan"
                              ? "bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]"
                              : "bg-violet-300 shadow-[0_0_16px_rgba(196,181,253,0.9)]",
                        ].join(" ")}
                      />
                      <span className="text-sm font-medium text-white">{value as string}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">© 2026 SentinelX AI. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <Link href="/" className="text-slate-400 transition hover:text-cyan-200">
                Privacy Policy
              </Link>
              <Link href="/" className="text-slate-400 transition hover:text-cyan-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

