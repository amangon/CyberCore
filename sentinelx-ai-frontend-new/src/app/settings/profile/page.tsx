"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Clock3, Loader2, Mail, MapPin, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import settingsService from "@/services/settings.service";
import type { UserProfile } from "@/types/settings";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await settingsService.getProfile();
        if (isMounted) {
          setProfile(data);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    setUploading(true);
    try {
      const result = await settingsService.uploadAvatar(file);
      if (profile) {
        setProfile({ ...profile, avatarUrl: result.avatarUrl });
      }
      setAvatarPreview(null);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const updated = await settingsService.updateProfile(profile);
      setProfile(updated);
    } catch (err) {
      console.error("Profile save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
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
                <Sparkles size={13} /> Profile
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Personal identity and contact settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Keep your workspace identity consistent across the org, while preserving a premium and secure experience.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/12">
                Reset
              </button>
<button onClick={saveProfile} disabled={saving} className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[30px] border border-white/10 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl"
          >
            <div className="flex flex-col items-center">
<div className="relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 shadow-[0_18px_60px_rgba(34,211,238,0.2)]">
                  {(avatarPreview || profile.avatarUrl) ? (
                    <img src={avatarPreview || profile.avatarUrl || ''} alt={profile.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={42} className="text-cyan-200" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-cyan-200 shadow-lg transition hover:scale-105 disabled:opacity-50"
                >
                  <Camera size={16} />
                </button>
              </div>
              <h2 className="mt-5 text-xl font-semibold text-white">{profile.fullName}</h2>
              <p className="mt-1 text-sm text-slate-400">{profile.title}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300">
                <ShieldCheck size={13} /> Verified operator
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Mail size={16} className="text-cyan-300" />
                  {profile.email}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Phone size={16} className="text-cyan-300" />
                  {profile.phone}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Clock3 size={16} className="text-cyan-300" />
                  {profile.timezone}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <MapPin size={16} className="text-cyan-300" />
                  {profile.location}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] backdrop-blur-xl"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Full name</span>
                <input
                  value={profile.fullName}
                  onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Job title</span>
                <input
                  value={profile.title}
                  onChange={(event) => setProfile({ ...profile, title: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Email</span>
                <input
                  value={profile.email}
                  onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Phone</span>
                <input
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Department</span>
                <input
                  value={profile.department}
                  onChange={(event) => setProfile({ ...profile, department: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Location</span>
                <input
                  value={profile.location}
                  onChange={(event) => setProfile({ ...profile, location: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Timezone</span>
                <input
                  value={profile.timezone}
                  onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Language</span>
                <input
                  value={profile.locale}
                  onChange={(event) => setProfile({ ...profile, locale: event.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
                />
              </label>
            </div>

            <label className="mt-5 flex flex-col gap-2 text-sm text-slate-300">
              <span>Biography</span>
              <textarea
                value={profile.bio}
                onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                rows={5}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
              />
            </label>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
