"use client";

import { useEffect, useState } from "react";
import { Skull, Activity, Globe2, ShieldAlert, Crosshair, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import DataGrid, { type DataGridColumn, toneFromValue } from "@/components/ui/DataGrid";
import StatCard from "@/components/ui/StatCard";
import { getThreatErrorMessage, getThreats } from "@/services/threat.service";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Status = "Active Monitoring" | "Active" | "Monitoring";

type APTGroup = {
  id: string;
  name: string;
  origin: string;
  target: string;
  severity: Severity;
  status: Status;
  lastObserved: string;
  techniques: string[];
};

function toSeverityLabel(value: string): Severity {
  const v = value.toLowerCase();
  if (v === "critical") return "Critical";
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  return "Low";
}

function toStatusLabel(value: string): Status {
  const v = value.toLowerCase();
  if (v.includes("active") && v.includes("monitor")) return "Active Monitoring";
  if (v.includes("active")) return "Active";
  return "Monitoring";
}

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Unknown";
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return `${Math.floor(diffMs / 60000)} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

function toAPTGroup(raw: {
  id?: string;
  name?: string;
  origin?: string;
  targets?: readonly string[];
  severity?: string;
  status?: string;
  lastSeen?: string;
  techniques?: readonly string[];
}): APTGroup {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "Unknown Group",
    origin: raw.origin ?? "Unknown",
    target: raw.targets && raw.targets.length > 0 ? raw.targets[0] : "Unspecified targets",
    severity: toSeverityLabel(String(raw.severity ?? "medium")),
    status: toStatusLabel(String(raw.status ?? "Monitoring")),
    lastObserved: relativeTime(raw.lastSeen ?? ""),
    techniques:
      raw.techniques && raw.techniques.length > 0
        ? raw.techniques.slice(0, 3)
        : [],
  };
}

export default function APTGroups() {
  const [groups, setGroups] = useState<APTGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThreats({ limit: 50 });
const rows = (data.aptGroups ?? []).map((g) =>
        toAPTGroup({
          id: g.id,
          name: g.name,
          origin: g.origin,
          targets: g.targets,
          severity: g.severity,
          status: g.status,
          lastSeen: g.lastSeen,
          techniques: g.techniques,
        }),
      );
      setGroups(rows);
    } catch (err) {
      setError(getThreatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const countries = new Set(groups.map((g) => g.origin).filter(Boolean)).size;
  const critical = groups.filter((g) => g.severity === "Critical").length;
  const active = groups.filter((g) => g.status === "Active" || g.status === "Active Monitoring").length;

  const columns: DataGridColumn[] = [
    {
      key: "name",
      label: "Threat Actor",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-2 font-medium text-white">
          <Users className="h-3.5 w-3.5 text-cyan-300" />
          {String(row.name)}
        </span>
      ),
    },
    {
      key: "origin",
      label: "Country",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <Globe2 className="h-3.5 w-3.5 text-slate-400" />
          {String(row.origin)}
        </span>
      ),
    },
    { key: "target", label: "Target Industries", sortable: true, hideOnMobile: true },
    {
      key: "techniques",
      label: "MITRE ATT&CK",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(row.techniques) ? row.techniques : []).map((t, i) => (
            <span
              key={i}
              className="rounded border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[11px] text-violet-200"
            >
              {String(t)}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "activeCampaigns",
      label: "Active Campaigns",
      align: "right",
      hideOnMobile: true,
    },
    {
      key: "severity",
      label: "Risk Level",
      badge: (value) => toneFromValue(value),
    },
    {
      key: "lastObserved",
      label: "Last Activity",
      sortable: true,
      hideOnMobile: true,
    },
    {
      key: "status",
      label: "Status",
      badge: (value) => toneFromValue(value),
    },
  ];

const gridRows = groups.map((g) => ({
    id: g.id,
    name: g.name,
    origin: g.origin,
    target: g.target,
    techniques: g.techniques,
    activeCampaigns: "—",
    severity: g.severity,
    lastObserved: g.lastObserved,
    status: g.status,
  }));

  const handleView = (row: Record<string, unknown>) => {
    window.alert(`Threat actor: ${row.name}\nOrigin: ${row.origin}\nTarget sectors: ${row.target}`);
  };

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-950/70 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              APT Group Intelligence
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-slate-300">
              Track advanced threat actors and nation-state cyber campaigns.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-300 transition hover:bg-cyan-400/20 md:block"
            aria-label="Refresh APT groups"
          >
            <ShieldAlert className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tracked APT Groups"
            value={groups.length}
            icon={Skull}
            accent="border-rose-400/20 bg-rose-400/10 text-rose-300"
            loading={loading}
          />
          <StatCard
            label="Active Campaigns"
            value={active}
            icon={Activity}
            accent="border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            loading={loading}
          />
          <StatCard
            label="Countries"
            value={countries}
            icon={Globe2}
            accent="border-blue-400/20 bg-blue-400/10 text-blue-300"
            loading={loading}
          />
          <StatCard
            label="Critical Actors"
            value={critical}
            icon={Crosshair}
            accent="border-red-400/20 bg-red-400/10 text-red-300"
            loading={loading}
          />
        </div>

<DataGrid
          columns={columns}
          rows={gridRows}
          rowKey="id"
          exportTitle="APT Groups"
          loading={loading}
          error={error}
          emptyMessage="No APT groups reported right now."
          onRowAction={handleView}
          rowActionLabel="Profile"
          onRefresh={() => void load()}
        />
      </CardContent>
    </Card>
  );
}
