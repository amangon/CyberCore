"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ScanSearch,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getScanHistory, getScanErrorMessage } from "@/services/scan.service";
import type { ScanRecord } from "@/types/security";

type LocalScanStatus = "Safe" | "Suspicious" | "Malicious";

type LocalScanRecord = {
  id: string;
  target: string;
  type: string;
  status: LocalScanStatus;
  riskScore: number;
  date: string;
};

export type ExportFormat = "json" | "csv" | "pdf";

type ScanHistoryProps = {
  scans?: ScanRecord[];
  loading?: boolean;
  onViewResult?: (scan: LocalScanRecord) => void;
  onExportReport?: (scan: LocalScanRecord, format: ExportFormat) => void;
  /** ID of the scan currently being exported (for button spinner/disabled state). */
  exportingId?: string | null;
  pageSize?: number;
};

const statusConfig: Record<
  LocalScanStatus,
  { label: LocalScanStatus; className: string; icon: React.ReactNode }
> = {
  Safe: {
    label: "Safe",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  Suspicious: {
    label: "Suspicious",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  Malicious: {
    label: "Malicious",
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15",
    icon: <ShieldX className="h-3.5 w-3.5" />,
  },
};

const riskTone = (risk: number) =>
  risk >= 80
    ? "from-rose-500 to-orange-500"
    : risk >= 40
      ? "from-amber-400 to-yellow-500"
      : "from-emerald-400 to-cyan-400";

const CardShell = ({ children }: { children: React.ReactNode }) => (
  <Card className="border-white/10 bg-slate-950/70 text-slate-100 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl">
    {children}
  </Card>
);

function toLocalStatus(value: ScanRecord["status"]): LocalScanStatus {
  if (value === "malicious") return "Malicious";
  if (value === "suspicious") return "Suspicious";
  return "Safe";
}

function typeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t === "file") return "File Scan";
  if (t === "url") return "URL Scan";
  if (t === "ip") return "IP Scan";
  if (t === "hash") return "Hash Scan";
  return "Scan";
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function mapRecord(item: ScanRecord): LocalScanRecord {
  return {
    id: item.id ?? "",
    target: item.target || "Unknown target",
    type: typeLabel(item.type),
    status: toLocalStatus(item.status),
    riskScore: Math.max(0, Math.min(100, item.riskScore)),
    date: formatDate(item.createdAt),
  };
}

export default function ScanHistory({
  scans: propScans,
  loading: propLoading,
  onViewResult,
  onExportReport,
  exportingId,
  pageSize = 10,
}: ScanHistoryProps) {
  const [query, setQuery] = React.useState("");
  const [records, setRecords] = React.useState<LocalScanRecord[]>([]);
  const [loading, setLoading] = React.useState(Boolean(propLoading));
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScanHistory({ page, limit: pageSize });
      const sorted = data
        .slice()
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      setRecords(sorted.map(mapRecord));
    } catch (err) {
      setError(getScanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // If caller provides scans prop, use it (controlled mode)
    if (propScans !== undefined) {
      const mapped = propScans.map(mapRecord);
      setRecords(mapped);
      setLoading(false);
      setError(null);
      return;
    }
    if (propLoading !== undefined) {
      setLoading(propLoading);
      return;
    }
    // Otherwise, load data ourselves (uncontrolled mode)
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, propScans, propLoading]);

  const list = propScans ? propScans.map(mapRecord) : records;
  const isLoading = propLoading ?? loading;

  const filteredScans = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.target.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        String(s.riskScore).includes(q) ||
        s.date.toLowerCase().includes(q)
    );
  }, [query, list]);

  const startIndex = (page - 1) * pageSize;
  const visibleScans = propScans
    ? filteredScans
    : filteredScans.slice(startIndex, startIndex + pageSize);
  const hasMore = !propScans && records.length >= pageSize;

  const handlePage = (next: number) => {
    if (next < 1) return;
    setPage(next);
  };

  return (
    <CardShell>
      <CardHeader className="space-y-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              Scan History
            </CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              Review previous security analysis activity.
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
              SOC Dashboard
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scans..."
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/70 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              aria-label="Search scan history"
            />
          </div>

          {!propScans ? (
            <button
              type="button"
              onClick={() => void load()}
              disabled={isLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 p-6 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading scan records...
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-rose-200">
            <ShieldAlert className="h-6 w-6" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-medium text-rose-200 transition hover:bg-rose-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="flex min-h-56 items-center justify-center p-6 text-sm text-slate-400">
            {propScans ? "No scan history available" : "No scan history found. Run a scan to get started."}
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden md:block">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <table className="w-full border-collapse">
                  <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                    <tr className="[&>th]:px-6 [&>th]:py-4">
                      <th>Target</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Risk Score</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleScans.map((scan) => {
                      const cfg = statusConfig[scan.status];

                      return (
                        <motion.tr
                          key={`${scan.id || scan.target}-${scan.date}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-white/5 bg-transparent transition-colors hover:bg-white/5"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">
                              {scan.target}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <FileSearch className="h-3.5 w-3.5 text-cyan-400" />
                              {scan.type}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {scan.type}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={cfg.className}>
                              <span className="mr-1.5 flex items-center">
                                {cfg.icon}
                              </span>
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2.5 w-28 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${riskTone(
                                    scan.riskScore,
                                  )}`}
                                  style={{ width: `${scan.riskScore}%` }}
                                />
                              </div>
                              <span className="w-10 text-sm font-medium text-slate-200">
                                {scan.riskScore}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {scan.date}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onViewResult?.(scan)}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 text-sm text-cyan-300 transition hover:bg-cyan-500/15"
                              >
                                View Result
                                <ArrowUpRight className="h-4 w-4" />
                              </button>
<div className="flex items-center gap-1">
                                {(["json", "csv", "pdf"] as const).map((fmt) => (
                                  <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => onExportReport?.(scan, fmt)}
                                    disabled={exportingId === scan.id}
                                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-slate-200 uppercase transition hover:bg-white/10 disabled:opacity-50"
                                  >
                                    {exportingId === scan.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Download className="h-3.5 w-3.5" />
                                    )}
                                    {fmt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {visibleScans.map((scan) => {
                const cfg = statusConfig[scan.status];

                return (
                  <motion.div
                    key={`${scan.id || scan.target}-${scan.date}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{scan.target}</div>
                        <div className="mt-1 text-sm text-slate-400">{scan.type}</div>
                      </div>
                      <Badge className={cfg.className}>
                        <span className="mr-1.5 flex items-center">{cfg.icon}</span>
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                          <span>Risk Score</span>
                          <span>{scan.riskScore}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${riskTone(
                              scan.riskScore,
                            )}`}
                            style={{ width: `${scan.riskScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">{scan.date}</div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onViewResult?.(scan)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 text-sm text-cyan-300 transition hover:bg-cyan-500/15"
                        >
                          View Result
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
{(["json", "csv", "pdf"] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => onExportReport?.(scan, fmt)}
                            disabled={exportingId === scan.id}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-slate-200 uppercase transition hover:bg-white/10 disabled:opacity-50"
                          >
                            {exportingId === scan.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </CardShell>
  );
}