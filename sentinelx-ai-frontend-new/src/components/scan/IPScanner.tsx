"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Globe,
  Radar,
  ScanSearch,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { scanIP, getScanErrorMessage } from "@/services/scan.service";
import { exportScanCSV, exportScanJSON, exportScanPDF } from "@/lib/exportReport";
import type { ScanResult } from "@/types/security";
import ResultCard from "@/components/scan/ResultCard";

function isValidIP(ip: string): boolean {
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

export default function IPScanner({ onScanComplete }: { onScanComplete?: () => void } = {}) {
  const [ip, setIp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const onScan = async () => {
    if (!ip.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await scanIP(ip.trim());
      setResult(res);
      onScanComplete?.();
    } catch (err) {
      setError(getScanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const runNewScan = () => {
    setIp("");
    setResult(null);
    setError(null);
    setLoading(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

const ipValid = isValidIP(ip);

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
          <CardTitle className="text-2xl md:text-3xl font-semibold">IP Intelligence Scanner</CardTitle>
          <CardDescription className="max-w-2xl text-slate-300">
            Analyze IP addresses for threats, geolocation, and reputation.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIp("");
                setResult(null);
                setError(null);
              }}
              className="rounded-full border px-4 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            >
              Clear
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={ip}
                onChange={(e) => {
                  setIp(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter IP address"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                aria-label="IP address input"
              />
            </div>

            <Button
              onClick={onScan}
              disabled={loading || !ip.trim()}
              loading={loading}
              className="h-14 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-6 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              {loading ? "Analyzing..." : "Analyze IP"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {!ip.trim() ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
              Enter an IP address above to begin analysis.
            </div>
          ) : ip.trim() && !ipValid && !loading ? (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Please enter a valid IPv4 or IPv6 address.
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
                    <div className="text-sm text-slate-300">AI analysis effect → threat intelligence feeds, geolocation, and reputation analysis.</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {["Threat Intel", "Geolocation", "Reputation"].map((label, i) => (
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
                scanType="IP Scan"
                status={result.status}
                riskScore={result.riskScore}
                aiVerdict={result.aiVerdict}
                threatLevel={result.threatLevel}
                detectionStatus={result.detectionStatus}
                analysisTime={result.createdAt}
                detectionEngines={result.detectionEngines}
                threatFamily={result.threatFamily}
                blacklistStatus={result.blacklistStatus}
                reputation={result.reputation}
                lastAnalysis={result.lastAnalysis}
                country={result.country}
                city={result.city}
                isp={result.isp}
                asn={result.asn}
                organization={result.organization}
                connectionType={result.connectionType}
                usageType={result.usageType}
                domain={result.domain}
                hostnames={result.hostnames}
                totalReports={result.totalReports}
                positiveReports={result.positiveReports}
lastReported={result.lastReported}
                abuseScore={result.abuseScore}
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
