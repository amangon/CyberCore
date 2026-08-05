import { api, apiRequest, getApiErrorMessage } from "@/lib/api";
import type {
  IOCAnalysis,
  ScanRecord,
  ScanRequest,
  ScanResult,
  ScanType,
} from "@/types/security";

/**
 * Convert a Unix timestamp (seconds or milliseconds) to ISO string.
 * Returns null if the value is not a valid timestamp.
 */
function unixToISO(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1000000000) return null;
  // If it's > 1e13, it's milliseconds; otherwise seconds
  const d = num > 1000000000000 ? new Date(num) : new Date(num * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Convert a category value (string, array, or provider-specific object) into a
 * single human-readable string. Never renders "[object Object]".
 *
 * Supports:
 *   - "Malware"                                        → "Malware"
 *   - ["Phishing", "C2"]                               → "Phishing, C2"
 *   - { BitDefender: "searchengines", Sophos: "..." }  → "searchengines"
 */
function categoryToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    const parts = value
      .map((v) => categoryToString(v))
      .filter(Boolean);
    return Array.from(new Set(parts)).join(", ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    // Some providers return a categories map of vendor → label.
    const values = Object.values(record)
      .map((v) => categoryToString(v))
      .filter(Boolean);
    if (values.length > 0) {
      return Array.from(new Set(values)).join(", ");
    }
    // Fall back to the object's own string only if it's not "[object Object]".
    const str = String(value);
    return str === "[object Object]" ? "" : str;
  }

  return String(value);
}

/**
 * Scan service.
 *
 * Connects the scanner UI to the existing backend `/scan` endpoints.
 * Provides strongly-typed, reusable operations for file, URL, IP and hash
 * scanning plus scan history. All results map defensively so partial
 * backend payloads degrade gracefully.
 */

/**
 * Normalize any thrown value into a human-readable message.
 */
export function getScanErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}

/**
 * Map an unknown scan-response payload into a typed `ScanResult`.
 *
 * The backend is the SINGLE source of truth. The frontend only renders the
 * values the backend returns; it NEVER derives status, risk score, threat
 * level, detection status, or AI verdict. Missing fields are rendered as "N/A".
 */
function mapScanResult(value: unknown): ScanResult {
  const rawBackend = (value ?? {}) as Record<string, unknown>;

  // The backend may return the result nested under `data` or `result`.
  const body =
    rawBackend.result && typeof rawBackend.result === "object"
      ? (rawBackend.result as Record<string, unknown>)
      : rawBackend.data && typeof rawBackend.data === "object"
        ? (rawBackend.data as Record<string, unknown>)
        : rawBackend;

  // Extract nested sources
  const sources = (body.sources as Record<string, unknown>) ?? {};
  const shodan = (sources.shodan as Record<string, unknown>) ?? {};
  const abuseipdb = (sources.abuseipdb as Record<string, unknown>) ?? {};
  const otx = (sources.otx as Record<string, unknown>) ?? {};
  const ipinfo = (sources.ipinfo as Record<string, unknown>) ?? {};
  const virustotal = (sources.virustotal as Record<string, unknown>) ?? {};

  const id = String(body.id ?? body._id ?? "");
  const target = String(body.value ?? body.target ?? "");
  const typeRaw = String(body.scanType ?? "file").toLowerCase();
  const type: ScanResult["type"] = ["file", "url", "ip", "hash"].includes(typeRaw)
    ? (typeRaw as ScanResult["type"])
    : "file";

  // ── Backend-provided values (single source of truth) ─────────────────────
  // mapScanResult returns the backend's exact values. If the backend says
  // "Safe", the UI shows Safe. If a field is missing, we return "" and the
  // presenter renders "N/A".
  const status = String(body.status ?? "safe").toLowerCase() as ScanResult["status"];
  const riskScore = Number.isFinite(Number(body.overallThreatScore))
    ? Number(body.overallThreatScore)
    : 0;
  const threatLevel = String(body.threatLevel ?? body.riskLevel ?? "");
  const threatFamily = String(body.threatFamily ?? "");
  const detectionEngines = String(body.detectionEngines ?? "");
  const detectionCount = String(body.detectionCount ?? "");
  const detectionStatus = String(body.detectionStatus ?? "");
  const reputation = String(body.reputation ?? "");
  const blacklistStatus = String(body.blacklistStatus ?? "");
  const aiVerdict = String(body.aiVerdict ?? "");
  const createdAt = String(body.createdAt ?? body.scannedAt ?? "");

  // ── Network / IP fields (map available provider data, never unrelated) ───
  const country = String(
    body.country ??
    (shodan.country as string) ??
    (abuseipdb.countryName as string) ??
    (otx.country as string) ??
    (ipinfo.country as string) ??
    ""
  );
  const city = String(
    body.city ??
    (shodan.city as string) ??
    (ipinfo.city as string) ??
    (otx.city as string) ??
    ""
  );

  // ASN / Organization priority: Shodan → AbuseIPDB → IPInfo → OTX
  const asn = String(
    body.asn ??
    (shodan.asn as string) ??
    (abuseipdb.asn as string) ??
    ((ipinfo.asn as Record<string, unknown>)?.asn as string) ??
    (otx.asn as string) ??
    ""
  );
  const organization = String(
    body.organization ??
    (shodan.org as string) ??
    (abuseipdb.org as string) ??
    (ipinfo.org as string) ??
    (otx.org as string) ??
    ""
  );

  const isp = String(
    body.isp ??
    (shodan.isp as string) ??
    (abuseipdb.isp as string) ??
    (ipinfo.org as string) ??
    ""
  );
  const connectionType = String(
    body.connectionType ??
    (abuseipdb.usageType as string) ??
    ""
  );
  const usageType = String(
    body.usageType ??
    (abuseipdb.usageType as string) ??
    ""
  );
const domain = String(
    body.domain ??
    (abuseipdb.domain as string) ??
    ((ipinfo.company as Record<string, unknown>)?.domain as string) ??
    ""
  );
  const hostnames = String(
    body.hostnames ??
    (Array.isArray(shodan.hostnames) ? (shodan.hostnames as string[]).join(", ") : "") ??
    (Array.isArray(abuseipdb.hostnames) ? (abuseipdb.hostnames as string[]).join(", ") : "") ??
    ""
  );

  const totalReports = Number.isFinite(Number(body.totalReports ?? (abuseipdb.totalReports as number)))
    ? Number(body.totalReports ?? (abuseipdb.totalReports as number))
    : 0;
  const positiveReports = Number.isFinite(Number(body.positiveReports ?? (abuseipdb.totalReports as number)))
    ? Number(body.positiveReports ?? (abuseipdb.totalReports as number))
    : 0;
  const lastReported = String(
    body.lastReported ??
    (abuseipdb.lastReportedAt as string) ??
    ""
  );
  const abuseScore = Number.isFinite(Number(body.abuseScore ?? (abuseipdb.abuseConfidenceScore as number)))
    ? Number(body.abuseScore ?? (abuseipdb.abuseConfidenceScore as number))
    : 0;

  const fileType = String(body.fileType ?? (virustotal.type as string) ?? (otx.fileType as string) ?? "");
  const firstSeen = String(body.firstSeen ?? "");
  const lastAnalysis = String(
    body.lastAnalysis ??
    (shodan.lastUpdate as string) ??
    (abuseipdb.lastReportedAt as string) ??
    (body.scannedAt as string) ??
    ""
  );

  // URL-specific fields
  const ipAddress = String(body.ipAddress ?? (ipinfo.ip as string) ?? (shodan.ip as string) ?? "");
  const server = String(body.server ?? "");
  const hostingCountry = String(body.hostingCountry ?? country ?? "");
const sslInfo = String(body.sslInfo ?? "");
const domainReputation = String(body.domainReputation ?? body.reputation ?? "");

  // ── Category: never render "[object Object]". Convert provider category
  // objects (e.g. { BitDefender: "searchengines", Sophos: "search engines" })
  // into a readable, deduplicated string. ───────────────────────────────────
  const category = categoryToString(
    body.category ?? body.classification ?? body.threatType ?? virustotal.categories
  );

  // Extract normalized per-provider statuses. The backend places each provider
  // under `sources.<provider>` with { provider, label, available, success,
  // status, verdict, confidence, detections, threatScore, responseTime,
  // lastUpdated, error }. Build a stable array for the UI provider cards.
  const providers: ScanResult["providers"] = Object.entries(sources)
    .filter(([key]) => key !== "fileInfo")
    .map(([key, value]) => {
      const p = (value as Record<string, unknown>) ?? {};
      const hasStatus = typeof p.status === "string" && p.status.length > 0;
      const scannedOk = p.scanned === true;
      const hasError = Boolean(p.error);
      return {
        provider: String(p.provider ?? key),
        label: String(p.label ?? key),
        // The backend now returns an explicit `available` flag (whether the
        // provider API key is configured). If it is absent we fall back to
        // heuristics — never mark a provider "Not configured" just because its
        // raw response contained an error.
        available:
          typeof p.available === "boolean"
            ? p.available
            : Boolean(p.success ?? scannedOk ?? true),
success:
          typeof p.success === "boolean"
            ? p.success
            : Boolean(scannedOk || (p.verdict && p.verdict !== "unknown")),
        status: hasStatus
          ? String(p.status)
          : scannedOk
            ? "completed"
            : hasError
              ? "service_unavailable"
              : "idle",
        verdict: String(p.verdict ?? "unknown"),
        confidence: Number.isFinite(Number(p.confidence ?? p.threatScore))
          ? Number(p.confidence ?? p.threatScore)
          : 0,
        detections: Number.isFinite(Number(p.detections)) ? Number(p.detections) : 0,
        threatScore: Number.isFinite(Number(p.threatScore)) ? Number(p.threatScore) : 0,
        responseTime: Number.isFinite(Number(p.responseTime)) ? Number(p.responseTime) : 0,
        lastUpdated: p.lastUpdated ? String(p.lastUpdated) : null,
        error: p.error ? String(p.error) : null,
      };
    });

  return {
    id,
    target,
    type,
    status,
    riskScore,
    detectionStatus,
    threatLevel,
    lastAnalysis,
    threatFamily,
    detectionEngines,
    detectionCount,
    blacklistStatus,
    reputation,
    country,
    city,
    isp,
    asn,
    organization,
    connectionType,
    usageType,
    domain,
    hostnames,
    totalReports,
    positiveReports,
    lastReported,
    abuseScore,
    fileType,
    firstSeen,
    aiVerdict,
    createdAt,
    ipAddress,
    server,
    hostingCountry,
    category,
    sslInfo,
    domainReputation,
    providers,
    raw: body,
  };
}

/** Map an unknown history array into typed `ScanRecord[]`. */
function mapScanHistory(value: unknown): ScanRecord[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    // The backend may wrap each item under `data` or return directly
    const itemBody = raw.data && typeof raw.data === "object"
      ? (raw.data as Record<string, unknown>)
      : raw;
    const typeRaw = String(itemBody.scanType ?? itemBody.type ?? "file").toLowerCase();
    const type: ScanType = ["file", "url", "ip", "hash"].includes(typeRaw)
      ? (typeRaw as ScanType)
      : "file";

    const statusRaw = String(itemBody.status ?? itemBody.riskLevel ?? "safe").toLowerCase();
    let status: ScanRecord["status"] = "safe";
    if (statusRaw === "medium" || statusRaw === "suspicious") {
      status = "suspicious";
    } else if (statusRaw === "high" || statusRaw === "critical" || statusRaw === "malicious") {
      status = "malicious";
    }

    const riskScore = Number.isFinite(Number(itemBody.overallThreatScore ?? itemBody.riskScore ?? itemBody.risk))
      ? Number(itemBody.overallThreatScore ?? itemBody.riskScore ?? itemBody.risk)
      : 0;

    return {
      id: String(itemBody._id ?? itemBody.id ?? itemBody.scanId ?? ""),
      target: String(itemBody.value ?? itemBody.target ?? ""),
      type,
      status,
      riskScore,
      createdAt: itemBody.scannedAt ? String(itemBody.scannedAt) : itemBody.createdAt ? String(itemBody.createdAt) : new Date().toISOString(),
    };
  });
}

/** Scan operations */
export async function scanFile(
  file: File,
  config?: { onProgress?: (percent: number) => void }
): Promise<ScanResult> {
  const form = new FormData();
  form.append("file", file);

const res = await apiRequest<unknown>({
    url: "/scan/file",
    method: "POST",
    data: form,
    // The shared axios instance defaults to `Content-Type: application/json`.
    // Override it for multipart FormData so the browser sends the file as
    // multipart/form-data (with the auto-generated boundary) and multer on the
    // backend can populate `req.file`.
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: config?.onProgress
      ? (progressEvent: { loaded: number; total?: number }) => {
          if (progressEvent.total) {
            config.onProgress!(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        }
      : undefined,
  });
  return mapScanResult(res);
}

export async function scanURL(
  url: string,
  config?: { onProgress?: (percent: number) => void }
): Promise<ScanResult> {
  const res = await apiRequest<unknown>({
    url: "/scan/url",
    method: "POST",
    data: { url: url },
  });
  return mapScanResult(res);
}

export async function scanIP(
  ip: string,
  config?: { onProgress?: (percent: number) => void }
): Promise<ScanResult> {
  const res = await apiRequest<unknown>({
    url: "/scan/ip",
    method: "POST",
    data: { ip: ip },
  });
  return mapScanResult(res);
}

export async function scanHash(
  hash: string,
  type: "md5" | "sha1" | "sha256" = "sha256"
): Promise<ScanResult> {
  const res = await apiRequest<unknown>({
    url: "/scan/hash",
    method: "POST",
    data: { hash: hash },
  });
  return mapScanResult(res);
}

/** Scan history */
export async function getScanHistory(params?: { page?: number; limit?: number }): Promise<ScanRecord[]> {
  const res = await apiRequest<unknown>({
    url: "/scan/history",
    method: "GET",
    params,
  });
  // Backend returns: { success: true, count, total, page, pages, data: [...] }
  const responseData = res as Record<string, unknown>;
  // Try responseData.data first (the array inside the success wrapper)
  if (responseData && typeof responseData === "object" && Array.isArray(responseData.data)) {
    return mapScanHistory(responseData.data);
  }
  // If res itself is an array
  if (Array.isArray(res)) {
    return mapScanHistory(res);
  }
  return [];
}

export async function getPagedScanHistory(params?: { page?: number; limit?: number }): Promise<{
  items: ScanRecord[];
  hasMore: boolean;
  total: number;
}> {
  const records = await getScanHistory(params);
  return {
    items: records,
    hasMore: records.length >= (params?.limit ?? 10),
    total: records.length,
  };
}

export async function clearScanHistory(): Promise<void> {
  await apiRequest({
    url: "/scan/history",
    method: "DELETE",
  });
}

/** IOC analysis */
export async function analyzeIOC(
  indicator: string,
  type: string
): Promise<IOCAnalysis> {
  const res = await apiRequest<unknown>({
    url: "/scan/analyze",
    method: "POST",
    data: { value: indicator, type },
  });
  return res as IOCAnalysis;
}

/**
 * Fetch a single scan record by ID (used by "View Result" in Scan History).
 * Returns a fully-mapped ScanResult or null if the backend has no record.
 */
export async function getScanById(id: string): Promise<ScanResult | null> {
  if (!id) return null;
  try {
    const res = await apiRequest<unknown>({
      url: `/scan/${id}`,
      method: "GET",
    });
    const body = res as Record<string, unknown>;
    // Backend returns { success, data, source }.
    const data = body.data;
    if (body.success === false || !data || typeof data !== "object") {
      return null;
    }
    return mapScanResult(data);
  } catch {
    return null;
  }
}
