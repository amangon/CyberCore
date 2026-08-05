"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Compass, Palette, Sparkles, Store, UserRound, Wrench } from "lucide-react";
import settingsService from "@/services/settings.service";
import type { OrganizationSettings, WorkspaceSettings } from "@/types/settings";

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<OrganizationSettings | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [org, ws] = await Promise.all([settingsService.getOrganization(), settingsService.getWorkspace()]);
        if (isMounted) {
          setOrganization(org);
          setWorkspace(ws);
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

  const saveChanges = async () => {
    if (!organization || !workspace) {
      return;
    }

    await Promise.all([settingsService.updateOrganization(organization), settingsService.updateWorkspace(workspace)]);
  };

  if (loading || !organization || !workspace) {
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
                <Sparkles size={13} /> Organization
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Company profile, workspace, and branding controls</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Keep your enterprise identity and operating environment aligned with the security and collaboration needs of your team.</p>
            </div>
            <button onClick={saveChanges} className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Save changes
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-2.5 text-cyan-200">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Company profile</h2>
                <p className="text-sm text-slate-400">Core identity, support, and infrastructure metadata</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Company name</span>
                <input
                  value={organization.name}
                  onChange={(event) => setOrganization({ ...organization, name: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Slug</span>
                <input
                  value={organization.slug}
                  onChange={(event) => setOrganization({ ...organization, slug: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Industry</span>
                <input
                  value={organization.industry}
                  onChange={(event) => setOrganization({ ...organization, industry: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Region</span>
                <input
                  value={organization.region}
                  onChange={(event) => setOrganization({ ...organization, region: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Primary contact</span>
                <input
                  value={organization.primaryContact}
                  onChange={(event) => setOrganization({ ...organization, primaryContact: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Support email</span>
                <input
                  value={organization.supportEmail}
                  onChange={(event) => setOrganization({ ...organization, supportEmail: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/12 p-2.5 text-violet-200">
                <Store size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Workspace & branding</h2>
                <p className="text-sm text-slate-400">Tenant, runtime, and visual identity settings</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Workspace name</span>
                <input
                  value={workspace.name}
                  onChange={(event) => setWorkspace({ ...workspace, name: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Environment</span>
                <select
                  value={workspace.environment}
                  onChange={(event) => setWorkspace({ ...workspace, environment: event.target.value as WorkspaceSettings["environment"] })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Default region</span>
                <input
                  value={workspace.defaultRegion}
                  onChange={(event) => setWorkspace({ ...workspace, defaultRegion: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Retention days</span>
                  <input
                    type="number"
                    value={workspace.retentionDays}
                    onChange={(event) => setWorkspace({ ...workspace, retentionDays: Number(event.target.value) })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Tenant ID</span>
                  <input
                    value={workspace.tenantId}
                    onChange={(event) => setWorkspace({ ...workspace, tenantId: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Palette size={16} className="text-cyan-300" /> Brand settings
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    <span>Brand name</span>
                    <input
                      value={organization.branding.companyName}
                      onChange={(event) => setOrganization({ ...organization, branding: { ...organization.branding, companyName: event.target.value } })}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-300">
                    <span>Accent color</span>
                    <select
                      value={organization.branding.accentColor}
                      onChange={(event) => setOrganization({ ...organization, branding: { ...organization.branding, accentColor: event.target.value as OrganizationSettings["branding"]["accentColor"] } })}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="violet">Violet</option>
                      <option value="cyan">Cyan</option>
                      <option value="emerald">Emerald</option>
                      <option value="rose">Rose</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/12 p-2.5 text-emerald-200">
                <Compass size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Workspace governance</h2>
                <p className="text-sm text-slate-400">Operational controls and collaboration boundaries</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { label: "SIEM enabled", value: workspace.enableSIEM ? "Enabled" : "Disabled" },
                { label: "MFA enforcement", value: workspace.enableMFA ? "Enabled" : "Disabled" },
                { label: "Guest access", value: workspace.allowGuestAccess ? "Allowed" : "Restricted" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/12 p-2.5 text-amber-200">
                <Wrench size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Operational utilities</h2>
                <p className="text-sm text-slate-400">Supporting surfaces for integrated delivery</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <UserRound size={16} className="text-cyan-300" /> Primary contact
                </div>
                <p className="mt-2 text-sm text-slate-400">{organization.primaryContact}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 size={16} className="text-cyan-300" /> Plan tier
                </div>
                <p className="mt-2 text-sm text-slate-400">{organization.plan}</p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
