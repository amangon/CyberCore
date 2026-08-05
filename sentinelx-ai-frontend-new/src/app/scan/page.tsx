"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, Activity, ScanSearch, Loader2, X } from "lucide-react";

import FileScanner from "@/components/scan/FileScanner";
import URLScanner from "@/components/scan/URLScanner";
import IPScanner from "@/components/scan/IPScanner";
import HashScanner from "@/components/scan/HashScanner";
import ScanHistory from "@/components/scan/ScanHistory";
import ResultCard from "@/components/scan/ResultCard";
import { getScanHistory, getScanById } from "@/services/scan.service";
import { exportScanJSON, exportScanCSV, exportScanPDF } from "@/lib/exportReport";
import type { ScanRecord, ScanResult } from "@/types/security";

type ScannerTab = "file" | "url" | "ip" | "hash";

const tabs: { key: ScannerTab; label: string }[] = [
  { key: "file", label: "File Scan" },
  { key: "url", label: "URL Scan" },
  { key: "ip", label: "IP Scan" },
  { key: "hash", label: "Hash Scan" },
];

export default function ScanPage() {
  const [tab, setTab] = React.useState<ScannerTab>("file");
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [totalScans, setTotalScans] = React.useState<number | null>(null);
  const [threatsDetected, setThreatsDetected] = React.useState(0);
  const [safeObjects, setSafeObjects] = React.useState(0);
  const [history, setHistory] = React.useState<ScanRecord[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  // View Result state: the history item currently being inspected.
  const [viewingScan, setViewingScan] = React.useState<ScanResult | null>(null);
  const [viewingLoading, setViewingLoading] = React.useState(false);
  const [exportingId, setExportingId] = React.useState<string | null>(null);

// Shared function to fetch both stats and history
  const fetchAllData = React.useCallback(async (isMounted: { current: boolean }) => {
    setStatsLoading(true);
    setHistoryLoading(true);
    try {
      const data = await getScanHistory({ page: 1, limit: 1000 });
      if (!isMounted.current) return;
      const arr = Array.isArray(data) ? data : [];
      const total = arr.length;
      const threats = arr.filter((r) => r.status === "malicious" || r.status === "suspicious").length;
      const safe = arr.filter((r) => r.status === "safe").length;
      setTotalScans(total);
      setThreatsDetected(threats);
      setSafeObjects(safe);
      setHistory(arr);
    } catch (error) {
      console.error("Failed to fetch scan data:", error);
      if (isMounted.current) {
        setTotalScans(null);
        setHistory([]);
      }
    } finally {
      if (isMounted.current) {
        setStatsLoading(false);
        setHistoryLoading(false);
      }
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    const mounted = { current: true };
    void fetchAllData(mounted);
    return () => { mounted.current = false; };
  }, [fetchAllData]);

  // Refetch both stats and history when a scan completes
  const handleScanComplete = React.useCallback(async () => {
    const mounted = { current: true };
    await fetchAllData(mounted);
  }, [fetchAllData]);

  // ── View Result: fetch the exact stored scan by ID and show it. ──────────
  const handleViewResult = React.useCallback(async (scanId: string) => {
    if (!scanId) return;
    setViewingLoading(true);
    try {
      const record = await getScanById(scanId);
      setViewingScan(record);
    } finally {
      setViewingLoading(false);
    }
  }, []);

  // ── Export Report: download JSON / CSV / PDF for a history item. ─────────
  const handleExport = React.useCallback(
    async (scanId: string, format: "json" | "csv" | "pdf") => {
      if (!scanId) return;
      setExportingId(scanId);
      try {
        const record = await getScanById(scanId);
        if (!record) return;
        if (format === "json") exportScanJSON(record);
        else if (format === "csv") exportScanCSV(record);
        else exportScanPDF(record);
      } finally {
        setExportingId(null);
      }
    },
    [],
  );

  const total = totalScans ?? 0;
  const accuracy = total > 0 ? ((safeObjects / total) * 100).toFixed(1) : "—";

  const stats = [
    { label: "Total Scans", value: totalScans !== null ? total.toLocaleString() : "—", icon: Activity },
    { label: "Threats Detected", value: threatsDetected.toLocaleString(), icon: ShieldAlert },
    { label: "Safe Objects", value: safeObjects.toLocaleString(), icon: ShieldCheck },
    { label: "Detection Accuracy", value: accuracy === "—" ? "—" : `${accuracy}%`, icon: ScanSearch },
  ];

const scannerComponents = {
    file: FileScanner,
    url: URLScanner,
    ip: IPScanner,
    hash: HashScanner,
  } as const;
  const Scanner = scannerComponents[tab];

  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.14),transparent_24%),linear-gradient(to_bottom,#020617,#020617)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Security Scanner
            </h1>
            <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
              AI-powered threat detection for files, URLs, IPs and hashes.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">{s.label}</div>
                      <div className="mt-1 text-2xl font-semibold text-white">
                        {statsLoading ? (
                          <Loader2 className="inline h-5 w-5 animate-spin text-slate-400" />
                        ) : (
                          s.value
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(168,85,247,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={[
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    active
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              className="mt-6"
            >
              <Scanner onScanComplete={handleScanComplete} />
            </motion.div>
          </AnimatePresence>
        </section>

{/* ── Saved Scan Result (opened from Scan History "View Result") ── */}
        {viewingScan || viewingLoading ? (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Activity className="h-4 w-4 text-cyan-300" />
                <span className="uppercase tracking-[0.2em] text-xs">Saved Scan Result</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingScan(null)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
            {viewingLoading ? (
              <div className="flex min-h-56 items-center justify-center gap-2 rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading saved scan result...
              </div>
            ) : viewingScan ? (
            <ResultCard
              target={viewingScan.target}
              scanType={viewingScan.type === "ip" ? "IP Scan" : viewingScan.type === "url" ? "URL Scan" : viewingScan.type === "hash" ? "Hash Scan" : "File Scan"}
              status={viewingScan.status}
              riskScore={viewingScan.riskScore}
              aiVerdict={viewingScan.aiVerdict}
              threatLevel={viewingScan.threatLevel}
              detectionStatus={viewingScan.detectionStatus}
              analysisTime={viewingScan.createdAt}
              detectionEngines={viewingScan.detectionEngines}
              detectionCount={viewingScan.detectionCount}
              threatFamily={viewingScan.threatFamily}
              blacklistStatus={viewingScan.blacklistStatus}
              reputation={viewingScan.reputation}
              lastAnalysis={viewingScan.lastAnalysis}
              firstSeen={viewingScan.firstSeen}
              fileType={viewingScan.fileType}
              country={viewingScan.country}
              city={viewingScan.city}
              isp={viewingScan.isp}
              asn={viewingScan.asn}
              organization={viewingScan.organization}
              connectionType={viewingScan.connectionType}
              abuseScore={viewingScan.abuseScore}
              providers={viewingScan.providers}
              onExportReport={() => {
                if (viewingScan.id) void handleExport(viewingScan.id, "json");
              }}
onRunNewScan={() => setViewingScan(null)}
            />
            ) : null}
          </motion.section>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-xl sm:p-6"
        >
          <ScanHistory
            scans={history}
            loading={historyLoading}
            onViewResult={(scan) => {
              void handleViewResult(scan.id);
            }}
            onExportReport={(scan, format) => {
              void handleExport(scan.id, format);
            }}
            exportingId={exportingId}
          />
        </motion.section>
      </div>
    </motion.main>
  );
}
