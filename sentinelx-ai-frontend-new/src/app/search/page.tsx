"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Database, FileSearch, Search, ShieldAlert, Target } from "lucide-react";

const suggestions = [
  "finance-db-01",
  "CVE-2024-4244",
  "vpn-gateway-02",
  "8.8.8.8",
];

const resultGroups = [
  {
    title: "Assets",
    icon: Database,
    results: [
      { name: "finance-db-01", detail: "Critical Database • Finance", href: "/assets" },
      { name: "vpn-gateway-02", detail: "Network Appliance • Edge", href: "/assets" },
    ],
  },
  {
    title: "Alerts",
    icon: ShieldAlert,
    results: [
      { name: "Ransomware Encryption Attempt", detail: "Critical • 12 min ago", href: "/alerts" },
      { name: "Credential Reuse Attack", detail: "High • 48 min ago", href: "/alerts" },
    ],
  },
  {
    title: "Threats",
    icon: Target,
    results: [
      { name: "CVE-2024-4244", detail: "Remote Code Execution", href: "/threats" },
      { name: "APT-41", detail: "Threat Actor Group", href: "/threats" },
    ],
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const hasQuery = query.trim().length > 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(to_bottom,#020617,#020617)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
              <FileSearch className="h-7 w-7" />
            </div>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                <Search className="h-3.5 w-3.5" />
                Global Search
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Security Search
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Search across assets, alerts, threats, indicators and reports.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 focus-within:border-cyan-400/30">
            <Search className="ml-2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search threats, assets, vulnerabilities..."
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-slate-500 outline-none"
              aria-label="Global search"
            />
          </div>

          {!hasQuery ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/25 hover:bg-white/10 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {hasQuery ? (
          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(168,85,247,0.08)] backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">
                Results for &ldquo;{query}&rdquo;
              </h2>
              <span className="text-xs text-slate-400">6 matches</span>
            </div>

            <div className="space-y-6">
              {resultGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.title}>
                    <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <Icon className="h-4 w-4" />
                      {group.title}
                    </div>
                    <div className="space-y-2">
                      {group.results.map((result) => (
                        <Link
                          key={result.name}
                          href={result.href}
                          className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-cyan-400/20 hover:bg-white/10"
                        >
                          <div>
                            <div className="text-sm font-semibold text-white">{result.name}</div>
                            <div className="text-xs text-slate-400">{result.detail}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

