"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CreditCard, ReceiptText, Sparkles, TrendingUp } from "lucide-react";
import settingsService from "@/services/settings.service";
import type { BillingSettings } from "@/types/settings";

export default function BillingSettingsPage() {
  const [data, setData] = useState<BillingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const result = await settingsService.getBillingSettings();
        if (isMounted) {
          setData(result);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(196,181,253,0.16),_transparent_28%),linear-gradient(135deg,#040816_0%,#07111e_40%,#0d1728_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="rounded-[30px] border border-white/10 bg-white/8 p-6 backdrop-blur-xl">
            <div className="h-8 w-44 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-72 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(196,181,253,0.16),_transparent_28%),linear-gradient(135deg,#040816_0%,#07111e_40%,#0d1728_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.32)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-300">
                <Sparkles size={13} /> Billing
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Subscription and usage overview</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Follow plan usage, renewal timing, and available upgrade paths in one premium view.</p>
            </div>
            <button className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Upgrade plan
            </button>
          </div>
        </header>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Current plan</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{data.planName}</h2>
              <p className="mt-2 text-sm text-slate-400">{data.planDescription}</p>
            </div>
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-emerald-300">
              Renews on {data.renewsOn}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Monthly cost", value: data.monthlyCost },
              { label: "Seats included", value: data.seatsIncluded },
              { label: "Support tier", value: data.supportTier },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-2.5 text-cyan-200">
                <TrendingUp size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Usage meters</h2>
                <p className="text-sm text-slate-400">Capacity consumed across the platform</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {data.usage.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.used} of {item.limit}</p>
                    </div>
                    <span className="rounded-full bg-cyan-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">{item.percent}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.min(item.percent, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/12 p-2.5 text-violet-200">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Payment methods</h2>
                <p className="text-sm text-slate-400">Cards and invoices on record</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {data.paymentMethods.map((method) => (
                <div key={method.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{method.brand} •••• {method.last4}</p>
                      <p className="mt-1 text-sm text-slate-400">Expires {method.expires}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${method.isDefault ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-slate-400"}`}>
                      {method.isDefault ? "Default" : "Backup"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </section>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/12 p-2.5 text-emerald-200">
              <ReceiptText size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Invoice history</h2>
              <p className="text-sm text-slate-400">Recent charges and downloadable receipts</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {data.invoices.map((invoice) => (
              <div key={invoice.id} className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{invoice.reference}</p>
                    <p className="mt-1 text-sm text-slate-400">{invoice.date}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    {invoice.amount}
                  </span>
                </div>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
                  View receipt <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
