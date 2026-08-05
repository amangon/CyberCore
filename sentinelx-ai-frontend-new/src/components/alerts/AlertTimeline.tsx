import { useState } from "react";
import {
  ShieldAlert,
  Bell,
  UserCheck,
  Search,
  Lock,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Clock,
  User,
  type LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low" | "info";
type Status = "completed" | "active" | "pending";

interface TimelineEvent {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  detail: string;
  time: string;
  elapsed: string;
  severity: Severity;
  status: Status;
  user: string;
  userRole: string;
  tags: string[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    dot: string;
    badge: string;
    text: string;
    border: string;
    glow: string;
    ring: string;
  }
> = {
  critical: {
    label: "Critical",
    dot: "bg-rose-500",
    badge: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    text: "text-rose-400",
    border: "border-rose-500/40",
    glow: "shadow-rose-500/20",
    ring: "ring-rose-500/30",
  },
  high: {
    label: "High",
    dot: "bg-orange-500",
    badge: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    text: "text-orange-400",
    border: "border-orange-500/40",
    glow: "shadow-orange-500/20",
    ring: "ring-orange-500/30",
  },
  medium: {
    label: "Medium",
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    text: "text-yellow-400",
    border: "border-yellow-500/40",
    glow: "shadow-yellow-500/20",
    ring: "ring-yellow-500/30",
  },
  low: {
    label: "Low",
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    text: "text-blue-400",
    border: "border-blue-500/40",
    glow: "shadow-blue-500/20",
    ring: "ring-blue-500/30",
  },
  info: {
    label: "Info",
    dot: "bg-slate-400",
    badge: "bg-slate-500/10 border-slate-500/20 text-slate-400",
    text: "text-slate-400",
    border: "border-slate-500/40",
    glow: "shadow-slate-500/10",
    ring: "ring-slate-500/20",
  },
};

const STATUS_CONFIG: Record<
  Status,
  { label: string; badge: string; indicator: string }
> = {
  completed: {
    label: "Completed",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    indicator: "bg-emerald-500",
  },
  active: {
    label: "In Progress",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    indicator: "bg-blue-500 animate-pulse",
  },
  pending: {
    label: "Pending",
    badge: "bg-slate-500/10 border-slate-500/20 text-slate-500",
    indicator: "bg-slate-600",
  },
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "evt-001",
    icon: ShieldAlert,
    title: "Threat Detected",
    description:
      "Anomalous lateral movement detected across 3 endpoints in the EMEA segment. MITRE ATT&CK T1021 — Remote Services.",
    detail:
      "EDR sensor flagged suspicious SMB traffic originating from workstation WS-EMEA-0441. Process tree shows lsass.exe memory dump attempt followed by PsExec execution towards DC-EMEA-02 and DC-EMEA-03. Confidence score: 94%.",
    time: "2026-08-01T06:12:08Z",
    elapsed: "2h 25m ago",
    severity: "critical",
    status: "completed",
    user: "Sentinel Engine",
    userRole: "Automated Detection",
    tags: ["T1021", "Lateral Movement", "EDR"],
  },
  {
    id: "evt-002",
    icon: Bell,
    title: "Alert Generated",
    description:
      "High-fidelity alert raised in Microsoft Defender XDR. Correlated with 4 prior low-severity signals over 72 hours.",
    detail:
      "Alert ID: DEF-2026-084412. Correlation engine linked this event to prior telemetry: unusual login times (Aug 29), new scheduled task (Jul 30), DNS beaconing to 185.220.x.x (Jul 31), and shadow copy deletion attempt (Jul 31 23:58 UTC). Incident score: 87/100.",
    time: "2026-08-01T06:12:51Z",
    elapsed: "2h 24m ago",
    severity: "critical",
    status: "completed",
    user: "Defender XDR",
    userRole: "SIEM / XDR Platform",
    tags: ["Alert Correlation", "Incident Scoring"],
  },
  {
    id: "evt-003",
    icon: UserCheck,
    title: "Analyst Assigned",
    description:
      "Incident escalated to Tier-2 SOC. Senior analyst Maya Reyes auto-assigned based on EMEA rotation schedule.",
    detail:
      "Escalation policy EP-CRITICAL-01 triggered. On-call Tier-2 analyst paged via PagerDuty (incident PD-88821). SLA breach threshold: 15 min response. Assignment acknowledged in 4 minutes. Case opened in ServiceNow: INC0094871.",
    time: "2026-08-01T06:17:22Z",
    elapsed: "2h 20m ago",
    severity: "high",
    status: "completed",
    user: "Maya Reyes",
    userRole: "Sr. SOC Analyst · Tier 2",
    tags: ["SLA: Met", "ServiceNow", "PagerDuty"],
  },
  {
    id: "evt-004",
    icon: Search,
    title: "Investigation Started",
    description:
      "Forensic triage initiated. Memory acquisition and disk imaging underway on affected endpoints.",
    detail:
      "Live response session opened on WS-EMEA-0441 and DC-EMEA-02. Volatile memory captured (32 GB RAM, acquisition time 8m 14s). Prefetch, event logs, and registry hives extracted. Network packet capture started on SPAN port CORE-SW-03. IOCs extracted: 2 IPs, 1 domain, 3 file hashes (SHA-256).",
    time: "2026-08-01T06:31:04Z",
    elapsed: "2h 06m ago",
    severity: "high",
    status: "completed",
    user: "Maya Reyes",
    userRole: "Sr. SOC Analyst · Tier 2",
    tags: ["Forensics", "Live Response", "IOC Extraction"],
  },
  {
    id: "evt-005",
    icon: Lock,
    title: "Containment",
    description:
      "Affected endpoints isolated from network. Compromised service accounts disabled. Firewall rules deployed.",
    detail:
      "Network isolation applied to WS-EMEA-0441, WS-EMEA-0509, and WS-EMEA-0512 via Defender for Endpoint isolate API. svc_backup and svc_deploy accounts suspended in Active Directory. Emergency ACL pushed to perimeter firewall blocking 185.220.101.0/24 and 194.165.16.0/24. Change record CHG0041203 raised.",
    time: "2026-08-01T07:08:37Z",
    elapsed: "1h 29m ago",
    severity: "medium",
    status: "completed",
    user: "Jordan Kim",
    userRole: "IR Engineer · Tier 3",
    tags: ["Network Isolation", "Account Lockdown", "Firewall ACL"],
  },
  {
    id: "evt-006",
    icon: RefreshCw,
    title: "Recovery",
    description:
      "Clean images being restored. Credentials rotated. Threat actor persistence mechanisms removed.",
    detail:
      "Rebuilding WS-EMEA-0441 from golden image v2.4.1 (MDT deployment, ETA 22 min). Persistence mechanisms removed: malicious scheduled task 'WindowsTelemetrySync', registry run key HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SysHelper, and dropped binary C:\\ProgramData\\svchost32.exe (SHA-256: a3f9d…). All 14 privileged account passwords rotated. KRBTGT reset initiated (double reset per best practice).",
    time: "2026-08-01T08:15:19Z",
    elapsed: "22m ago",
    severity: "low",
    status: "active",
    user: "Jordan Kim",
    userRole: "IR Engineer · Tier 3",
    tags: ["Reimaging", "Credential Rotation", "Persistence Removal"],
  },
  {
    id: "evt-007",
    icon: CheckCircle2,
    title: "Resolved",
    description:
      "Incident closure pending final verification. Post-incident review scheduled for Aug 4, 2026.",
    detail:
      "Awaiting confirmation of clean endpoint health checks and 24h monitoring window. Draft PIR report assigned to Maya Reyes. Lessons learned session booked with SOC leadership. Regulatory notification assessment in progress (GDPR Art. 33 — 72h window: 47h 48m remaining). MITRE coverage gap analysis to be completed.",
    time: "2026-08-01T09:00:00Z",
    elapsed: "In 22m",
    severity: "info",
    status: "pending",
    user: "TBD",
    userRole: "Pending Assignment",
    tags: ["PIR Scheduled", "GDPR Assessment", "Monitoring"],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-500">
      {label}
    </span>
  );
}

function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAutomated = name === "Sentinel Engine" || name === "Defender XDR";
  const isTBD = name === "TBD";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
          ${isAutomated
            ? "bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/20"
            : isTBD
              ? "bg-slate-700/50 text-slate-600 ring-1 ring-slate-700"
              : "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20"
          }
        `}
        aria-hidden="true"
      >
        {isTBD ? <User className="h-3.5 w-3.5" /> : initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-300">{name}</p>
        <p className="truncate text-[10px] text-slate-600">{role}</p>
      </div>
    </div>
  );
}

interface EventCardProps {
  event: TimelineEvent;
  index: number;
  isLast: boolean;
}

function EventCard({ event, index, isLast }: EventCardProps) {
  const [expanded, setExpanded] = useState(event.status === "active");

  const sev = SEVERITY_CONFIG[event.severity];
  const sta = STATUS_CONFIG[event.status];
  const Icon = event.icon;

  const isActive = event.status === "active";
  const isPending = event.status === "pending";

  return (
    <li className="relative flex gap-4" aria-label={`${event.title}: ${sta.label}`}>
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className="absolute left-[19px] top-10 bottom-0 w-px -translate-x-1/2"
          aria-hidden="true"
        >
          <div
            className={`h-full w-full transition-colors duration-500 ${
              event.status === "completed"
                ? "bg-gradient-to-b from-slate-600 to-slate-700"
                : "bg-slate-800"
            }`}
            style={
              event.status === "completed"
                ? {
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, #475569 0px, #475569 6px, transparent 6px, transparent 12px)",
                  }
                : {
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, #1e293b 0px, #1e293b 6px, transparent 6px, transparent 12px)",
                  }
            }
          />
        </div>
      )}

      {/* Icon node */}
      <div className="relative shrink-0 pt-0.5" aria-hidden="true">
        {/* Step number */}
        <span className="absolute -top-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-slate-500 ring-1 ring-slate-700">
          {index + 1}
        </span>
        <div
          className={`
            flex h-10 w-10 items-center justify-center rounded-xl
            border transition-all duration-300
            ${
              isActive
                ? `${sev.border} bg-slate-800/80 shadow-lg ${sev.glow} ring-2 ${sev.ring}`
                : isPending
                  ? "border-slate-700/50 bg-slate-800/40"
                  : `border-white/[0.06] bg-slate-800/60`
            }
          `}
        >
          <Icon
            className={`h-4.5 w-4.5 transition-colors duration-300 ${
              isPending ? "text-slate-600" : sev.text
            }`}
            size={18}
            strokeWidth={1.75}
          />
        </div>
        {isActive && (
          <span
            className={`absolute inset-0 rounded-xl opacity-30 blur-md ${sev.dot}`}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Card */}
      <div
        className={`
          mb-4 flex-1 overflow-hidden rounded-2xl border
          transition-all duration-300
          ${
            isActive
              ? `border-white/10 bg-slate-800/60 shadow-xl ${sev.glow}`
              : isPending
                ? "border-white/[0.04] bg-slate-800/20"
                : "border-white/[0.06] bg-slate-800/40"
          }
        `}
      >
        {/* Gradient top accent */}
        {!isPending && (
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(to right, ${
                event.status === "active"
                  ? SEVERITY_CONFIG[event.severity].dot.replace("bg-", "")
                  : "transparent"
              }, transparent)`,
              backgroundImage:
                event.status === "completed"
                  ? `linear-gradient(to right, ${
                      ["rose", "orange", "yellow", "blue", "slate"].find((c) =>
                        SEVERITY_CONFIG[event.severity].dot.includes(c)
                      )
                        ? SEVERITY_CONFIG[event.severity].glow
                            .replace("shadow-", "")
                            .replace("/20", "")
                        : "#334155"
                    }40, transparent)`
                  : undefined,
            }}
            aria-hidden="true"
          />
        )}

        <div className="p-4">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-semibold transition-colors duration-300 ${
                  isPending ? "text-slate-600" : "text-white"
                }`}
              >
                {event.title}
              </h3>
              <p
                className={`mt-0.5 text-xs leading-relaxed ${
                  isPending ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {event.description}
              </p>
            </div>

            {/* Expand toggle */}
            {!isPending && (
              <button
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-controls={`detail-${event.id}`}
                className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 text-slate-500 transition-all duration-200 hover:bg-white/[0.07] hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
                <span className="sr-only">
                  {expanded ? "Collapse" : "Expand"} details
                </span>
              </button>
            )}
          </div>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Severity badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sev.badge}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${sev.dot} ${
                  isActive ? "animate-pulse" : ""
                }`}
                aria-hidden="true"
              />
              {sev.label}
            </span>

            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sta.badge}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${sta.indicator}`}
                aria-hidden="true"
              />
              {sta.label}
            </span>

            {/* Timestamp */}
            <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-600">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <time dateTime={event.time}>{event.elapsed}</time>
            </span>
          </div>

          {/* Expanded detail */}
          <div
            id={`detail-${event.id}`}
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
            aria-hidden={!expanded}
          >
            <div className="mt-3 border-t border-white/[0.05] pt-3 space-y-3">
              {/* Detail text */}
              <p className="text-xs leading-relaxed text-slate-500">
                {event.detail}
              </p>

              {/* Tags */}
              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5" aria-label="Event tags">
                  {event.tags.map((tag) => (
                    <Tag key={tag} label={tag} />
                  ))}
                </div>
              )}

              {/* Assigned user */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                <Avatar name={event.user} role={event.userRole} />
                <span className="text-[10px] text-slate-600">
                  {new Date(event.time).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "UTC",
                    hour12: false,
                  })}{" "}
                  UTC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────

function SummaryBar() {
  const completed = TIMELINE_EVENTS.filter((e) => e.status === "completed").length;
  const active = TIMELINE_EVENTS.filter((e) => e.status === "active").length;
  const pending = TIMELINE_EVENTS.filter((e) => e.status === "pending").length;
  const total = TIMELINE_EVENTS.length;
  const progressPct = Math.round((completed / total) * 100);

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
      aria-label="Incident progress summary"
    >
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-semibold text-slate-400">Incident Progress</p>
        <span className="text-xs font-bold tabular-nums text-white">
          {progressPct}%
        </span>
      </div>

      {/* Progress track */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Stage counts */}
      <div className="mt-2.5 flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          {completed} Completed
        </span>
        <span className="flex items-center gap-1.5 text-blue-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" aria-hidden="true" />
          {active} Active
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-700" aria-hidden="true" />
          {pending} Pending
        </span>
        <span className="ml-auto text-slate-600">
          {total} total stages
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AlertTimeline() {
  return (
    <section
      className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-slate-900/70 p-5 shadow-xl backdrop-blur-xl"
      aria-label="Cybersecurity incident timeline"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">
            Investigation Timeline
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Incident INC0094871 · DEF-2026-084412 ·{" "}
            <time dateTime="2026-08-01T06:12:08Z">Aug 1, 2026</time>
          </p>
        </div>

        {/* Live indicator */}
        <div
          className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1"
          role="status"
          aria-label="Live investigation in progress"
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold text-blue-400">Live</span>
        </div>
      </div>

      {/* Progress summary */}
      <SummaryBar />

      {/* Timeline */}
      <ol
        className="relative space-y-0 pl-0"
        aria-label="Incident event sequence"
      >
        {TIMELINE_EVENTS.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            index={index}
            isLast={index === TIMELINE_EVENTS.length - 1}
          />
        ))}
      </ol>

      {/* Footer */}
      <p className="text-center text-[10px] text-slate-600">
        Click any event card to expand forensic details · Times in UTC
      </p>
    </section>
  );
}