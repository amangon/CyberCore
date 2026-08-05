"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  FileDigit,
  Radar,
  ScanSearch,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { scanHash, getScanErrorMessage } from "@/services/scan.service";
import { exportScanCSV, exportScanJSON, exportScanPDF } from "@/lib/exportReport";
import type { ScanResult } from "@/types/security";
import ResultCard from "@/components/scan/ResultCard";

type HashType = "MD5" | "SHA-1" | "SHA-256";

const hashLengths: Record<HashType, number> = {
  MD5: 32,
  "SHA-1": 40,
  "SHA-256": 64,
};

const hashRegex: Record<HashType, RegExp> = {
  MD5: /^[a-f0-9]{32}$/i,
  "SHA-1": /^[a-f0-9]{40}$/i,
  "SHA-256": /^[a-f0-9]{64}$/i,
};

function isValidHash(hash: string, type: HashType): boolean {
  const v = hash.trim();
  return v.length === hashLengths[type] && hashRegex[type].test(v);
}

export default function HashScanner({ onScanComplete }: { onScanComplete?: () => void } = {}) {
  const [hashType, setHashType] = React.useState<HashType>("SHA-256");
  const [hash, setHash] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const onScan = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await scanHash(hash.trim(), hashType.toLowerCase().replace("-", "") as "md5" | "sha1" | "sha256");
      setResult(res);
      onScanComplete?.();
    } catch (err) {
      setError(getScanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const runNewScan = () => {
    setHash("");
    setResult(null);
    setError(null);
    setLoading(false);
    // Return focus to the input field.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const hashValid = isValidHash(hash, hashType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full max-w-5xl mx-auto"
    >
      <Card className="overflow-hidden border-white/10 bg-slate-950/70 text-white shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_30%),linear-gradient(to_bottom,rgba(15,23,42,0.9),rgba(2,6,23,0.96))]" />
        <CardHeader className="relative space-y-2">
          <div className="flex items-center gap-2 text-cyan-300">
            <ScanSearch className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.3em]">SentinelX AI</span>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-semibold">Hash Intelligence Scanner</CardTitle>
          <CardDescription className="max-w-2xl text-slate-300">
            Analyze file hashes against global malware databases.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative space-y-6">
          <div className="flex flex-wrap gap-2">
            {(["MD5", "SHA-1", "SHA-256"] as const).map((t) => (
              <Button
                key={t}
                variant={hashType === t ? "default" : "outline"}
                onClick={() => {
                  setHashType(t);
                  setResult(null);
                  setError(null);
                }}
                className={[
                  "rounded-full border px-4",
                  hashType === t
                    ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                ].join(" ")}
              >
                {t}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <FileDigit className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={hash}
                onChange={(e) => {
                  setHash(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={`Enter ${hashType} hash`}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                aria-label="Hash input"
              />
            </div>

            <Button
              onClick={onScan}
              disabled={loading || !hash.trim()}
              loading={loading}
              className="h-14 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-6 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              {loading ? "Analyzing..." : "Analyze Hash"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {!hash.trim() ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
              Enter a {hashType} hash above to begin analysis.
            </div>
          ) : hash.trim() && !hashValid && !loading ? (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Please enter a valid {hashType} hash ({hashLengths[hashType]} hexadecimal characters).
              </span>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6 shadow-[0_0_60px_rgba(34,211,238,0.08)]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12">
                    <motion.div
                      className="absolute inset-0 rounded-full border border-cyan-400/30"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-cyan-300/80 border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <Radar className="absolute inset-0 m-auto h-5 w-5 text-cyan-200" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">Threat Intelligence Lookup Running</div>
                    <div className="text-sm text-slate-300">AI analysis effect → malware DB, family match, and engine consensus.</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {["DB correlation", "Heuristic scan", "Engine consensus"].map((label, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12 }}
                      className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300"
                    >
                      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                      {label}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-sm text-rose-200"
              >
                <AlertTriangle className="h-6 w-6" />
                <span>{error}</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void onScan()}
                  className="border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                >
                  Retry
                </Button>
              </motion.div>
            ) : result ? (
              <ResultCard
                target={result.target}
                scanType="Hash Scan"
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
                onRunNewScan={runNewScan}
              />
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
