"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Moon, Palette, Sparkles, SunMedium, ToggleRight } from "lucide-react";
import settingsService from "@/services/settings.service";
import type { SettingsAccentColor, SettingsThemeMode } from "@/types/settings";

interface ThemeState {
  mode: SettingsThemeMode;
  accentColor: SettingsAccentColor;
}

export default function ThemeSettingsPage() {
  const [theme, setTheme] = useState<ThemeState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await settingsService.getTheme();
        if (isMounted) {
          setTheme(data);
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

  const saveTheme = async () => {
    if (!theme) {
      return;
    }

    await settingsService.setTheme(theme.mode);
    await settingsService.setAccentColor(theme.accentColor);
  };

  if (loading || !theme) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(135deg,#040816_0%,#07111e_40%,#0d1728_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="rounded-[30px] border border-white/10 bg-white/8 p-6 backdrop-blur-xl">
            <div className="h-8 w-48 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-72 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(135deg,#040816_0%,#07111e_40%,#0d1728_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.32)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
                <Sparkles size={13} /> Theme
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Visual identity and interface preferences</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Switch between appearance modes, accent colors, and density settings designed for a premium security console.</p>
            </div>
            <button onClick={saveTheme} className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Save changes
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-2.5 text-cyan-200">
                <Palette size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Appearance mode</h2>
                <p className="text-sm text-slate-400">Pick the palette that fits your workspace rhythm</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { value: "dark", label: "Dark", icon: Moon },
                { value: "light", label: "Light", icon: SunMedium },
                { value: "system", label: "System", icon: Monitor },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme({ ...theme, mode: option.value as SettingsThemeMode })}
                    className={`rounded-[24px] border px-4 py-4 text-left transition ${theme.mode === option.value ? "border-cyan-400/30 bg-cyan-500/12 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} />
                      <span className="font-semibold">{option.label}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{option.value === "dark" ? "High contrast security environment" : option.value === "light" ? "Bright and airy workspace" : "Follow system defaults"}</p>
                  </button>
                );
              })}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/12 p-2.5 text-violet-200">
                <Palette size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Accent color</h2>
                <p className="text-sm text-slate-400">Tune the interface highlight for your brand</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { value: "violet", label: "Violet", color: "bg-violet-500" },
                { value: "cyan", label: "Cyan", color: "bg-cyan-500" },
                { value: "emerald", label: "Emerald", color: "bg-emerald-500" },
                { value: "rose", label: "Rose", color: "bg-rose-500" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme({ ...theme, accentColor: option.value as SettingsAccentColor })}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${theme.accentColor === option.value ? "border-cyan-400/30 bg-cyan-500/12" : "border-white/10 bg-slate-950/60"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full ${option.color}`} />
                    <span className="text-sm font-semibold text-white">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.section>
        </div>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/12 p-2.5 text-emerald-200">
              <ToggleRight size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Interface ergonomics</h2>
              <p className="text-sm text-slate-400">Shape how the workspace feels in day-to-day use</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { title: "Compact mode", detail: "Reduce whitespace for dense review workflows", active: true },
              { title: "Animations", detail: "Smooth motion transitions for panel navigation", active: true },
              { title: "Density", detail: "Balanced spacing for analysts and executives", active: true },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
                <div className="mt-3 inline-flex rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  {item.active ? "Enabled" : "Disabled"}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
