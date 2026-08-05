  "use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  UploadCloud,
  Shield,
  Loader2,
  FileCheck2,
  AlertTriangle,
  Skull,
  ScanLine,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { scanFile, getScanErrorMessage } from "@/services/scan.service";
import { exportScanCSV, exportScanJSON, exportScanPDF } from "@/lib/exportReport";
import type { ScanResult } from "@/types/security";
import ResultCard from "@/components/scan/ResultCard";

const allowed = [".exe", ".apk", ".pdf", ".doc", ".zip"];

export default function FileScanner({ onScanComplete }: { onScanComplete?: () => void } = {}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = (f?: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const runScan = async () => {
    if (!file || scanning) return;
    setScanning(true);
    setResult(null);
    setError(null);
    setProgress(8);

    try {
      const res = await scanFile(file, {
        onProgress: (percent) => {
          setProgress(Math.min(96, Math.max(8, percent)));
        },
      });

      setResult(res);
      setProgress(100);
      onScanComplete?.();
    } catch (err) {
      setResult(null);
      setError(getScanErrorMessage(err));
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">File Threat Scanner</h2>
        <p className="text-sm text-slate-400">
          Upload files and analyze them using AI-powered malware detection.
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <Card className="border-white/10 bg-slate-950/60 p-5 backdrop-blur-xl">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
            accept={allowed.join(",")}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={[
              "group cursor-pointer rounded-3xl border border-dashed p-8 transition",
              "bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%)]",
              drag
                ? "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.12)]"
                : "border-white/15 hover:border-cyan-400/30 hover:bg-white/5",
            ].join(" ")}
          >
            <motion.div
              animate={scanning ? { scale: [1, 1.08, 1], rotate: [0, 5, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, repeat: scanning ? Number.POSITIVE_INFINITY : 0 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            >
              {scanning ? <Loader2 className="h-8 w-8 animate-spin" /> : <UploadCloud className="h-8 w-8" />}
            </motion.div>

            <div className="mt-5 text-center">
              <p className="text-lg font-medium text-white">Drop file here or click to browse</p>
              <p className="mt-2 text-sm text-slate-400">Supported: .exe, .apk, .pdf, .doc, .zip</p>
            </div>

            {file ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected file</p>
                    <p className="mt-1 font-medium text-white">{file.name}</p>
                  </div>
                  <Badge variant="secondary" className="bg-cyan-400/10 text-cyan-200">
                    Ready
                  </Badge>
                </div>

                {scanning ? (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>AI analyzing</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.25 }}
                      />
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ScanLine className="h-3.5 w-3.5" /> AI malware scan
              </span>
              <span>•</span>
              <span>Hash checks</span>
              <span>•</span>
              <span>Behavior signals</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={runScan}
              disabled={!file || scanning}
              className="h-12 flex-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white shadow-[0_0_25px_rgba(34,211,238,0.18)]"
            >
              {scanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Start Security Scan"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFile(null);
                setResult(null);
                setError(null);
                setProgress(0);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="h-12 border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Clear
            </Button>
          </div>
        </Card>

        <Card className="border-white/10 bg-slate-950/60 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-300" />
            <h3 className="text-lg font-semibold text-white">Scan Result</h3>
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={result.target}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                className="mt-5"
              >
                <ResultCard
                  target={file?.name ?? result.target}
                  scanType="File Scan"
                  status={result.status}
                  riskScore={result.riskScore}
                  aiVerdict={result.aiVerdict}
                  threatLevel={result.threatLevel}
                  detectionStatus={result.detectionStatus}
                  analysisTime={result.createdAt}
                  detectionEngines={result.detectionEngines}
                  detectionCount={result.detectionCount}
                  threatFamily={result.threatFamily}
                  blacklistStatus={result.blacklistStatus}
                  reputation={result.reputation}
                  lastAnalysis={result.lastAnalysis}
firstSeen={result.firstSeen}
                  fileType={result.fileType}
                  providers={result.providers}
                  onExportReport={() => {
                    if (result) {
                      exportScanJSON(result);
                      exportScanCSV(result);
                      exportScanPDF(result);
                    }
                  }}
                  onRunNewScan={() => {
                    setFile(null);
                    setResult(null);
                    setError(null);
                    setProgress(0);
                    if (inputRef.current) inputRef.current.value = "";
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                />
              </motion.div>
            ) : error ? (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-sm text-rose-200">
                <AlertTriangle className="h-6 w-6" />
                <span>{error}</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void runScan()}
                  className="border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
                No scan yet. Upload a file → start scan.
              </div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
