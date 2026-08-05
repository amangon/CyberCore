/**
 * Shared report export utilities (JSON / CSV / PDF).
 *
 * Builds a normalized report from the scan result currently displayed in the
 * UI and downloads it. Used by File / URL / IP / Hash scanners and the shared
 * ResultCard "Export Report" button.
 */
import type { ScanResult } from "@/types/security";

/** Normalized display value — "N/A" when missing/empty. */
function dv(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  const s = String(value).trim();
  if (!s || s === "0" || s === "0%" || s === "0/0") return "N/A";
  return s;
}

function scanTypeLabel(type: string): string {
  const t = String(type).toLowerCase();
  if (t === "file") return "File Scan";
  if (t === "url") return "URL Scan";
  if (t === "ip") return "IP Scan";
  if (t === "hash") return "Hash Scan";
  return "Scan";
}

/** Build a flattened, serializable report payload from the current result. */
export function buildScanReportData(result: ScanResult): Record<string, unknown> {
  return {
    Target: dv(result.target),
    "Scan Type": scanTypeLabel(result.type),
    "Risk Score": dv(result.riskScore !== undefined ? `${result.riskScore}%` : ""),
    "Threat Level": dv(result.threatLevel),
    "Detection Status": dv(result.detectionStatus),
    "Threat Family": dv(result.threatFamily),
    "Detection Engines": dv(result.detectionEngines),
    "Detection Count": dv(result.detectionCount),
    "Blacklist Status": dv(result.blacklistStatus),
    "Reputation": dv(result.reputation),
    "AI Verdict": dv(result.aiVerdict),
    Country: dv(result.country),
    City: dv(result.city),
    ASN: dv(result.asn),
    Organization: dv(result.organization),
    ISP: dv(result.isp),
    "Connection Type": dv(result.connectionType),
    "Usage Type": dv(result.usageType),
    Domain: dv(result.domain),
    Hostnames: dv(result.hostnames),
    "Abuse Score": dv(result.abuseScore !== undefined ? `${result.abuseScore}%` : ""),
    "Total Reports": dv(result.totalReports ?? ""),
    "Positive Reports": dv(result.positiveReports ?? ""),
    "Last Reported": dv(result.lastReported),
    "Last Analysis": dv(result.lastAnalysis),
    "First Seen": dv(result.firstSeen),
    "IP Address": dv(result.ipAddress),
    Server: dv(result.server),
    "Hosting Country": dv(result.hostingCountry),
    Category: dv(result.category),
    "SSL Info": dv(result.sslInfo),
    "Analysis Time": dv(result.createdAt),
    "Exported At": new Date().toISOString(),
  };
}

/** Quote a CSV field safely. */
function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

// ─── JSON ────────────────────────────────────────────────────────────────────

export function exportScanJSON(result: ScanResult): void {
  const data = buildScanReportData(result);
  downloadFile(
    `scan-report-${sanitize(result.target || "result")}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

export function exportScanCSV(result: ScanResult): void {
  const data = buildScanReportData(result);
  const headers = Object.keys(data);
  const rows = headers.map((h) => [h, csvCell(data[h])]);
  const csv = rows.map((r) => r.join(",")).join("\n");
  downloadFile(
    `scan-report-${sanitize(result.target || "result")}.csv`,
    csv,
    "text/csv",
  );
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

const escPDF = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/**
 * Build a minimal, dependency-free single-page PDF from text lines.
 */
function createSimplePdf(lines: string[]): string {
  const content = lines
    .map((line, i) => `BT /F1 10 Tf 50 ${760 - i * 16} Td (${escPDF(line.slice(0, 110))}) Tj ET`)
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

export function exportScanPDF(result: ScanResult): void {
  const data = buildScanReportData(result);
  const lines = [
    "SentinelX AI - Security Scan Report",
    "==================================",
    ...Object.entries(data).map(([k, v]) => `${k}: ${String(v)}`),
    "==================================",
    `Generated: ${new Date().toLocaleString()}`,
  ];
  const pdf = createSimplePdf(lines);
  downloadFile(
    `scan-report-${sanitize(result.target || "result")}.pdf`,
    pdf,
    "application/pdf",
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60) || "result";
}

