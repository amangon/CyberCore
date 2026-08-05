"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search, Sparkles, Users, ShieldCheck, KeyRound, UserPlus } from "lucide-react";
import settingsService from "@/services/settings.service";
import type { PermissionEntry, RolePermission, TeamMember } from "@/types/settings";

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [permissions, setPermissions] = useState<PermissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [teamMembers, roleList, permissionList] = await Promise.all([
          settingsService.getTeamMembers(),
          settingsService.getRoles(),
          settingsService.getPermissions(),
        ]);

        if (isMounted) {
          setMembers(teamMembers);
          setRoles(roleList);
          setPermissions(permissionList);
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

  const filteredMembers = members.filter((member) => {
    const haystack = `${member.name} ${member.email} ${member.department} ${member.role}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  if (loading) {
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
                <Sparkles size={13} /> Team
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Invite, govern, and align team members with clear permissions</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Review role-based access, field member requests, and maintain policy clarity across operations and security operations.</p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/12">
                Export roster
              </button>
              <button className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                Invite member
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-[30px] border border-white/10 bg-slate-950/65 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none sm:w-72" placeholder="Search members" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <Filter size={14} />
              <span>Role + department filters ready</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <motion.div key={member.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{member.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{member.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/12 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-300">{member.role}</span>
                        <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[11px] text-slate-400">{member.department}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Users size={14} className="text-cyan-300" /> {member.lastActive}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck size={16} className="text-cyan-300" /> Roles
                </div>
                <div className="mt-4 space-y-3">
                  {roles.map((role) => (
                    <div key={role.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{role.name}</p>
                          <p className="mt-1 text-sm text-slate-400">{role.description}</p>
                        </div>
                        <div className="rounded-full border border-violet-400/20 bg-violet-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                          {role.id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <KeyRound size={16} className="text-cyan-300" /> Permissions
                </div>
                <div className="mt-4 space-y-3">
                  {permissions.map((permission) => (
                    <div key={permission.key} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-sm font-semibold text-white">{permission.label}</p>
                      <p className="mt-1 text-sm text-slate-400">{permission.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.24)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-2.5 text-cyan-200">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Team operations</h2>
              <p className="text-sm text-slate-400">Invite members, assign roles, and preserve least-privilege access.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { title: "Invite pending", value: "2" },
              { title: "Owner/admin coverage", value: "4" },
              { title: "Permission groups", value: `${permissions.length}` },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">{item.title}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
