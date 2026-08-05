"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Check, Sparkles } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  highlight?: boolean;
  features: string[];
  cta: { label: string; href: string };
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Essential AI threat monitoring for individuals and small teams.",
    features: [
      "Basic asset monitoring",
      "10 objects / day scanner",
      "Community threat intel",
      "Email alerts",
      "7-day report history",
    ],
    cta: { label: "Get Started", href: "/register" },
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "Advanced detection and automation for security professionals.",
    highlight: true,
    features: [
      "Unlimited assets & endpoints",
      "Unlimited scans + API access",
      "Live threat intelligence feed",
      "IOC investigation toolkit",
      "Slack / webhook notifications",
      "90-day report history",
    ],
    cta: { label: "Start Free Trial", href: "/register" },
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Dedicated deployment with compliance and custom integrations.",
    features: [
      "Everything in Professional",
      "SSO / SAML & MFA",
      "On-premise or private cloud",
      "99.99% uptime SLA",
      "Dedicated security engineer",
      "Unlimited report retention",
    ],
    cta: { label: "Contact Sales", href: "/register" },
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl">
            <Sparkles className="h-4 w-4" />
            Flexible Pricing
          </div>

          <h2 className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            Simple, Transparent Pricing
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
            Choose the plan that fits your security posture. Scale as your
            organization grows.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="mt-14 grid gap-6 lg:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.article
              key={plan.name}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.98 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.5, ease: "easeOut" as const },
                },
              }}
              whileHover={{ y: -6 }}
              className={[
                "group relative flex flex-col rounded-3xl border p-7",
                plan.highlight
                  ? "border-cyan-400/30 bg-gradient-to-b from-cyan-400/10 via-white/5 to-transparent shadow-[0_0_60px_rgba(34,211,238,0.15)]"
                  : "border-white/10 bg-white/5",
              ].join(" ")}
            >
              {plan.highlight ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/30 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.2)]">
                  Most Popular
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <BadgeCheck className={plan.highlight ? "h-5 w-5 text-cyan-300" : "h-5 w-5 text-slate-500"} />
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">
                  {plan.price}
                </span>
                {plan.period ? (
                  <span className="text-sm text-slate-400">{plan.period}</span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span
                      className={[
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        plan.highlight
                          ? "bg-cyan-400/15 text-cyan-300"
                          : "bg-white/5 text-slate-400",
                      ].join(" ")}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={[
                  "mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition",
                  plan.highlight
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:from-cyan-300 hover:to-blue-400"
                    : "border border-white/10 bg-white/5 text-white hover:border-cyan-400/25 hover:bg-white/10",
                ].join(" ")}
              >
                {plan.cta.label}
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

