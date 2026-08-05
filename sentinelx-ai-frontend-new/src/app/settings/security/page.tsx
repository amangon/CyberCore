"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Laptop2, Lock, ShieldCheck, Sparkles, Smartphone, Timer } from "lucide-react";
import settingsService from "@/services/settings.service";
import type { ConnectedDevice, SecurityPreferences, SessionRecord } from "@/types/settings";

export default function SecuritySettingsPage() {
  const [security, setSecurity] = useState<SecurityPreferences | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [securitySettings, activeSessions, connectedDevices] = await Promise.all([
          settingsService.getSecuritySettings(),
          settingsService.getSessions(),
          settingsService.getConnectedDevices(),
        ]);

        if (isMounted) {
          setSecurity(securitySettings);
          setSessions(activeSessions);
          setDevices(connectedDevices);
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

  const saveSecurity = async () => {
    if (!security) {
      return;
    }

    await settingsService.updateNotificationSettings({});
    await settingsService.updateWorkspace({});
    await settingsService.updateOrganization({});
  };

  if (loading || !security) {
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
                <Sparkles size={13} /> Security
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Protect the workspace with resilient access controls</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Review password strength, monitor MFA, and manage sessions across trusted and untrusted devices.</p>
            </div>
            <button onClick={saveSecurity} className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Save changes
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-2.5 text-cyan-200">
                <Lock size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Password & MFA</h2>
                <p className="text-sm text-slate-400">Policies that keep access healthy and resilient</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Password policy</span>
                <textarea
                  value={security.passwordPolicy}
                  onChange={(event) => setSecurity({ ...security, passwordPolicy: event.target.value })}
                  rows={3}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Session timeout (min)</span>
                  <input
                    type="number"
                    value={security.sessionTimeoutMinutes}
                    onChange={(event) => setSecurity({ ...security, sessionTimeoutMinutes: Number(event.target.value) })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Recovery codes required</span>
                  <select
                    value={security.requireRecoveryCode ? "enabled" : "disabled"}
                    onChange={(event) => setSecurity({ ...security, requireRecoveryCode: event.target.value === "enabled" })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Multi-factor authentication</p>
                    <p className="mt-1 text-sm text-slate-400">Users are protected with a second factor to reduce account takeover risk.</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${security.mfaEnabled ? "bg-emerald-500/12 text-emerald-300" : "bg-amber-500/12 text-amber-300"}`}>
                    {security.mfaEnabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/12 p-2.5 text-violet-200">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Security posture</h2>
                <p className="text-sm text-slate-400">Current trust and protection coverage</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { label: "Auto-lock", value: security.autoLock ? "Enabled" : "Disabled" },
                { label: "Device trust", value: security.allowDeviceTrust ? "Allowed" : "Restricted" },
                { label: "Recovery codes", value: security.requireRecoveryCode ? "Required" : "Optional" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/12 p-2.5 text-emerald-200">
                <Laptop2 size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Active sessions</h2>
                <p className="text-sm text-slate-400">Track where your workspace is currently in use</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{session.device}</p>
                      <p className="mt-1 text-sm text-slate-400">{session.location} • {session.ipAddress}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${session.status === "active" ? "bg-emerald-500/12 text-emerald-300" : session.status === "idle" ? "bg-amber-500/12 text-amber-300" : "bg-rose-500/12 text-rose-300"}`}>
                      {session.status}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <Timer size={14} className="text-cyan-300" /> Last seen {new Date(session.lastSeen).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/12 p-2.5 text-amber-200">
                <Smartphone size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Connected devices</h2>
                <p className="text-sm text-slate-400">Review trust and access for managed endpoints</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{device.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{device.platform} • {device.ipAddress}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${device.trusted ? "bg-emerald-500/12 text-emerald-300" : "bg-amber-500/12 text-amber-300"}`}>
                      {device.trusted ? "Trusted" : "Review"}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <AlertTriangle size={14} className="text-cyan-300" /> Last active {new Date(device.lastSeen).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
