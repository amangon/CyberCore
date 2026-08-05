"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, Building2, Globe, Clock3, User, Loader2, Lock, CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useIOCStore } from "@/store";

type WHOISField = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
};

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toUTCString().replace("GMT", "UTC");
}

function computeDomainAge(registrationDate: string): string {
  if (!registrationDate) return "—";
  const date = new Date(registrationDate);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
  if (years >= 1) return `${years} yr ${months} mo`;
  if (months >= 1) return `${months} mo`;
  return "Less than a month";
}

function formatNameservers(value: readonly string[] | undefined): string {
  if (!value || value.length === 0) return "—";
  return value.join(", ");
}

export default function WHOISInfo() {
  const { investigation, loading, analyzed } = useIOCStore();

  const whois = investigation?.whois;
  const whoisAvailable = whois && Object.keys(whois).length > 0;

  const fields = useMemo<WHOISField[]>(() => {
    if (!whoisAvailable) return [];
    return [
      { label: "Domain", value: whois.domain || investigation?.indicator || "—", icon: <Globe className="h-4 w-4 text-cyan-300" />, mono: true },
      { label: "Registrar", value: whois.registrar || "—", icon: <Building2 className="h-4 w-4 text-cyan-300" /> },
      { label: "Registrant", value: whois.registrant || "—", icon: <User className="h-4 w-4 text-cyan-300" /> },
      { label: "Organization", value: whois.organization || "—", icon: <Building2 className="h-4 w-4 text-cyan-300" /> },
      { label: "Country", value: whois.country || "—", icon: <Globe className="h-4 w-4 text-cyan-300" /> },
      { label: "Status", value: whois.status || "—", icon: <ShieldCheck className="h-4 w-4 text-cyan-300" /> },
      { label: "Registration Date", value: formatDate(whois.registrationDate ?? ""), icon: <CalendarDays className="h-4 w-4 text-cyan-300" /> },
      { label: "Expiry Date", value: formatDate(whois.expiryDate ?? ""), icon: <CalendarDays className="h-4 w-4 text-cyan-300" /> },
      { label: "Last Updated", value: formatDate(whois.updatedDate ?? ""), icon: <Clock3 className="h-4 w-4 text-cyan-300" /> },
      { label: "Domain Age", value: whois.domainAge || computeDomainAge(whois.registrationDate ?? ""), icon: <Clock3 className="h-4 w-4 text-cyan-300" /> },
      { label: "Privacy Protection", value: whois.privacyProtection || "—", icon: <Lock className="h-4 w-4 text-cyan-300" /> },
      { label: "Nameservers", value: formatNameservers(whois.nameservers), icon: <Globe className="h-4 w-4 text-cyan-300" />, mono: true },
    ];
  }, [whois, whoisAvailable, investigation]);

  const timeline = whoisAvailable && whois.timeline ? whois.timeline : [];

  const safeVerdict = investigation && investigation.verdict === "clean";

  return (
    <Card className="border-cyan-500/20 bg-slate-950/80 text-slate-100 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <CardHeader className="border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">WHOIS Intelligence</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Domain registration data and ownership history.
            </CardDescription>
          </div>
          <Badge
            className={
              analyzed && !loading && safeVerdict
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : analyzed && !loading
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-white/10 bg-white/5 text-slate-300"
            }
          >
            {analyzed && !loading ? (
              safeVerdict ? (
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
              )
            ) : (
              <Clock3 className="mr-1.5 h-3.5 w-3.5" />
            )}
            {analyzed && !loading ? (safeVerdict ? "Safe" : "Review") : "Awaiting Analysis"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </motion.div>
          ) : !analyzed ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center"
            >
              <Loader2 className="h-6 w-6 text-cyan-300" />
              <p className="text-sm text-slate-400">
                Run an IOC analysis to fetch WHOIS registration data.
              </p>
            </motion.div>
          ) : !whoisAvailable ? (
            <motion.div
              key="no-whois"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center"
            >
              <Globe className="mx-auto mb-3 h-8 w-8 text-slate-500" />
              <p className="text-sm font-medium text-white">No WHOIS data available</p>
              <p className="mt-2 text-sm text-slate-400">
                This indicator did not return registration details (common for IPs and hashes).
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="whois"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {fields.map((field, idx) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                      {field.icon}
                      <span className="text-[11px] uppercase tracking-[0.18em]">{field.label}</span>
                    </div>
                    <p
                      className={`break-words text-sm font-medium text-white ${field.mono ? "font-mono text-xs" : ""}`}
                    >
                      {field.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              {timeline.length > 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Registration Timeline
                  </h3>
                  <div className="space-y-3">
                    {timeline.map((entry, idx) => (
                      <motion.div
                        key={`${entry.label}-${idx}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="flex items-start gap-3"
                      >
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <div>
                          <div className="text-sm text-slate-200">{entry.label}</div>
                          <div className="mt-0.5 text-xs text-slate-400">{entry.value}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

