'use client';

import { useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, FileDown, PlusCircle, Globe2, Building2, Radar, Clock3, Sparkles, Loader2, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useIOCStore } from '@/store';
import type { IOCInvestigation } from '@/services/ioc.service';

type ThreatLevel = 'Safe' | 'Suspicious' | 'Malicious' | 'Low' | 'Critical';
type IOCType = 'IP Address' | 'Domain' | 'URL' | 'Hash';

type IOCResultData = {
  indicator: string;
  type: IOCType;
  riskScore: number;
  threatLevel: ThreatLevel;
  reputation: string;
  country: string;
  isp: string;
  blacklist: string;
  reports: number;
  detection: string;
  categories: string[];
  sources: string[];
  firstSeen: string;
  lastSeen: string;
  analysisDate: string;
};

const threatClasses: Record<ThreatLevel, string> = {
  Safe: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  Suspicious: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  Malicious: 'border-red-500/40 bg-red-500/10 text-red-300',
  Low: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  Critical: 'border-red-500/40 bg-red-500/10 text-red-300',
};

const widthFromRisk = (risk: number) => `${Math.min(100, Math.max(0, risk))}%`;

function toThreatLevel(verdict: string, riskScore: number): ThreatLevel {
  const v = verdict.toLowerCase();
  if (v === 'malicious') return riskScore >= 85 ? 'Critical' : 'Malicious';
  if (v === 'suspicious') return 'Suspicious';
  return riskScore >= 70 ? 'Malicious' : 'Low';
}

function toDisplayType(type: string): IOCType {
  const t = type.toLowerCase();
  if (t === 'domain') return 'Domain';
  if (t === 'url') return 'URL';
  if (t === 'hash') return 'Hash';
  return 'IP Address';
}

function formatTimestamp(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toUTCString().replace('GMT', 'UTC');
}

// ─── Export helpers ──────────────────────────────────────────────────────────

function buildReportData(inv: IOCInvestigation) {
  return {
    indicator: inv.indicator,
    type: inv.type,
    verdict: inv.verdict,
    riskScore: inv.riskScore,
    threatLevel: inv.threatLevel,
    confidence: inv.confidence,
    reputation: inv.reputation,
    country: inv.country,
    isp: inv.isp,
    blacklistStatus: inv.blacklistStatus,
    reports: inv.reports,
    firstSeen: inv.firstSeen,
    lastSeen: inv.lastSeen,
    analysisDate: inv.lastUpdated,
    detectionRatio: inv.detectionRatio,
    categories: [...inv.categories],
    sources: [...inv.sources],
    dns: inv.dns.map((d) => ({ type: d.type, value: d.value, ttl: d.ttl })),
    whois: { ...inv.whois },
    ipIntelligence: { ...inv.ipIntelligence },
    security: inv.security.map((s) => ({ name: s.name, status: s.status, score: s.score, lastChecked: s.lastChecked })),
    recommendations: inv.recommendations.map((r) => r.text),
    exportedAt: new Date().toISOString(),
  };
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
}

function exportJSON(inv: IOCInvestigation) {
  const data = buildReportData(inv);
  downloadFile(
    `ioc-report-${sanitizeFilename(inv.indicator)}.json`,
    JSON.stringify(data, null, 2),
    'application/json',
  );
}

function exportCSV(inv: IOCInvestigation) {
  const rows: [string, string][] = [
    ['Indicator', inv.indicator],
    ['Type', inv.type],
    ['Verdict', inv.verdict],
    ['Risk Score', String(inv.riskScore)],
    ['Threat Level', inv.threatLevel],
    ['Confidence', String(inv.confidence)],
    ['Reputation', inv.reputation],
    ['Country', inv.country],
    ['ISP', inv.isp],
    ['Blacklist Status', inv.blacklistStatus],
    ['Reports', String(inv.reports)],
    ['First Seen', inv.firstSeen],
    ['Last Seen', inv.lastSeen],
    ['Analysis Date', inv.lastUpdated],
    ['Detection', inv.detectionRatio],
    ['Categories', inv.categories.join('; ')],
    ['Threat Sources', inv.sources.join('; ')],
    ['DNS Records', inv.dns.map((d) => `${d.type}:${d.value}`).join('; ')],
    ['WHOIS Registrar', inv.whois.registrar ?? ''],
    ['WHOIS Registered', inv.whois.registrationDate ?? ''],
    ['WHOIS Expiry', inv.whois.expiryDate ?? ''],
  ];
  const csv = rows
    .map(([k, v]) => `"${String(k).replace(/"/g, '""')}","${String(v).replace(/"/g, '""')}"`)
    .join('\n');
  downloadFile(`ioc-report-${sanitizeFilename(inv.indicator)}.csv`, csv, 'text/csv');
}

function createSimplePdf(lines: string[]): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const content = lines
    .map((line, i) => `BT /F1 10 Tf 50 ${740 - i * 16} Td (${esc(line.slice(0, 100))}) Tj ET`)
    .join('\n');

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

function exportPDF(inv: IOCInvestigation) {
  const lines = [
    'SentinelX AI - IOC Investigation Report',
    '======================================',
    `Indicator: ${inv.indicator}`,
    `Type: ${inv.type}`,
    `Verdict: ${inv.verdict}`,
    `Risk Score: ${inv.riskScore}/100`,
    `Threat Level: ${inv.threatLevel}`,
    `Confidence: ${inv.confidence}`,
    `Reputation: ${inv.reputation}`,
    `Country: ${inv.country || 'N/A'}`,
    `ISP: ${inv.isp || 'N/A'}`,
    `Blacklist Status: ${inv.blacklistStatus || 'N/A'}`,
    `Reports: ${inv.reports}`,
    `First Seen: ${inv.firstSeen || 'N/A'}`,
    `Last Seen: ${inv.lastSeen || 'N/A'}`,
    `Analysis Date: ${inv.lastUpdated || 'N/A'}`,
    `Detection: ${inv.detectionRatio || 'N/A'}`,
    `Categories: ${inv.categories.join(', ') || 'N/A'}`,
    `Threat Sources: ${inv.sources.join(', ') || 'N/A'}`,
    `DNS: ${inv.dns.map((d) => `${d.type}: ${d.value}`).join(' | ') || 'N/A'}`,
    `WHOIS Registrar: ${inv.whois.registrar || 'N/A'}`,
    `WHOIS Registered: ${inv.whois.registrationDate || 'N/A'}`,
    `WHOIS Expiry: ${inv.whois.expiryDate || 'N/A'}`,
    `Exported: ${new Date().toISOString()}`,
  ];
  const pdf = createSimplePdf(lines);
  downloadFile(`ioc-report-${sanitizeFilename(inv.indicator)}.pdf`, pdf, 'application/pdf');
}

export default function IOCResult() {
  const { investigation, loading, error, analyzed, reset, clearError } = useIOCStore();

  const data = useMemo<IOCResultData | null>(() => {
    if (!investigation) return null;
    const inv = investigation;
    return {
      indicator: inv.indicator || '—',
      type: toDisplayType(inv.type),
      riskScore: Math.min(100, Math.max(0, inv.riskScore)),
      threatLevel: toThreatLevel(inv.verdict, inv.riskScore),
      reputation: inv.reputation || 'Unknown',
      country: inv.country || '—',
      isp: inv.isp || '—',
      blacklist: inv.blacklistStatus || 'Not Listed',
      reports: inv.reports,
      detection: inv.detectionRatio || (inv.verdict === 'clean' ? 'Clean' : 'Detected'),
      categories: [...(inv.categories.length > 0 ? inv.categories : inv.tags.length > 0 ? inv.tags : [])],
      sources: [...(inv.sources.length > 0 ? inv.sources : ['VirusTotal', 'AbuseIPDB', 'OTX'])],
      firstSeen: formatTimestamp(inv.firstSeen),
      lastSeen: formatTimestamp(inv.lastSeen),
      analysisDate: formatTimestamp(inv.lastUpdated),
    };
  }, [investigation]);

  const handleNewInvestigation = () => {
    clearError();
    reset();
  };

  return (
    <Card className="border-white/10 bg-slate-950/70 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10">
        <CardTitle className="text-2xl font-semibold tracking-tight text-white">
          IOC Investigation Result
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-slate-300">
          Detailed threat intelligence for analyzed indicators.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <AnimatePresence mode="wait">
          {!analyzed ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-lg font-medium text-white">No IOC analyzed yet</p>
              <p className="mt-2 text-sm text-slate-400">Run a search to populate threat intelligence.</p>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="h-5 w-2/5 animate-pulse rounded bg-white/10" />
              <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center"
            >
              <ShieldAlert className="h-8 w-8 text-rose-300" />
              <p className="text-sm text-rose-200">{error}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearError();
                  reset();
                }}
                className="border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </motion.div>
          ) : data ? (
            <motion.div
              key={data.indicator}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Detail label="Indicator" value={data.indicator} />
                <Detail label="Type" value={data.type} />
                <Detail label="Risk Score" value={`${data.riskScore}%`} />
                <Detail label="Reputation" value={data.reputation} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Risk Visualization
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">Score + threat posture</p>
                  </div>
                  <Badge className={`border ${threatClasses[data.threatLevel]}`}>{data.threatLevel}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className={`h-full rounded-full ${
                        data.riskScore < 25
                          ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                          : data.riskScore < 70
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                            : 'bg-gradient-to-r from-red-500 to-fuchsia-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: widthFromRisk(data.riskScore) }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">Safe</Badge>
                    <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-200">Suspicious</Badge>
                    <Badge className="border-red-500/30 bg-red-500/10 text-red-200">Malicious</Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Security Details
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Meta icon={Globe2} label="Country" value={data.country} />
                    <Meta icon={Building2} label="ISP" value={data.isp} />
                    <Meta icon={ShieldCheck} label="Blacklist" value={data.blacklist} />
                    <Meta icon={ShieldAlert} label="Reports" value={`${data.reports}`} />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Intelligence
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Meta icon={Radar} label="Threat Sources" value={data.sources.join(', ')} />
                    <Meta icon={Clock3} label="Last Seen" value={data.lastSeen} />
                    <Meta icon={Clock3} label="First Seen" value={data.firstSeen} />
                    <Meta icon={Clock3} label="Analysis Date" value={data.analysisDate} />
                  </div>
                </motion.div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Detection Summary
                  </h3>
                  <Badge className={`border ${threatClasses[data.threatLevel]}`}>{data.detection || 'Clean'}</Badge>
                </div>

                {data.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.categories.map((c) => (
                      <Badge key={c} className="border border-violet-500/30 bg-violet-500/10 text-violet-200">
                        {c}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No threat categories detected.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative inline-flex">
                  <Button
                    onClick={() => {
                      if (investigation) exportJSON(investigation);
                    }}
                    className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleNewInvestigation}
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Investigation
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (investigation) exportCSV(investigation);
                  }}
                  className="border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
                >
                  Export CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (investigation) exportPDF(investigation);
                  }}
                  className="border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
                >
                  Export PDF
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 p-8 text-sm text-slate-400"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for investigation...
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="min-w-0 max-w-full w-full rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <p className="truncate text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 min-w-0 break-words text-sm font-medium text-white">{value}</p>
    </motion.div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/50 p-3">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
        <span className="truncate text-xs uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="min-w-0 break-words text-sm text-white">{value}</p>
    </div>
  );
}

