"use client";

import { useMemo, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock3,
  Globe2,
  Copy,
  Check,
  Layers,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import DataGrid, { type DataGridColumn, toneFromValue } from "@/components/ui/DataGrid";
import StatCard from "@/components/ui/StatCard";
import { useIOCStore } from "@/store";

type DNSRecord = {
  type: string;
  value: string;
  status: string;
  lastUpdated: string;
  details: string;
};

const toStatus = (type: string): string => {
  const t = type.toUpperCase();
  if (t === "A" || t === "AAAA") return "Resolved";
  if (t === "MX") return "Valid";
  if (t === "NS") return "Authoritative";
  if (t === "TXT") return "Verified";
  return "Resolved";
};

const toDetails = (type: string): string => {
  const t = type.toUpperCase();
  if (t === "A") return "IPv4 address record.";
  if (t === "AAAA") return "IPv6 address record.";
  if (t === "MX") return "Mail exchange record.";
  if (t === "NS") return "Nameserver record.";
  if (t === "TXT") return "Text / verification record.";
  if (t === "CNAME") return "Canonical name record.";
  if (t === "SOA") return "Start of authority record.";
  if (t === "PTR") return "Reverse pointer record.";
  return "DNS resource record.";
};

const formatLastUpdated = (value: string): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
};

const dnsTypeTone = (type: string): "info" | "success" | "warning" | "medium" => {
  const t = type.toUpperCase();
  if (t === "A" || t === "AAAA") return "success";
  if (t === "MX" || t === "NS" || t === "SOA") return "info";
  if (t === "TXT") return "warning";
  return "medium";
};

export default function DNSRecords() {
  const { investigation, loading, analyzed } = useIOCStore();
  const [copied, setCopied] = useState<string | null>(null);

  const records = useMemo<DNSRecord[]>(() => {
    if (!investigation || investigation.dns.length === 0) return [];
    return investigation.dns.map((r) => ({
      type: String(r.type || "A").toUpperCase(),
      value: r.value,
      status: r.status || toStatus(String(r.type || "A")),
      lastUpdated: formatLastUpdated(r.lastUpdated ?? ""),
      details: toDetails(String(r.type || "A")),
    }));
  }, [investigation]);

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  const verdict = investigation?.verdict ?? null;
  const dnsReputation =
    verdict === "clean" ? "Safe" : verdict === "suspicious" ? "Suspicious" : verdict === "malicious" ? "Malicious" : "—";
  const suspiciousCount = verdict !== "clean" && verdict !== null ? records.length : 0;
  const safeCount = verdict === "clean" ? records.length : 0;
  const uniqueTypes = new Set(records.map((r) => r.type)).size;

  const columns: DataGridColumn[] = [
    {
      key: "type",
      label: "Record Type",
      sortable: true,
      render: (row) => (
        <Badge className={`border ${dnsTypeTone(String(row.type))}`}>
          <Globe2 className="mr-1 h-3 w-3" />
          {String(row.type)}
        </Badge>
      ),
    },
    { key: "value", label: "Value", sortable: true },
    {
      key: "status",
      label: "Status",
      badge: (value) => toneFromValue(value),
    },
    {
      key: "reputation",
      label: "Reputation",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          {row.reputation === "Safe" ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          ) : row.reputation === "Suspicious" ? (
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          ) : row.reputation === "Malicious" ? (
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          ) : null}
          <span className="text-slate-200">{String(row.reputation ?? "—")}</span>
        </span>
      ),
    },
    {
      key: "riskScore",
      label: "Risk Score",
      align: "right",
      sortable: true,
      render: (row) => {
        const score = Number(row.riskScore) || 0;
        const color = score >= 80 ? "text-rose-300" : score >= 40 ? "text-amber-300" : "text-emerald-300";
        return (
          <span className={`font-semibold ${color}`}>
            {score > 0 ? `${score}%` : "—"}
          </span>
        );
      },
    },
    {
      key: "threatStatus",
      label: "Threat Status",
      badge: (value) => toneFromValue(value),
    },
    { key: "source", label: "Source", hideOnMobile: true },
    { key: "ttl", label: "TTL", align: "right", hideOnMobile: true },
    {
      key: "lastUpdated",
      label: "Last Updated",
      sortable: true,
      hideOnMobile: true,
    },
  ];

const gridRows = useMemo(
    () =>
      records.map((r, i) => ({
        key: `${r.type}-${r.value}-${i}`,
        type: r.type,
        value: r.value,
        status: r.status,
        reputation: "—",
        riskScore: 0,
        threatStatus: "—",
        source: "—",
        ttl: "—",
        lastUpdated: r.lastUpdated,
        details: r.details,
      })),
    [records],
  );

  const handleView = (row: Record<string, unknown>) => {
    window.alert(`DNS ${row.type}: ${row.value}\n${row.details}`);
  };

  return (
    <Card className="border-cyan-500/20 bg-slate-950/80 text-slate-100 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <CardHeader className="border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">DNS Intelligence</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Analyze domain records, infrastructure and suspicious DNS activity.
            </CardDescription>
          </div>
          <Badge
            className={`border ${
              dnsReputation === "Safe"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : dnsReputation === "Suspicious"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : dnsReputation === "Malicious"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
            }`}
          >
            {verdict === "clean" ? (
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            ) : verdict === "suspicious" || verdict === "malicious" ? (
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            ) : null}
            {analyzed && !loading ? dnsReputation : "Awaiting Analysis"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Summary stat cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total Records"
            value={records.length}
            icon={Layers}
            accent="border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            loading={loading}
          />
          <StatCard
            label="Unique Types"
            value={uniqueTypes}
            icon={Globe2}
            accent="border-blue-400/20 bg-blue-400/10 text-blue-300"
            loading={loading}
          />
          <StatCard
            label="Safe"
            value={safeCount}
            icon={ShieldCheck}
            accent="border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            loading={loading}
          />
          <StatCard
            label="Suspicious"
            value={suspiciousCount}
            icon={ShieldAlert}
            accent="border-amber-400/20 bg-amber-400/10 text-amber-300"
            loading={loading}
          />
          <StatCard
            label="DNS Reputation"
            value={analyzed && !loading ? dnsReputation : "—"}
            icon={Clock3}
            accent="border-violet-400/20 bg-violet-400/10 text-violet-300"
            loading={loading}
          />
        </div>

        {/* Data grid */}
<DataGrid
          columns={columns}
          rows={gridRows}
          rowKey="key"
          exportTitle="DNS Records"
          loading={loading}
          emptyMessage={
            analyzed
              ? "No DNS records returned for this indicator."
              : "Run an IOC analysis to fetch DNS records."
          }
          onRowAction={handleView}
          rowActionLabel="Inspect"
          toolbar={
            <button
              type="button"
              onClick={() => {
                if (window && records.length > 0) {
                  copyValue(records.map((r) => `${r.type} ${r.value}`).join("\n"));
                }
              }}
              disabled={records.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy All"}
            </button>
          }
        />
      </CardContent>
    </Card>
  );
}
