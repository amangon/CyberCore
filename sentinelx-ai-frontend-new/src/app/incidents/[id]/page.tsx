"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, ShieldAlert, User } from "lucide-react";

const incidentData: Record<string, { title: string; severity: string; status: string; description: string; asset: string; owner: string; time: string }> = {
  "inc-1042": {
    title: "Ransomware Encryption Attempt",
    severity: "Critical",
    status: "Investigating",
    description: "An automated encryption attempt was detected against finance-db-01. The attack was blocked before full encryption by the AI threat engine. Forensic evidence is being collected for root cause analysis.",
    asset: "finance-db-01",
    owner: "J. Okafor",
    time: "12 min ago",
  },
  "inc-1041": {
    title: "Credential Reuse Attack",
    severity: "High",
    status: "Contained",
    description: "Multiple login attempts using previously compromised credentials were observed on vpn-gateway-02. The source IPs have been blocked and sessions terminated.",
    asset: "vpn-gateway-02",
    owner: "M. Chen",
    time: "48 min ago",
  },
  "inc-1040": {
    title: "Unusual Lateral Movement",
    severity: "Medium",
    status: "Triaging",
    description: "Anomalous network connections were detected between app-cluster-05 endpoints. Security teams are investigating the source of the movement.",
    asset: "app-cluster-05",
    owner: "P. Nair",
    time: "2 hrs ago",
  },
  "inc-1039": {
    title: "Malicious PowerShell Execution",
    severity: "High",
    status: "Resolved",
    description: "A malicious PowerShell script was executed on workstation-118. The process was quarantined and the endpoint has been restored from a clean snapshot.",
    asset: "workstation-118",
    owner: "D. Silva",
    time: "5 hrs ago",
  },
};

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const incident = incidentData[params.id] ?? {
    title: "Unknown Incident",
    severity: "Low",
    status: "Unknown",
    description: "No additional details are available for this incident.",
    asset: "unknown",
    owner: "Unassigned",
    time: "—",
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.10),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(to_bottom,#020617,#020617)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/incidents"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_50px_rgba(239,68,68,0.08)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-500">{params.id.toUpperCase()}</span>
            <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300">
              {incident.severity}
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
              {incident.status}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {incident.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{incident.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                <ShieldAlert className="h-3.5 w-3.5" /> Affected Asset
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{incident.asset}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                <User className="h-3.5 w-3.5" /> Assigned To
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{incident.owner}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                <Clock className="h-3.5 w-3.5" /> Reported
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{incident.time}</div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

