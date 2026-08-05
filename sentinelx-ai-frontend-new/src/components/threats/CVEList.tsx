"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Radar, Bug, ShieldCheck, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import DataGrid, { type DataGridColumn, toneFromValue } from "@/components/ui/DataGrid";
import StatCard from "@/components/ui/StatCard";
import { getThreatErrorMessage, getThreats } from "@/services/threat.service";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Status = "Unpatched" | "Patch Available" | "Monitoring";

type CVEItem = {
  id: string;
  name: string;
  severity: Severity;
  cvss: number;
  status: Status;
  affected: string;
  knownExploited: boolean;
};

function toSeverityLabel(value: string): Severity {
  const v = value.toLowerCase();
  if (v === "critical") return "Critical";
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  return "Low";
}

function toStatusLabel(value: string, cvss: number): Status {
  const v = value.toLowerCase();
  if (v === "unpatched" || v === "open" || v === "in-progress") return "Unpatched";
  if (v === "patched" || v === "mitigated" || v === "false-positive") return "Patch Available";
  if (cvss >= 7) return "Unpatched";
  return "Monitoring";
}

function toCVE(raw: {
  id?: string;
  description?: string;
  severity?: string;
  cvssScore?: number;
  affectedAssets?: number;
  status?: string;
  knownExploited?: boolean;
}): CVEItem {
  return {
    id: raw.id ?? "CVE-UNKNOWN",
    name: raw.description?.split("\n")[0]?.slice(0, 80) ?? "Security Vulnerability",
    severity: toSeverityLabel(String(raw.severity ?? "medium")),
    cvss: Number(raw.cvssScore) || 0,
    status: toStatusLabel(String(raw.status ?? ""), Number(raw.cvssScore) || 0),
affected: raw.affectedAssets != null ? `${raw.affectedAssets.toLocaleString()} assets` : "—",
    knownExploited: Boolean(raw.knownExploited),
  };
}

export default function CVEList() {
  const [cves, setCves] = useState<CVEItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThreats({ limit: 50 });
      const rows = (data.cves ?? []).map((c) =>
        toCVE({
          id: c.id,
          description: c.description,
          severity: c.severity,
          cvssScore: c.cvssScore,
affectedAssets: c.affectedAssets,
          status: "",
          knownExploited: c.knownExploited,
        }),
      );
      setCves(rows);
    } catch (err) {
      setError(getThreatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const critical = cves.filter((c) => c.severity === "Critical").length;
  const high = cves.filter((c) => c.severity === "High").length;
  const patched = cves.filter((c) => c.status === "Patch Available").length;
  const exploited = cves.filter((c) => c.knownExploited).length;

  const columns: DataGridColumn[] = [
    {
      key: "id",
      label: "CVE ID",
      sortable: true,
      render: (row) => (
        <span className="font-mono font-medium text-cyan-300">{String(row.id)}</span>
      ),
    },
    { key: "name", label: "Vulnerability", sortable: true },
    {
      key: "severity",
      label: "Severity",
      badge: (value) => toneFromValue(value),
    },
    {
      key: "cvss",
      label: "CVSS Score",
      align: "right",
      sortable: true,
      render: (row) => {
        const score = Number(row.cvss) || 0;
        const color = score >= 9 ? "text-rose-300" : score >= 7 ? "text-orange-300" : score >= 4 ? "text-amber-300" : "text-emerald-300";
        return (
          <span className={`inline-flex items-center gap-2 font-semibold ${color}`}>
            <span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
              <span
                className={`block h-full rounded-full ${
                  score >= 9 ? "bg-rose-400" : score >= 7 ? "bg-orange-400" : score >= 4 ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </span>
            {score.toFixed(1)}
          </span>
        );
      },
    },
    {
      key: "epss",
      label: "EPSS Score",
      align: "right",
      hideOnMobile: true,
    },
    {
      key: "affected",
      label: "Affected",
      hideOnMobile: true,
    },
    {
      key: "status",
      label: "Patch Status",
      badge: (value) => toneFromValue(value),
    },
    {
      key: "exploited",
      label: "Exploited",
      align: "center",
      render: (row) => (
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
            row.exploited === "Yes"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
              : "border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          {String(row.exploited)}
        </span>
      ),
    },
  ];

  const gridRows = cves.map((c) => ({
    id: c.id,
    name: c.name,
    severity: c.severity,
cvss: c.cvss,
    epss: "—",
    affected: c.affected,
    status: c.status,
    exploited: c.knownExploited ? "Yes" : "No",
  }));

  const handleView = (row: Record<string, unknown>) => {
    window.open(`https://nvd.nist.gov/vuln/detail/${row.id}`, "_blank");
  };

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-950/70 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              CVE Vulnerability Intelligence
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-slate-300">
              Track critical vulnerabilities and security risks with AI-powered analysis.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-300 transition hover:bg-cyan-400/20 md:block"
            aria-label="Refresh CVEs"
          >
            <ShieldAlert className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total CVEs"
            value={cves.length}
            icon={Bug}
            accent="border-blue-400/20 bg-blue-400/10 text-blue-300"
            loading={loading}
          />
          <StatCard
            label="Critical"
            value={critical}
            icon={ShieldAlert}
            accent="border-red-400/20 bg-red-400/10 text-red-300"
            loading={loading}
          />
          <StatCard
            label="High Risk"
            value={high}
            icon={Radar}
            accent="border-orange-400/20 bg-orange-400/10 text-orange-300"
            loading={loading}
          />
          <StatCard
            label="Patched"
            value={patched}
            icon={ShieldCheck}
            accent="border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            loading={loading}
          />
        </div>

        <DataGrid
          columns={columns}
          rows={gridRows}
          rowKey="id"
          exportTitle="CVEs"
          loading={loading}
          error={error}
          emptyMessage="No vulnerabilities reported right now."
          onRowAction={handleView}
          rowActionLabel="View"
          onRefresh={() => void load()}
          toolbar={
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300">
              <ExternalLink className="h-3.5 w-3.5" />
              {exploited} exploited
            </span>
          }
        />
      </CardContent>
    </Card>
  );
}
