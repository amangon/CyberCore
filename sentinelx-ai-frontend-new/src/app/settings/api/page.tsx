"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Copy,
  Check,
  KeyRound,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Webhook,
  X,
  Loader2,
} from "lucide-react";
import settingsService from "@/services/settings.service";
import type { ApiSettings } from "@/types/settings";

export default function APISettingsPage() {
  const [data, setData] = useState<ApiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createExpiry, setCreateExpiry] = useState(365);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await settingsService.getApiSettings();
      setData(result);
} catch {
      setActionError("Failed to load API keys. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await settingsService.getApiSettings();
        if (isMounted) setData(result);
      } catch {
        if (isMounted) setActionError("Failed to load API keys.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    setActionError(null);
    try {
      const created = await settingsService.generateApiKey({
        name: createName.trim(),
        description: createDescription.trim(),
        expiresInDays: createExpiry,
      });
      setNewKey(created.key);
      setShowCreate(false);
      setCreateName("");
      setCreateDescription("");
await load();
    } catch {
      setActionError("Failed to generate API key. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerate = async (id: string) => {
    setActionError(null);
    try {
      const regenerated = await settingsService.regenerateApiKey(id);
      setNewKey(regenerated.key);
await load();
    } catch {
      setActionError("Failed to regenerate API key.");
    }
  };

  const handleRevoke = async (id: string) => {
    setActionError(null);
    try {
      await settingsService.revokeApiKey(id);
      await load();
    } catch {
      setActionError("Failed to revoke API key.");
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await settingsService.deleteApiKey(id);
      await load();
    } catch {
      setActionError("Failed to delete API key.");
    }
  };

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_28%),linear-gradient(135deg,#040816_0%,#07111e_40%,#0d1728_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_28%),linear-gradient(135deg,#040816_0%,#07111e_40%,#0d1728_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.32)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
                <Sparkles size={13} /> API access
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Secure API governance and integrations</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Manage keys, webhook delivery, and trusted service connections without leaving the control center.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
            >
              Create new key
            </button>
          </div>
        </header>

        {actionError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {actionError}
          </div>
        ) : null}

        {newKey ? (
          <div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-200">New API key created</p>
                <p className="mt-1 text-xs text-emerald-200/70">Copy this key now — it will not be shown again.</p>
              </div>
              <button onClick={() => setNewKey(null)} className="text-emerald-200/70 hover:text-emerald-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 break-all rounded-lg bg-slate-950/60 px-3 py-2 font-mono text-sm text-emerald-100">
                {newKey}
              </code>
              <button
                onClick={() => copyValue(newKey)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
              >
                {copied === newKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === newKey ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : null}

        {showCreate ? (
          <div className="rounded-[24px] border border-cyan-500/30 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Generate a new API key</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                <span>Name</span>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Production key"
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                <span>Description</span>
                <input
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Optional description"
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                <span>Expiration (days)</span>
                <select
                  value={createExpiry}
                  onChange={(e) => setCreateExpiry(Number(e.target.value))}
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                  <option value={365}>1 year</option>
                  <option value={730}>2 years</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => void handleCreate()}
                disabled={creating || !createName.trim()}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
              >
                {creating ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                Generate key
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-2.5 text-cyan-200">
                <KeyRound size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">API keys</h2>
                <p className="text-sm text-slate-400">Rotate and review access credentials</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {data.apiKeys.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
No API keys yet. Click &ldquo;Create new key&rdquo; to generate one.
                </p>
              ) : (
                data.apiKeys.map((key) => (
                  <div key={key.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{key.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{key.description || "—"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${key.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                        {key.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1">
                        Last used {key.lastUsed}
                      </span>
                      <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1">
                        Expires {key.expiresAt}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => void handleRegenerate(key.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 transition hover:bg-cyan-500/20"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerate
                      </button>
                      {key.status === "active" ? (
                        <button
                          onClick={() => void handleRevoke(key.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 transition hover:bg-amber-500/20"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Revoke
                        </button>
                      ) : null}
                      <button
                        onClick={() => void handleDelete(key.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/12 p-2.5 text-violet-200">
                <Webhook size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Webhook delivery</h2>
                <p className="text-sm text-slate-400">Inbound and outbound endpoint behavior</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Endpoint</p>
                    <p className="mt-1 text-sm text-slate-400">{data.webhookEndpoint}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Live</span>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Rate limit</p>
                    <p className="mt-1 text-sm text-slate-400">{data.rateLimitPerMinute} req/min</p>
                  </div>
                  <div className="rounded-full border border-cyan-400/20 bg-cyan-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    {data.retryCount} retries
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/12 p-2.5 text-emerald-200">
              <PlugZap size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Connected services</h2>
              <p className="text-sm text-slate-400">Runtime health across your ecosystem</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {data.connectedServices.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400 lg:col-span-2">
                No connected services yet.
              </p>
            ) : (
              data.connectedServices.map((service) => (
                <div key={service.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{service.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{service.description}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${service.status === "healthy" ? "bg-emerald-500/15 text-emerald-300" : service.status === "warning" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300"}`}>
                      {service.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                    <Activity size={14} /> Last sync {service.lastSync}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-2.5 text-cyan-200">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Security posture</h2>
              <p className="text-sm text-slate-400">Protection status across public and private channels</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { label: "TLS enforced", value: data.tlsEnforced ? "Yes" : "No" },
              { label: "IP allowlist", value: data.ipAllowlistEnabled ? "Enabled" : "Disabled" },
              { label: "Signature rotation", value: data.signatureRotation ? "Enabled" : "Disabled" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
