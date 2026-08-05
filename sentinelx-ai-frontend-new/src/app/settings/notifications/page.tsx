"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, Mail, MessageSquareMore, Sparkles, Smartphone, Zap } from "lucide-react";
import settingsService from "@/services/settings.service";
import type { NotificationPreferences } from "@/types/settings";

export default function NotificationsSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await settingsService.getNotificationSettings();
        if (isMounted) {
          setPreferences(data);
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

  const savePreferences = async () => {
    if (!preferences) {
      return;
    }

    await settingsService.updateNotificationSettings(preferences);
  };

  if (loading || !preferences) {
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
                <Sparkles size={13} /> Notifications
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Alert delivery channels and notification cadence</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Route critical alerts to the correct teams without overwhelming operators.</p>
            </div>
            <button onClick={savePreferences} className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Save changes
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-2.5 text-cyan-200">
                <BellRing size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Delivery channels</h2>
                <p className="text-sm text-slate-400">Enable each channel for operational awareness</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { key: "email", label: "Email", icon: Mail },
                { key: "push", label: "Push", icon: Smartphone },
                { key: "slack", label: "Slack", icon: MessageSquareMore },
                { key: "teams", label: "Teams", icon: MessageSquareMore },
              ].map((channel) => {
                const Icon = channel.icon;
                const enabled = preferences.channels.includes(channel.key as NotificationPreferences["channels"][number]);

                return (
                  <div key={channel.key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 text-cyan-200">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{channel.label}</p>
                        <p className="text-sm text-slate-400">{channel.label} notifications for incident and alert updates</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const nextChannels = enabled
                          ? preferences.channels.filter((item) => item !== channel.key)
                          : [...preferences.channels, channel.key as NotificationPreferences["channels"][number]];
                        setPreferences({ ...preferences, channels: nextChannels });
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${enabled ? "bg-emerald-500/12 text-emerald-300" : "bg-slate-800/70 text-slate-400"}`}
                    >
                      {enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/12 p-2.5 text-violet-200">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Alert preferences</h2>
                <p className="text-sm text-slate-400">Tune urgency, cadence, and routing behavior</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Digest frequency</span>
                <select
                  value={preferences.digestFrequency}
                  onChange={(event) => setPreferences({ ...preferences, digestFrequency: event.target.value as NotificationPreferences["digestFrequency"] })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="real-time">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Email alerts</p>
                  <p className="text-sm text-slate-400">Send summary and incident related emails</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, emailAlerts: !preferences.emailAlerts })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${preferences.emailAlerts ? "bg-emerald-500/12 text-emerald-300" : "bg-slate-800/70 text-slate-400"}`}
                >
                  {preferences.emailAlerts ? "On" : "Off"}
                </button>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Push alerts</p>
                  <p className="text-sm text-slate-400">Send real-time notifications to mobile devices</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, pushAlerts: !preferences.pushAlerts })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${preferences.pushAlerts ? "bg-emerald-500/12 text-emerald-300" : "bg-slate-800/70 text-slate-400"}`}
                >
                  {preferences.pushAlerts ? "On" : "Off"}
                </button>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Critical-only alerts</p>
                  <p className="text-sm text-slate-400">Limit nonessential noise to high severity events</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, criticalOnly: !preferences.criticalOnly })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${preferences.criticalOnly ? "bg-emerald-500/12 text-emerald-300" : "bg-slate-800/70 text-slate-400"}`}
                >
                  {preferences.criticalOnly ? "On" : "Off"}
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
