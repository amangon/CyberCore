"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileBarChart,
  FileText,
  Filter,
  Loader2,
  Lock,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
Trash2,
  Users,
  X,
} from "lucide-react";

import {
  getReports,
  getReportStats,
  createReport,
  deleteReport,
  archiveReport,
  getReportErrorMessage,
  type ReportDTO,
  type ReportStatus,
  type ReportFormat,
  type ReportStatsDTO,
} from "@/services/report.service";
import { exportTableCSV, exportTablePDF } from "@/lib/tableExport";

// ─── Types ────────────────────────────────────────────────────────────────────

const statusStyles: Record<ReportStatus, string> = {
  Completed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Scheduled: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  Failed: "bg-red-500/10 text-red-300 border-red-500/20",
  Draft: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  Archived: "bg-violet-500/10 text-violet-300 border-violet-500/20",
};

const formatStyles: Record<ReportFormat, string> = {
  PDF: "bg-red-500/10 text-red-300 border-red-500/20",
  CSV: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  JSON: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  EXCEL: "bg-green-500/10 text-green-300 border-green-500/20",
  HTML: "bg-sky-500/10 text-sky-300 border-sky-500/20",
};

const categoryIcon: Record<string, typeof FileText> = {
  Executive: ShieldCheck,
  Threat: AlertTriangle,
  Incident: Activity,
  Vulnerability: FileText,
  Asset: Server,
  Compliance: Lock,
  Risk: AlertTriangle,
  User: Users,
  IOC: FileText,
  "Security Score": BarChart3,
};

const statusOptions: ReportStatus[] = ["Completed", "Scheduled", "Failed", "Draft", "Archived"];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

const reportExportColumns = [
  { key: "reportId", label: "ID" },
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "department", label: "Department" },
  { key: "author", label: "Author" },
  { key: "status", label: "Status" },
  { key: "format", label: "Format" },
  { key: "createdAt", label: "Created" },
];

function reportToExportRow(report: ReportDTO): Record<string, unknown> {
  return {
    reportId: report.reportId,
    title: report.title,
    category: report.category,
    department: report.department,
    author: report.author,
    status: report.status,
    format: report.format,
    createdAt: formatDate(report.createdAt),
  };
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  index,
  loading,
}: {
  label: string;
  value: string | number;
  icon: typeof FileText;
  accent: string;
  index: number;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <div className={`rounded-xl border p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold text-white">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : value}
      </div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </motion.div>
  );
}

// ─── New Report Modal ─────────────────────────────────────────────────────────

function NewReportModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    title: string;
    description: string;
    category: string;
    status: ReportStatus;
    format: ReportFormat;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Executive");
  const [status, setStatus] = useState<ReportStatus>("Draft");
  const [format, setFormat] = useState<ReportFormat>("PDF");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) {
      setError("Report title is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ title, description, category, status, format });
      onClose();
    } catch (err) {
      setError(getReportErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Report</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Executive Security Posture Report"
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm text-white outline-none focus:border-cyan-400/40"
              >
                {["Executive", "Threat", "Vulnerability", "Compliance", "Incident", "IOC", "MITRE", "Asset", "Security Score", "Risk"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ReportFormat)}
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm text-white outline-none focus:border-cyan-400/40"
              >
                {["PDF", "CSV", "JSON", "EXCEL", "HTML"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus)}
              className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm text-white outline-none focus:border-cyan-400/40"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => void submit()}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:from-cyan-300 hover:to-blue-400 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Report
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
const [reports, setReports] = useState<readonly ReportDTO[]>([]);
  const [stats, setStats] = useState<ReportStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "All">("All");
  const [formatFilter, setFormatFilter] = useState<ReportFormat | "All">("All");
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, statsData] = await Promise.all([
        getReports({ limit: 100 }),
        getReportStats(),
      ]);
      setReports(list.items);
      setStats(statsData);
    } catch (err) {
      setError(getReportErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchesQuery =
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.reportId.toLowerCase().includes(query.toLowerCase()) ||
        r.author.toLowerCase().includes(query.toLowerCase()) ||
        r.department.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      const matchesFormat = formatFilter === "All" || r.format === formatFilter;
      return matchesQuery && matchesStatus && matchesFormat;
    });
  }, [reports, query, statusFilter, formatFilter]);

  const kpiItems = [
    { label: "Total Reports", value: stats?.total ?? 0, icon: FileBarChart, accent: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20" },
    { label: "Completed", value: stats?.completed ?? 0, icon: Sparkles, accent: "text-violet-300 bg-violet-400/10 border-violet-400/20" },
    { label: "Scheduled", value: stats?.scheduled ?? 0, icon: CalendarClock, accent: "text-amber-300 bg-amber-400/10 border-amber-400/20" },
    { label: "Failed", value: stats?.failed ?? 0, icon: AlertTriangle, accent: "text-rose-300 bg-rose-400/10 border-rose-400/20" },
    { label: "Archived", value: stats?.archived ?? 0, icon: Lock, accent: "text-sky-300 bg-sky-400/10 border-sky-400/20" },
  ];

  const handleCreate = async (input: { title: string; description: string; category: string; status: ReportStatus; format: ReportFormat }) => {
    await createReport(input);
    await load();
  };

const handleExport = (report: ReportDTO) => {
    const rows = [reportToExportRow(report)];
    exportTableCSV(reportExportColumns, rows, report.title);
    exportTablePDF(reportExportColumns, rows, report.title);
  };

  const handleArchive = async (report: ReportDTO) => {
    setBusyId(report.id);
    try {
      await archiveReport(report.id, !report.isArchived);
      await load();
    } catch (err) {
      setError(getReportErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (report: ReportDTO) => {
    if (!window.confirm(`Delete report "${report.title}"? This cannot be undone.`)) return;
    setBusyId(report.id);
    try {
      await deleteReport(report.id);
      await load();
    } catch (err) {
      setError(getReportErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.12),transparent_24%),linear-gradient(to_bottom,#020617,#0f172a)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
                <BarChart3 className="h-3.5 w-3.5" />
                SentinelX AI / Reports
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Reports &amp; Analytics
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Generate, schedule and export executive, threat, compliance and operational security reports.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
onClick={() => {
                  if (reports.length > 0) {
                    exportTableCSV(reportExportColumns, reports.map(reportToExportRow), "all-reports");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => setShowNew(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:from-cyan-300 hover:to-blue-400"
              >
                <Plus className="h-4 w-4" />
                New Report
              </button>
            </div>
          </div>

          {/* KPI grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {kpiItems.map((kpi, i) => (
              <KpiCard key={kpi.label} {...kpi} index={i} loading={loading} />
            ))}
          </div>
        </header>

        {/* Toolbar */}
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(139,92,246,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reports by title, ID, author…"
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "All")}
                  className="h-11 appearance-none rounded-xl border border-white/10 bg-slate-900/60 pl-9 pr-8 text-sm text-slate-200 outline-none transition focus:border-cyan-400/40"
                  aria-label="Filter by status"
                >
                  <option value="All">All Statuses</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value as ReportFormat | "All")}
                  className="h-11 appearance-none rounded-xl border border-white/10 bg-slate-900/60 pl-9 pr-8 text-sm text-slate-200 outline-none transition focus:border-cyan-400/40"
                  aria-label="Filter by format"
                >
                  <option value="All">All Formats</option>
                  {["PDF", "CSV", "JSON", "EXCEL", "HTML"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {loading ? "Loading…" : `${filtered.length} of ${reports.length} reports`}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <span>{error}</span>
              <button onClick={() => void load()} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium hover:bg-rose-500/20">
                Retry
              </button>
            </div>
          ) : null}

          {/* Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Department</th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">Author</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Format</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading reports…
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 opacity-40" />
                        <p>No reports found. Create a new report to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((report) => {
                    const CatIcon = categoryIcon[report.category] ?? FileText;
                    return (
                      <tr
                        key={report.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-400">#{report.reportId}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-1.5">
                              <CatIcon className="h-3.5 w-3.5 text-cyan-300" />
                            </div>
                            <span className="max-w-[220px] truncate font-medium text-white">
                              {report.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-300">{report.category}</td>
                        <td className="hidden px-4 py-3.5 text-xs text-slate-400 lg:table-cell">
                          {report.department || "—"}
                        </td>
                        <td className="hidden px-4 py-3.5 text-xs text-slate-400 xl:table-cell">
                          {report.author || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">{formatDate(report.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[report.status]}`}>
                            {report.status === "Completed" ? <CheckCircle2 className="h-3 w-3" /> : null}
                            {report.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-xs font-medium ${formatStyles[report.format]}`}>
                            {report.format}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleExport(report)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/30 hover:bg-white/10 hover:text-white"
                              aria-label={`Download ${report.title}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Export
                            </button>
                            <button
                              onClick={() => void handleArchive(report)}
                              disabled={busyId === report.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-violet-400/30 hover:bg-white/10 hover:text-white disabled:opacity-50"
                              aria-label={report.isArchived ? "Restore report" : "Archive report"}
                            >
                              {busyId === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                              {report.isArchived ? "Restore" : "Archive"}
                            </button>
                            <button
                              onClick={() => void handleDelete(report)}
                              disabled={busyId === report.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                              aria-label={`Delete ${report.title}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showNew ? (
        <NewReportModal onClose={() => setShowNew(false)} onCreate={handleCreate} />
      ) : null}
    </motion.main>
  );
}
