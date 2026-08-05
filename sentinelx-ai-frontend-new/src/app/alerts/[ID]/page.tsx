"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low" | "info";
type AlertStatus = "open" | "investigating" | "resolved" | "suppressed";
type ThreatTactic =
  | "Initial Access"
  | "Execution"
  | "Persistence"
  | "Privilege Escalation"
  | "Defense Evasion"
  | "Credential Access"
  | "Discovery"
  | "Lateral Movement"
  | "Collection"
  | "Command and Control"
  | "Exfiltration"
  | "Impact";

interface MitreTechnique {
  id: string;
  name: string;
  tactic: ThreatTactic;
  url: string;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "detection" | "escalation" | "action" | "comment" | "system";
  actor: string;
  description: string;
}

interface IOC {
  id: string;
  type: "ip" | "domain" | "hash" | "url" | "email";
  value: string;
  confidence: "confirmed" | "likely" | "possible";
  firstSeen: string;
  lastSeen: string;
  tags: string[];
}

interface Evidence {
  id: string;
  type: "log" | "pcap" | "screenshot" | "file" | "memory";
  name: string;
  size: string;
  collectedAt: string;
  collectedBy: string;
  hash: string;
}

interface Comment {
  id: string;
  author: string;
  initials: string;
  avatarColor: string;
  content: string;
  timestamp: string;
  edited?: boolean;
}

interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  metadata?: string;
}

interface AlertDetail {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  source: string;
  sourceCategory: string;
  affectedAsset: string;
  assetType: string;
  assetOS: string;
  assetIP: string;
  assetLocation: string;
  assetOwner: string;
  assignedTo: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
  detectionRule: string;
  ruleId: string;
  riskScore: number;
  tactics: MitreTechnique[];
  timeline: TimelineEvent[];
  iocs: IOC[];
  evidence: Evidence[];
  comments: Comment[];
  activity: ActivityEntry[];
  aiSummary: string;
  recommendedActions: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ALERT: AlertDetail = {
  id: "ALT-0047",
  title: "Anomalous Data Exfiltration Volume Detected",
  description:
    "Darktrace AI identified an unusual spike in outbound data transfer originating from nas-storage-corp-01 to an external IP (185.220.101.47) associated with a known threat actor infrastructure. The volume of data transferred (38 GB over 22 minutes) significantly deviates from the established behavioral baseline for this asset.",
  severity: "critical",
  status: "investigating",
  source: "Darktrace AI",
  sourceCategory: "Network Detection & Response",
  affectedAsset: "nas-storage-corp-01",
  assetType: "Network-Attached Storage",
  assetOS: "FreeNAS 13.0-U6",
  assetIP: "10.0.14.88",
  assetLocation: "DC-East / Rack B-07",
  assetOwner: "Infrastructure Team",
  assignedTo: "James Okafor",
  assignedAt: "2026-08-01T08:15:00Z",
  createdAt: "2026-08-01T08:01:00Z",
  updatedAt: "2026-08-01T08:39:00Z",
  detectionRule: "Anomalous Outbound Data Volume — NDR Model v3.2",
  ruleId: "DR-NDR-2291",
  riskScore: 94,
  tactics: [
    {
      id: "T1048",
      name: "Exfiltration Over Alternative Protocol",
      tactic: "Exfiltration",
      url: "https://attack.mitre.org/techniques/T1048",
    },
    {
      id: "T1567",
      name: "Exfiltration Over Web Service",
      tactic: "Exfiltration",
      url: "https://attack.mitre.org/techniques/T1567",
    },
    {
      id: "T1078",
      name: "Valid Accounts",
      tactic: "Defense Evasion",
      url: "https://attack.mitre.org/techniques/T1078",
    },
    {
      id: "T1560",
      name: "Archive Collected Data",
      tactic: "Collection",
      url: "https://attack.mitre.org/techniques/T1560",
    },
    {
      id: "T1071",
      name: "Application Layer Protocol",
      tactic: "Command and Control",
      url: "https://attack.mitre.org/techniques/T1071",
    },
  ],
  timeline: [
    {
      id: "tl-1",
      timestamp: "2026-08-01T07:44:00Z",
      type: "detection",
      actor: "Darktrace AI",
      description:
        "Initial anomaly detected — outbound traffic to 185.220.101.47 begins, deviating 840% from baseline.",
    },
    {
      id: "tl-2",
      timestamp: "2026-08-01T08:01:00Z",
      type: "escalation",
      actor: "Darktrace AI",
      description:
        "Alert auto-escalated to Critical after sustained data transfer exceeded 10 GB threshold.",
    },
    {
      id: "tl-3",
      timestamp: "2026-08-01T08:04:00Z",
      type: "system",
      actor: "SOAR Platform",
      description:
        "Automated playbook triggered — network isolation task queued, threat intel lookup initiated.",
    },
    {
      id: "tl-4",
      timestamp: "2026-08-01T08:09:00Z",
      type: "action",
      actor: "SOAR Platform",
      description:
        "Threat intel enrichment completed — destination IP confirmed as Tor exit node, flagged by 14 threat feeds.",
    },
    {
      id: "tl-5",
      timestamp: "2026-08-01T08:15:00Z",
      type: "action",
      actor: "Maya Chen",
      description: "Alert assigned to James Okafor for investigation.",
    },
    {
      id: "tl-6",
      timestamp: "2026-08-01T08:22:00Z",
      type: "action",
      actor: "James Okafor",
      description:
        "Status changed to Investigating. Began reviewing NAS access logs and firewall telemetry.",
    },
    {
      id: "tl-7",
      timestamp: "2026-08-01T08:30:00Z",
      type: "comment",
      actor: "James Okafor",
      description:
        "Access logs show service account svc-backup-agent authenticated 3 minutes before exfiltration began. Credentials may be compromised.",
    },
    {
      id: "tl-8",
      timestamp: "2026-08-01T08:39:00Z",
      type: "action",
      actor: "James Okafor",
      description:
        "svc-backup-agent credentials revoked. Password reset and MFA re-enrollment forced.",
    },
  ],
  iocs: [
    {
      id: "ioc-1",
      type: "ip",
      value: "185.220.101.47",
      confidence: "confirmed",
      firstSeen: "2026-07-18T00:00:00Z",
      lastSeen: "2026-08-01T08:06:00Z",
      tags: ["Tor Exit Node", "APT-C2", "Data Theft"],
    },
    {
      id: "ioc-2",
      type: "ip",
      value: "185.220.101.52",
      confidence: "likely",
      firstSeen: "2026-07-18T00:00:00Z",
      lastSeen: "2026-08-01T07:58:00Z",
      tags: ["Tor Exit Node", "Related Infrastructure"],
    },
    {
      id: "ioc-3",
      type: "domain",
      value: "d4t4-exf1l.onion.ws",
      confidence: "confirmed",
      firstSeen: "2026-07-20T00:00:00Z",
      lastSeen: "2026-08-01T08:05:00Z",
      tags: ["Onion Proxy", "C2 Domain"],
    },
    {
      id: "ioc-4",
      type: "hash",
      value: "a3f5c2d1e9b4087654321fedcba09876",
      confidence: "possible",
      firstSeen: "2026-08-01T08:02:00Z",
      lastSeen: "2026-08-01T08:02:00Z",
      tags: ["Suspicious Binary", "Unverified"],
    },
    {
      id: "ioc-5",
      type: "email",
      value: "svc-backup-agent@acme.io",
      confidence: "likely",
      firstSeen: "2026-08-01T07:41:00Z",
      lastSeen: "2026-08-01T08:39:00Z",
      tags: ["Compromised Account", "Service Account"],
    },
  ],
  evidence: [
    {
      id: "ev-1",
      type: "log",
      name: "nas-storage-corp-01_access.log",
      size: "14.2 MB",
      collectedAt: "2026-08-01T08:07:00Z",
      collectedBy: "SOAR Platform",
      hash: "sha256:3d9f2a1c...b4e07f91",
    },
    {
      id: "ev-2",
      type: "pcap",
      name: "exfil_session_capture_0801.pcap",
      size: "2.1 GB",
      collectedAt: "2026-08-01T08:08:00Z",
      collectedBy: "SOAR Platform",
      hash: "sha256:7e4b1c9d...a2f30e88",
    },
    {
      id: "ev-3",
      type: "log",
      name: "fw-core-datacenter_netflow.log",
      size: "8.7 MB",
      collectedAt: "2026-08-01T08:07:00Z",
      collectedBy: "SOAR Platform",
      hash: "sha256:1a2b3c4d...e5f60789",
    },
    {
      id: "ev-4",
      type: "file",
      name: "svc-backup-agent_auth_events.json",
      size: "42 KB",
      collectedAt: "2026-08-01T08:25:00Z",
      collectedBy: "James Okafor",
      hash: "sha256:9f8e7d6c...5b4a3210",
    },
  ],
  comments: [
    {
      id: "cm-1",
      author: "Maya Chen",
      initials: "MC",
      avatarColor: "bg-violet-600",
      content:
        "Assigning to James — this matches the pattern from the Q2 incident. Check if svc-backup-agent was accessed from any non-standard location prior to the event.",
      timestamp: "2026-08-01T08:15:00Z",
    },
    {
      id: "cm-2",
      author: "James Okafor",
      initials: "JO",
      avatarColor: "bg-sky-600",
      content:
        "Confirmed — auth logs show svc-backup-agent logged in from 103.21.244.0 (Cloudflare IP) at 07:41 UTC. This IP has never been used by this account before. Credentials are compromised. Revoking now.",
      timestamp: "2026-08-01T08:30:00Z",
    },
    {
      id: "cm-3",
      author: "Priya Nair",
      initials: "PN",
      avatarColor: "bg-emerald-600",
      content:
        "Cross-referencing with Threat Intel — 185.220.101.47 is part of a known APT-29 C2 cluster documented in a July advisory. Recommend escalating to incident response.",
      timestamp: "2026-08-01T08:37:00Z",
      edited: true,
    },
  ],
  activity: [
    {
      id: "act-1",
      actor: "Darktrace AI",
      action: "Alert created",
      timestamp: "2026-08-01T08:01:00Z",
    },
    {
      id: "act-2",
      actor: "SOAR Platform",
      action: "Playbook executed: NDR-Critical-Response",
      timestamp: "2026-08-01T08:04:00Z",
      metadata: "Playbook ID: PB-0082",
    },
    {
      id: "act-3",
      actor: "Maya Chen",
      action: "Assigned to James Okafor",
      timestamp: "2026-08-01T08:15:00Z",
    },
    {
      id: "act-4",
      actor: "James Okafor",
      action: "Status changed: Open → Investigating",
      timestamp: "2026-08-01T08:22:00Z",
    },
    {
      id: "act-5",
      actor: "James Okafor",
      action: "Credential revoked: svc-backup-agent",
      timestamp: "2026-08-01T08:39:00Z",
      metadata: "Identity provider: Okta",
    },
  ],
  aiSummary:
    "This alert indicates a high-confidence data exfiltration event originating from the corporate NAS server. The attack pattern suggests a compromised service account (svc-backup-agent) was leveraged to authenticate and initiate large-scale data transfer to a Tor exit node tied to known APT-29 infrastructure. The 22-minute transfer window and 38 GB volume suggest automated tooling. The attacker likely used the service account to bypass DLP controls. Immediate containment of the affected asset and full audit of svc-backup-agent activity across all systems is strongly recommended. This may be part of a broader campaign — correlation with recent phishing incidents is advised.",
  recommendedActions: [
    "Isolate nas-storage-corp-01 from the network immediately to prevent further data transfer.",
    "Revoke and rotate all credentials associated with svc-backup-agent across all integrated systems.",
    "Audit all files accessed and transferred during the 07:41–08:06 UTC window for data classification.",
    "Engage Incident Response team — escalate to P1 incident given APT-29 attribution indicators.",
    "Submit pcap and binary hash to threat intel for deeper analysis and sharing with ISAC.",
    "Review firewall egress rules — block known Tor exit node ranges at perimeter.",
    "Initiate forensic image of nas-storage-corp-01 before any remediation steps.",
    "Notify Legal and Compliance teams of potential data breach per regulatory requirements.",
  ],
};

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; classes: string; dot: string; glow: string; bar: string }
> = {
  critical: {
    label: "Critical",
    classes: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
    dot: "bg-red-400",
    glow: "shadow-red-500/20",
    bar: "bg-red-500",
  },
  high: {
    label: "High",
    classes: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30",
    dot: "bg-orange-400",
    glow: "shadow-orange-500/20",
    bar: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    classes: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
    dot: "bg-yellow-400",
    glow: "shadow-yellow-500/20",
    bar: "bg-yellow-500",
  },
  low: {
    label: "Low",
    classes: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
    dot: "bg-blue-400",
    glow: "shadow-blue-500/20",
    bar: "bg-blue-500",
  },
  info: {
    label: "Info",
    classes: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30",
    dot: "bg-slate-400",
    glow: "shadow-slate-500/20",
    bar: "bg-slate-500",
  },
};

const STATUS_CONFIG: Record<
  AlertStatus,
  { label: string; classes: string }
> = {
  open: {
    label: "Open",
    classes: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
  },
  investigating: {
    label: "Investigating",
    classes: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  },
  resolved: {
    label: "Resolved",
    classes: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  },
  suppressed: {
    label: "Suppressed",
    classes: "bg-slate-500/10 text-slate-500 ring-1 ring-slate-600/20",
  },
};

const IOC_TYPE_CONFIG: Record<
  IOC["type"],
  { label: string; classes: string }
> = {
  ip: {
    label: "IP",
    classes: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
  },
  domain: {
    label: "Domain",
    classes: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
  },
  hash: {
    label: "Hash",
    classes: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
  },
  url: {
    label: "URL",
    classes: "bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20",
  },
  email: {
    label: "Email",
    classes: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20",
  },
};

const CONFIDENCE_CONFIG: Record<
  IOC["confidence"],
  { label: string; classes: string }
> = {
  confirmed: {
    label: "Confirmed",
    classes: "text-red-400",
  },
  likely: {
    label: "Likely",
    classes: "text-orange-400",
  },
  possible: {
    label: "Possible",
    classes: "text-yellow-400",
  },
};

const TIMELINE_TYPE_CONFIG: Record<
  TimelineEvent["type"],
  { icon: React.ReactNode; color: string; ringColor: string }
> = {
  detection: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    color: "bg-red-500",
    ringColor: "ring-red-500/30",
  },
  escalation: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "bg-orange-500",
    ringColor: "ring-orange-500/30",
  },
  action: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "bg-sky-500",
    ringColor: "ring-sky-500/30",
  },
  comment: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "bg-violet-500",
    ringColor: "ring-violet-500/30",
  },
  system: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "bg-slate-500",
    ringColor: "ring-slate-500/30",
  },
};

const EVIDENCE_TYPE_CONFIG: Record<
  Evidence["type"],
  { icon: React.ReactNode; classes: string }
> = {
  log: {
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    classes: "text-sky-400 bg-sky-500/10",
  },
  pcap: {
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    classes: "text-violet-400 bg-violet-500/10",
  },
  screenshot: {
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    classes: "text-pink-400 bg-pink-500/10",
  },
  file: {
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    classes: "text-orange-400 bg-orange-500/10",
  },
  memory: {
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    classes: "text-emerald-400 bg-emerald-500/10",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
}

function formatShortTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-slate-500">{icon}</span>
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-36 shrink-0 text-xs text-slate-500">{label}</span>
      <span className="flex-1 text-xs text-slate-300">{value}</span>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={copy}
      aria-label="Copy to clipboard"
      className="ml-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
    >
      {copied ? (
        <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const c = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${c.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${c.classes}`}>
      {c.label}
    </span>
  );
}

function RiskGauge({ score }: { score: number }) {
  const r = 36;
  const circ = Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#ef4444" : score >= 45 ? "#f59e0b" : "#10b981";
  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="52" viewBox="0 0 88 52">
        <path d="M6 46 A 38 38 0 0 1 82 46" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M6 46 A 38 38 0 0 1 82 46"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="44" y="40" textAnchor="middle" className="fill-white text-lg font-bold" style={{ fontSize: "18px", fontWeight: 700 }}>
          {score}
        </text>
      </svg>
      <span className="-mt-1 text-[11px] font-medium text-slate-500">Risk Score</span>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabKey = "timeline" | "iocs" | "evidence" | "comments" | "activity";

function getTabs(alert: AlertDetail): { key: TabKey; label: string; count: number }[] {
  return [
    { key: "timeline", label: "Timeline", count: alert.timeline.length },
    { key: "iocs", label: "IOCs", count: alert.iocs.length },
    { key: "evidence", label: "Evidence", count: alert.evidence.length },
    { key: "comments", label: "Comments", count: alert.comments.length },
    { key: "activity", label: "Activity Log", count: alert.activity.length },
  ];
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function TimelinePanel({ alertData }: { alertData: AlertDetail }) {
  return (
    <div className="space-y-0">
      {alertData.timeline.map((ev, i) => {
        const cfg = TIMELINE_TYPE_CONFIG[ev.type];
        return (
          <div key={ev.id} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ring-4 ring-slate-900 ${cfg.color}`}>
                {cfg.icon}
              </div>
{i < alertData.timeline.length - 1 && (
                <div className="w-px flex-1 min-h-[2rem] bg-slate-700/60" />
              )}
            </div>
            <div className="pb-6 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">{ev.actor}</span>
                <span className="text-[11px] text-slate-600">·</span>
                <span className="text-[11px] font-mono text-slate-500">{formatShortTs(ev.timestamp)}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{ev.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IOCsPanel({ alertData }: { alertData: AlertDetail }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-700/60 text-left text-slate-500">
            <th className="pb-2.5 pr-4 font-medium">Type</th>
            <th className="pb-2.5 pr-4 font-medium">Value</th>
            <th className="pb-2.5 pr-4 font-medium">Confidence</th>
            <th className="pb-2.5 pr-4 font-medium">Tags</th>
            <th className="pb-2.5 font-medium">Last Seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {alertData.iocs.map((ioc) => (
            <tr key={ioc.id} className="group">
              <td className="py-2.5 pr-4">
                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${IOC_TYPE_CONFIG[ioc.type].classes}`}>
                  {IOC_TYPE_CONFIG[ioc.type].label}
                </span>
              </td>
              <td className="py-2.5 pr-4">
                <div className="flex items-center font-mono text-slate-300">
                  {ioc.value}
                  <CopyButton value={ioc.value} />
                </div>
              </td>
              <td className={`py-2.5 pr-4 font-medium ${CONFIDENCE_CONFIG[ioc.confidence].classes}`}>
                {CONFIDENCE_CONFIG[ioc.confidence].label}
              </td>
              <td className="py-2.5 pr-4">
                <div className="flex flex-wrap gap-1">
                  {ioc.tags.map((t) => (
                    <span key={t} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-2.5 text-slate-500 font-mono whitespace-nowrap">{formatShortTs(ioc.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EvidencePanel({ alertData }: { alertData: AlertDetail }) {
  return (
    <div className="space-y-2.5">
      {alertData.evidence.map((ev) => {
        const cfg = EVIDENCE_TYPE_CONFIG[ev.type];
        return (
          <div
            key={ev.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 transition-colors hover:border-slate-700"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.classes}`}>
                {cfg.icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-slate-200">{ev.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{ev.size}</span>
                  <span>·</span>
                  <span>{ev.collectedBy}</span>
                  <span>·</span>
                  <span className="font-mono">{formatShortTs(ev.collectedAt)}</span>
                </div>
              </div>
            </div>
            <button className="shrink-0 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white">
              Download
            </button>
          </div>
        );
      })}
    </div>
  );
}

function CommentsPanel({ alertData }: { alertData: AlertDetail }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-5">
      {alertData.comments.map((c) => (
        <div key={c.id} className="flex gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${c.avatarColor}`}>
            {c.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-slate-200">{c.author}</span>
              <span className="text-[11px] text-slate-500">{formatShortTs(c.timestamp)}</span>
              {c.edited && <span className="text-[11px] text-slate-600 italic">edited</span>}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{c.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-3 pt-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-white">
          YO
        </div>
        <div className="flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
          <div className="mt-1.5 flex justify-end">
            <button
              disabled={!draft.trim()}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityPanel({ alertData }: { alertData: AlertDetail }) {
  return (
    <div className="space-y-3.5">
      {alertData.activity.map((a) => (
        <div key={a.id} className="flex items-start gap-3">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-300">
              <span className="font-semibold text-slate-200">{a.actor}</span>{" "}
              <span className="text-slate-400">{a.action}</span>
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-mono">{formatTs(a.timestamp)}</span>
              {a.metadata && (
                <>
                  <span>·</span>
                  <span>{a.metadata}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");
  const [status, setStatus] = useState<AlertStatus>("open");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [alertData, setAlertData] = useState<AlertDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Fetch alert from backend
  useEffect(() => {
    let mounted = true;
    const fetchAlert = async () => {
      setFetching(true);
      setFetchError(null);
      try {
        // Import and use the alerts service
        const { getAlertById } = await import("@/services/alerts.service");
        const alert = await getAlertById(params.id);
        if (!mounted) return;
        if (!alert) {
          setFetchError("Alert not found");
          setAlertData(null);
          return;
        }
        // Map backend Alert to AlertDetail
        const detail: AlertDetail = {
          id: alert.id,
          title: alert.title,
          description: alert.description || "No description available.",
          severity: alert.severity,
          status: alert.status as AlertStatus,
          source: alert.source || "Unknown",
          sourceCategory: alert.sourceCategory || "General",
          affectedAsset: alert.affectedAsset || "Unknown",
          assetType: "Unknown",
          assetOS: "Unknown",
          assetIP: alert.assetIP || "Unknown",
          assetLocation: "Unknown",
          assetOwner: "Unknown",
          assignedTo: alert.assignedTo || "Unassigned",
          assignedAt: alert.createdAt,
          createdAt: alert.createdAt,
          updatedAt: alert.updatedAt || alert.createdAt,
          detectionRule: "AI Detection Engine",
          ruleId: "DR-AI-" + alert.id.slice(-4),
          riskScore: alert.riskScore ?? 0,
          tactics: Array.isArray(alert.tactics) ? alert.tactics.map(t => ({
            id: t.id,
            name: t.name,
            tactic: t.tactic as ThreatTactic,
            url: t.url || "#"
          })) : [],
          timeline: Array.isArray(alert.timeline) ? alert.timeline.map(t => ({
            id: t.id,
            timestamp: t.timestamp,
            type: t.type as TimelineEvent["type"],
            actor: t.actor,
            description: t.description
          })) : [],
          iocs: Array.isArray(alert.iocs) ? alert.iocs.map(ioc => ({
            id: ioc.id,
            type: ioc.type as IOC["type"],
            value: ioc.value,
            confidence: ioc.confidence as IOC["confidence"],
            firstSeen: ioc.firstSeen || alert.createdAt,
            lastSeen: ioc.lastSeen || alert.createdAt,
            tags: Array.isArray(ioc.tags) ? [...ioc.tags] : []
          })) : [],
          evidence: Array.isArray(alert.evidence) ? alert.evidence.map(ev => ({
            id: ev.id,
            type: ev.type as Evidence["type"],
            name: ev.name,
            size: ev.size || "Unknown",
            collectedAt: ev.collectedAt || alert.createdAt,
            collectedBy: ev.collectedBy || "System",
            hash: ev.hash || "N/A"
          })) : [],
          comments: Array.isArray(alert.comments) ? alert.comments.map(c => ({
            id: c.id,
            author: c.author,
initials: c.author.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??",
            avatarColor: "bg-slate-600",
            content: c.content,
            timestamp: c.timestamp,
            edited: c.edited
          })) : [],
          activity: Array.isArray(alert.activity) ? alert.activity.map(a => ({
            id: a.id,
            actor: a.actor,
            action: a.action,
            timestamp: a.timestamp,
            metadata: a.metadata
          })) : [],
          aiSummary: alert.aiSummary || "No AI summary available.",
          recommendedActions: Array.isArray(alert.recommendedActions) ? [...alert.recommendedActions] : []
        };
        setAlertData(detail);
        setStatus(detail.status);
      } catch (err) {
        if (mounted) {
          setFetchError(err instanceof Error ? err.message : "Failed to load alert");
        }
      } finally {
        if (mounted) setFetching(false);
      }
    };
    fetchAlert();
    return () => { mounted = false; };
  }, [params.id]);

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading alert details...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !alertData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <svg className="h-12 w-12 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
          </svg>
          <h2 className="text-xl font-semibold">Alert Not Found</h2>
          <p className="text-sm text-slate-400">{fetchError || "The alert you are looking for does not exist or has been removed."}</p>
          <Link href="/alerts" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">
            Back to Alerts
          </Link>
        </div>
      </div>
    );
  }

const ALERT = alertData;
  const TABS = getTabs(ALERT);
  const sevConfig = SEVERITY_CONFIG[ALERT.severity];

const tabPanels: Record<TabKey, React.ReactNode> = {
    timeline: <TimelinePanel alertData={ALERT} />,
    iocs: <IOCsPanel alertData={ALERT} />,
    evidence: <EvidencePanel alertData={ALERT} />,
    comments: <CommentsPanel alertData={ALERT} />,
    activity: <ActivityPanel alertData={ALERT} />,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23334155%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-100 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/alerts" className="hover:text-slate-300 cursor-pointer transition-colors">
            Alerts
          </Link>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-slate-400 font-mono">{ALERT.id}</span>
        </div>

        {/* Header */}
        <div className={`mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl ${sevConfig.glow}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-500">{ALERT.id}</span>
                <SeverityBadge severity={ALERT.severity} />
                <StatusBadge status={status} />
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 text-[11px] text-slate-400">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {ALERT.source}
                </span>
              </div>
              <h1 className="text-xl font-bold leading-snug text-white sm:text-2xl">{ALERT.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{ALERT.description}</p>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <RiskGauge score={ALERT.riskScore} />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowStatusMenu((s) => !s)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
                >
                  Update Status
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
                    {(Object.keys(STATUS_CONFIG) as AlertStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setStatus(s);
                          setShowStatusMenu(false);
                        }}
                        className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-700/80 ${
                          status === s ? "text-white font-semibold" : "text-slate-300"
                        }`}
                      >
                        {STATUS_CONFIG[s].label}
                        {status === s && (
                          <svg className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left / Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* AI Summary */}
            <SectionCard
              title="AI-Generated Summary"
              icon={
                <svg className="h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.5L12 3z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              <p className="text-xs leading-relaxed text-slate-400">{ALERT.aiSummary}</p>
            </SectionCard>

            {/* MITRE Tactics */}
            <SectionCard
              title="MITRE ATT&CK Techniques"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v2m0 14v2m9-9h-2M5 12H3" strokeLinecap="round" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {ALERT.tactics.map((t) => (
                  <a
                    key={t.id}
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 transition-colors hover:border-slate-700 hover:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-cyan-400">{t.id}</span>
                        <span className="truncate text-[10px] text-slate-500">{t.tactic}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-300">{t.name}</div>
                    </div>
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600 transition-colors group-hover:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M7 17L17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ))}
              </div>
            </SectionCard>

            {/* Tabs */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
              <div className="flex overflow-x-auto border-b border-slate-700/60 px-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex shrink-0 items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors ${
                      activeTab === tab.key ? "text-white" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.key ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-500"}`}>
                      {tab.count}
                    </span>
                    {activeTab === tab.key && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-5">{tabPanels[activeTab]}</div>
            </div>
          </div>

          {/* Right / Sidebar column */}
          <div className="space-y-6">
            {/* Asset Info */}
            <SectionCard
              title="Affected Asset"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="12" rx="2" />
                  <path d="M7 20h10M9 16v4m6-4v4" strokeLinecap="round" />
                </svg>
              }
            >
              <div className="space-y-3">
                <MetaRow label="Hostname" value={<span className="font-mono">{ALERT.affectedAsset}</span>} />
                <MetaRow label="Type" value={ALERT.assetType} />
                <MetaRow label="OS" value={ALERT.assetOS} />
                <MetaRow label="IP Address" value={<span className="font-mono">{ALERT.assetIP}</span>} />
                <MetaRow label="Location" value={ALERT.assetLocation} />
                <MetaRow label="Owner" value={ALERT.assetOwner} />
              </div>
            </SectionCard>

            {/* Detection Info */}
            <SectionCard
              title="Detection Details"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              }
            >
              <div className="space-y-3">
                <MetaRow label="Rule" value={ALERT.detectionRule} />
                <MetaRow label="Rule ID" value={<span className="font-mono">{ALERT.ruleId}</span>} />
                <MetaRow label="Source" value={ALERT.source} />
                <MetaRow label="Category" value={ALERT.sourceCategory} />
                <MetaRow label="Created" value={<span title={formatTs(ALERT.createdAt)}>{formatRelative(ALERT.createdAt)}</span>} />
                <MetaRow label="Last Updated" value={<span title={formatTs(ALERT.updatedAt)}>{formatRelative(ALERT.updatedAt)}</span>} />
              </div>
            </SectionCard>

            {/* Assignment */}
            <SectionCard
              title="Assignment"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                </svg>
              }
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
                  JO
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-200">{ALERT.assignedTo}</div>
                  <div className="text-[11px] text-slate-500">Assigned {formatRelative(ALERT.assignedAt)}</div>
                </div>
              </div>
            </SectionCard>

            {/* Recommended Actions */}
            <SectionCard
              title="Recommended Actions"
              icon={
                <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              <ol className="space-y-2.5">
                {ALERT.recommendedActions.map((action, i) => (
                  <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-slate-400">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-slate-400">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}