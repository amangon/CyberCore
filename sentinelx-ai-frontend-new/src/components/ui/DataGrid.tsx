"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileDown,
  FileText,
  ShieldAlert,
  Loader2,
  ArrowUpRight,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { exportTableCSV, exportTablePDF } from "@/lib/tableExport";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BadgeTone =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "success"
  | "warning"
  | "info"
  | "default";

export interface DataGridColumn {
  readonly key: string;
  readonly label: string;
  /** Render custom cell content. */
  render?: (row: Record<string, unknown>) => React.ReactNode;
  /** Show a badge whose tone is derived from the value. */
  badge?: (value: unknown) => BadgeTone;
  /** Align the column content. */
  align?: "left" | "right" | "center";
  /** Make the column sortable. */
  sortable?: boolean;
  /** Hide on small screens (responsive). */
  hideOnMobile?: boolean;
  /** Optional CSS width. */
  width?: string;
}

export interface DataGridProps {
  columns: DataGridColumn[];
  rows: Record<string, unknown>[];
  /** Key used for row identity. */
  rowKey: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  /** Title used for export filenames. */
  exportTitle?: string;
  /** Enable the search input. */
  searchable?: boolean;
  /** Enable pagination. */
  paginated?: boolean;
  /** Enable column filters box. */
  filterable?: boolean;
  /** Callback for a primary row action. */
  onRowAction?: (row: Record<string, unknown>) => void;
  rowActionLabel?: string;
  onRefresh?: () => void;
  /** Extra toolbar buttons. */
  toolbar?: React.ReactNode;
}

const toneStyles: Record<BadgeTone, string> = {
  critical: "border-red-500/40 bg-red-500/10 text-red-300",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  default: "border-white/10 bg-white/5 text-slate-200",
};

export function toneFromValue(value: unknown): BadgeTone {
  const v = String(value ?? "").toLowerCase();
  if (v.includes("critical") || v.includes("malicious") || v.includes("unpatched")) return "critical";
  if (v.includes("high") || v.includes("suspicious")) return "high";
  if (v.includes("medium") || v.includes("warning")) return "medium";
  if (v.includes("low") || v.includes("safe") || v.includes("patched") || v.includes("monitoring")) return "low";
  if (v.includes("active") || v.includes("resolved") || v.includes("valid")) return "success";
  if (v.includes("info") || v.includes("authoritative")) return "info";
  return "default";
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  if (!s) return "—";
  return s;
}

// ─── Sort / filter helpers ───────────────────────────────────────────────────

function sortRows(
  rows: Record<string, unknown>[],
  column: string,
  dir: "asc" | "desc",
): Record<string, unknown>[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const av = a[column];
    const bv = b[column];
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    const na = Number(av);
    const nb = Number(bv);
    if (Number.isFinite(na) && Number.isFinite(nb)) {
      return dir === "asc" ? na - nb : nb - na;
    }
    const cmp = String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function DataGrid({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyMessage = "No records found.",
  exportTitle = "Data",
  searchable = true,
  paginated = true,
  filterable = true,
  onRowAction,
  rowActionLabel = "View",
  onRefresh,
  toolbar,
}: DataGridProps) {
  const [query, setQuery] = React.useState("");
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

  const filterValues = React.useMemo(() => {
    if (!filterable || columns.length === 0) return [];
    const col = columns[0];
    const values = new Set<string>();
    rows.forEach((r) => {
      const v = displayValue(r[col.key]);
      if (v !== "—") values.add(v);
    });
    return Array.from(values).slice(0, 12);
  }, [rows, filterable, columns]);

  const filtered = React.useMemo(() => {
    let out = rows;
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter((r) =>
        columns.some((c) => displayValue(r[c.key]).toLowerCase().includes(q)),
      );
    }
    if (activeFilter && filterable && columns.length > 0) {
      const col = columns[0];
      out = out.filter((r) => displayValue(r[col.key]) === activeFilter);
    }
    return out;
  }, [rows, query, columns, activeFilter, filterable]);

  const sorted = React.useMemo(() => {
    if (!sortCol) return filtered;
    return sortRows(filtered, sortCol, sortDir);
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = React.useMemo(() => {
    if (!paginated) return sorted;
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, paginated, safePage, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [query, activeFilter]);

  const handleSort = (col: DataGridColumn) => {
    if (!col.sortable) return;
    if (sortCol === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col.key);
      setSortDir("asc");
    }
  };

  const handleExportCSV = () =>
    exportTableCSV(
      columns.map((c) => ({ key: c.key, label: c.label })),
      sorted,
      exportTitle,
    );

  const handleExportPDF = () =>
    exportTablePDF(
      columns.map((c) => ({ key: c.key, label: c.label })),
      sorted,
      exportTitle,
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {searchable && (
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search records..."
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                aria-label="Search table"
              />
            </div>
          )}

          {filterable && filterValues.length > 0 && (
            <select
              value={activeFilter ?? ""}
              onChange={(e) => setActiveFilter(e.target.value || null)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-200 outline-none focus:border-cyan-400/50"
              aria-label="Filter column"
            >
              <option value="">All filter values</option>
              {filterValues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}

          {toolbar}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            <FileDown className="h-3.5 w-3.5 text-cyan-300" />
            CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={sorted.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-300" />
            PDF
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
            <p className="text-sm text-slate-400">Loading records...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
            <ShieldAlert className="h-8 w-8 text-rose-300" />
            <p className="text-sm text-rose-200">{error}</p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            )}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center p-8 text-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col)}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    } ${col.sortable ? "cursor-pointer select-none hover:text-cyan-300" : ""} ${
                      col.hideOnMobile ? "hidden lg:table-cell" : ""
                    }`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable &&
                        (sortCol === col.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5 text-cyan-300" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-cyan-300" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                        ))}
                    </span>
                  </th>
                ))}
                {onRowAction && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {paged.map((row, idx) => (
                  <motion.tr
                    key={String(row[rowKey] ?? idx)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.02 }}
                    className="border-b border-white/5 transition-colors last:border-b-0 hover:bg-cyan-500/[0.04]"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm text-slate-200 ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                              ? "text-center"
                              : "text-left"
                        } ${col.hideOnMobile ? "hidden lg:table-cell" : ""}`}
                      >
                        {col.render ? (
                          col.render(row)
                        ) : col.badge ? (
                          <Badge className={`border ${toneStyles[col.badge(row[col.key])]}`}>
                            {displayValue(row[col.key])}
                          </Badge>
                        ) : (
                          <span className="break-words">{displayValue(row[col.key])}</span>
                        )}
                      </td>
                    ))}
                    {onRowAction && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRowAction(row)}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/20"
                        >
                          {rowActionLabel}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / pagination */}
      {paginated && !loading && !error && sorted.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>
              Showing{" "}
              <span className="font-medium text-slate-200">
                {sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
              </span>
              –
              <span className="font-medium text-slate-200">
                {Math.min(safePage * pageSize, sorted.length)}
              </span>{" "}
              of <span className="font-medium text-slate-200">{sorted.length}</span>
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border border-white/10 bg-slate-900/70 px-2 text-xs text-slate-200 outline-none"
              aria-label="Rows per page"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm text-slate-400">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
