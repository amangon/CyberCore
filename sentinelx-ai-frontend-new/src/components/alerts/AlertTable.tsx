import { useMemo, useState } from "react";
import Link from "next/link";
import type { Alert } from "@/types/security";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Status = "Open" | "Investigating" | "Contained" | "Resolved";
type Source = "Firewall" | "Network Sensor" | "EDR" | "SIEM" | "Cloud Agent" | string;

type SortKey = keyof AlertRecord;
type SortDirection = "asc" | "desc";

interface AlertRecord {
  id: string;
  title: string;
  severity: Severity;
  source: Source;
  asset: string;
  assignedTo: string;
  status: Status;
  time: string;
}

const SEVERITY_META: Record<Severity, { label: string; badge: string; ring: string }> = {
  Critical: { label: "Critical", badge: "bg-rose-500/15 text-rose-300", ring: "ring-rose-400/20" },
  High: { label: "High", badge: "bg-orange-500/15 text-orange-300", ring: "ring-orange-400/20" },
  Medium: { label: "Medium", badge: "bg-amber-400/15 text-amber-300", ring: "ring-amber-400/20" },
  Low: { label: "Low", badge: "bg-sky-500/15 text-sky-300", ring: "ring-sky-400/20" },
};

const STATUS_META: Record<Status, { badge: string }> = {
  Open: { badge: "bg-slate-700/80 text-slate-200" },
  Investigating: { badge: "bg-amber-500/15 text-amber-300" },
  Contained: { badge: "bg-cyan-500/15 text-cyan-300" },
  Resolved: { badge: "bg-emerald-500/15 text-emerald-300" },
};

const SOURCES: Source[] = ["Firewall", "Network Sensor", "EDR", "SIEM", "Cloud Agent"];
const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
const STATUSES: Status[] = ["Open", "Investigating", "Contained", "Resolved"];

/** Map a backend `Alert` record into the table's display shape. */
function toAlertRecord(alert: Alert): AlertRecord {
  const severity = (alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)) as Severity;
  const status = (alert.status.charAt(0).toUpperCase() + alert.status.slice(1)) as Status;
  return {
    id: alert.id,
    title: alert.title,
    severity: SEVERITIES.includes(severity) ? severity : "Low",
    source: alert.source || "SIEM",
    asset: alert.affectedAsset || alert.assetIP || "Unknown",
    assignedTo: alert.assignedTo || "Unassigned",
    status: STATUSES.includes(status) ? status : "Open",
    time: alert.createdAt ? new Date(alert.createdAt).toLocaleString("en-US", { timeZone: "UTC" }) : "",
  };
}

type TableColumn = { label: string; key: SortKey | "actions" };

const TABLE_COLUMNS: readonly TableColumn[] = [
  { label: "Alert ID", key: "id" },
  { label: "Title", key: "title" },
  { label: "Severity", key: "severity" },
  { label: "Source", key: "source" },
  { label: "Affected Asset", key: "asset" },
  { label: "Assigned To", key: "assignedTo" },
  { label: "Status", key: "status" },
  { label: "Time", key: "time" },
  { label: "Actions", key: "actions" },
];

function sortValue(record: AlertRecord, key: SortKey) {
  if (key === "time") {
    return new Date(record.time).getTime();
  }

  const value = record[key];
  return typeof value === "string" ? value.toLowerCase() : String(value);
}

export function AlertTable({ alerts = [] }: { alerts?: readonly Alert[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSeverity, setActiveSeverity] = useState<Severity | "All">("All");
  const [activeStatus, setActiveStatus] = useState<Status | "All">("All");
  const [activeSource, setActiveSource] = useState<Source | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Derive table records from the backend-provided alerts.
  const ALERTS = useMemo<AlertRecord[]>(() => {
    const source: readonly Alert[] = alerts && alerts.length > 0 ? alerts : [];
    return source.map((alert) => toAlertRecord(alert));
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return ALERTS.filter((alert) => {
      const search = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !search ||
        alert.id.toLowerCase().includes(search) ||
        alert.title.toLowerCase().includes(search) ||
        alert.asset.toLowerCase().includes(search) ||
        alert.assignedTo.toLowerCase().includes(search);

      const matchesSeverity = activeSeverity === "All" || alert.severity === activeSeverity;
      const matchesStatus = activeStatus === "All" || alert.status === activeStatus;
      const matchesSource = activeSource === "All" || alert.source === activeSource;

      return matchesSearch && matchesSeverity && matchesStatus && matchesSource;
    });
  }, [activeSeverity, activeSource, activeStatus, searchQuery]);

  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      const aValue = sortValue(a, sortKey);
      const bValue = sortValue(b, sortKey);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [filteredAlerts, sortDirection, sortKey]);

  const activeSortedAlerts = sortDirection === "desc" ? [...sortedAlerts].reverse() : sortedAlerts;

  const pageCount = Math.max(1, Math.ceil(activeSortedAlerts.length / pageSize));
  const currentAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeSortedAlerts.slice(start, start + pageSize);
  }, [activeSortedAlerts, currentPage, pageSize]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const resetPage = () => setCurrentPage(1);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Enterprise alerts</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Live alert operations</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              Search, filter, sort, and page through the latest investigative alerts with a secure dark operations dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 shadow-inner shadow-white/5">
              <label className="sr-only" htmlFor="alert-search">Search alerts</label>
              <input
                id="alert-search"
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  resetPage();
                }}
                placeholder="Search by alert, asset, assignee..."
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSeverity("All");
                  setActiveStatus("All");
                  setActiveSource("All");
                  setSearchQuery("");
                  resetPage();
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Severity</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSeverity("All");
                    resetPage();
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition ${
                    activeSeverity === "All"
                      ? "border-white/20 bg-white/5 text-white"
                      : "border-white/10 bg-slate-900 text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  All
                </button>
                {SEVERITIES.map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => {
                      setActiveSeverity(severity);
                      resetPage();
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition ${
                      activeSeverity === severity
                        ? "border-white/20 bg-white/5 text-white"
                        : "border-white/10 bg-slate-900 text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStatus("All");
                    resetPage();
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition ${
                    activeStatus === "All"
                      ? "border-white/20 bg-white/5 text-white"
                      : "border-white/10 bg-slate-900 text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  All
                </button>
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setActiveStatus(status);
                      resetPage();
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition ${
                      activeStatus === status
                        ? "border-white/20 bg-white/5 text-white"
                        : "border-white/10 bg-slate-900 text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Source</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSource("All");
                    resetPage();
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition ${
                    activeSource === "All"
                      ? "border-white/20 bg-white/5 text-white"
                      : "border-white/10 bg-slate-900 text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  All
                </button>
                {SOURCES.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => {
                      setActiveSource(source);
                      resetPage();
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition ${
                      activeSource === source
                        ? "border-white/20 bg-white/5 text-white"
                        : "border-white/10 bg-slate-900 text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Active filters</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs text-slate-300">
                {activeSeverity === "All" ? "Severity: All" : `Severity: ${activeSeverity}`}
              </span>
              <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs text-slate-300">
                {activeStatus === "All" ? "Status: All" : `Status: ${activeStatus}`}
              </span>
              <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs text-slate-300">
                {activeSource === "All" ? "Source: All" : `Source: ${activeSource}`}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Showing {activeSortedAlerts.length} alerts across {pageCount} page{pageCount === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden px-5 pb-6 sm:px-6">
        <div className="overflow-x-auto rounded-[1.7rem] border border-white/10 bg-slate-950/70 shadow-inner shadow-white/5">
          <table className="min-w-[1120px] w-full table-fixed border-separate border-spacing-0">
            <thead className="bg-slate-950/95 text-left text-[11px] uppercase tracking-[0.28em] text-slate-500">
              <tr>
                {TABLE_COLUMNS.map(({ label, key }) => (
                  <th
                    key={label}
                    scope="col"
                    className={`sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-xl ${
                      label === "Actions" ? "text-right" : ""
                    } ${label === "Assigned To" ? "hidden xl:table-cell" : ""} ${label === "Source" ? "hidden lg:table-cell" : ""}`}
                  >
                    {label !== "Actions" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (key !== "actions") {
                            handleSort(key);
                          }
                        }}
                        className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-slate-300 transition hover:text-white"
                      >
                        <span>{label}</span>
                        <span className="text-[10px] text-slate-500">
                          {sortKey === key ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      <span>{label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-white/5 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/80"
                >
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-200">
                    <span className="font-medium text-cyan-300">{alert.id}</span>
                  </td>
                  <td className="max-w-[300px] truncate px-4 py-4 text-sm text-slate-100">
                    <span className="block min-w-0 truncate">{alert.title}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${SEVERITY_META[alert.severity].badge} ${SEVERITY_META[alert.severity].ring}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                    <span className="block min-w-0 truncate">{alert.source}</span>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-4 text-sm text-slate-100">
                    <span className="block min-w-0 truncate">{alert.asset}</span>
                  </td>
                  <td className="hidden xl:table-cell max-w-[140px] truncate px-4 py-4 text-sm text-slate-100">
                    <span className="block min-w-0 truncate">{alert.assignedTo}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${STATUS_META[alert.status].badge}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                    {alert.time}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-white"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
              {currentAlerts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">
                    No alerts match the current search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span>{currentAlerts.length} of {activeSortedAlerts.length} alerts shown</span>
          <span className="hidden sm:inline-block">•</span>
          <span>Page {currentPage} / {pageCount}</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/75 px-3 py-2 text-sm text-slate-300">
            <label htmlFor="page-size" className="text-slate-400">Rows:</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none"
            >
              {[5, 10, 15].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
