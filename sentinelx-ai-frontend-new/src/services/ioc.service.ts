import { apiRequest, getApiErrorMessage } from "@/lib/api";
import type { IOCType } from "@/types/security";

/**
 * IOC Investigation service.
 *
 * Connects the IOC Investigation Center UI to the existing backend
 * IOC analysis endpoint(s). Supports IP addresses, domains, URLs and
 * file hashes. All responses are mapped defensively so partial backend
 * payloads degrade gracefully (missing fields are hidden, never faked).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type IOCVerdict = "clean" | "suspicious" | "malicious";

export interface IOCDNSRecord {
  readonly type: string;
  readonly value: string;
  readonly ttl?: number;
  readonly status?: string;
  readonly lastUpdated?: string;
}

export interface IOCWHOISData {
  readonly domain?: string;
  readonly registrar?: string;
  readonly registrationDate?: string;
  readonly expiryDate?: string;
  readonly updatedDate?: string;
  readonly nameservers?: readonly string[];
  readonly registrant?: string;
  readonly organization?: string;
  readonly country?: string;
  readonly status?: string;
  readonly privacyProtection?: string;
  readonly domainAge?: string;
  readonly timeline?: readonly { readonly label: string; readonly value: string }[];
}

export interface IOCIPIntelligence {
  readonly country?: string;
  readonly region?: string;
  readonly city?: string;
  readonly asn?: string;
  readonly isp?: string;
  readonly organization?: string;
  readonly hosting?: boolean;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface IOCSecuritySource {
  readonly name: string;
  readonly status: string;
  readonly score?: number;
  readonly lastChecked?: string;
  readonly details?: string;
}

export interface IOCRecommendation {
  readonly text: string;
  readonly action?: string;
}

export interface IOCInvestigation {
  readonly indicator: string;
  readonly type: IOCType;
  readonly verdict: IOCVerdict;
  readonly riskScore: number;
  readonly threatLevel: string;
  readonly confidence: number;
  readonly reputation: string;
  readonly blacklistStatus: string;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
  readonly detectionRatio: string;
  readonly firstSeen: string;
  readonly lastSeen: string;
  readonly lastUpdated: string;
  readonly country: string;
  readonly isp: string;
  readonly reports: number;
  readonly sources: readonly string[];
  readonly whois: IOCWHOISData;
  readonly dns: readonly IOCDNSRecord[];
  readonly ipIntelligence: IOCIPIntelligence;
  readonly security: readonly IOCSecuritySource[];
  readonly recommendations: readonly IOCRecommendation[];
  readonly suggestedActions: readonly string[];
}

// ─── Error helper ─────────────────────────────────────────────────────────────

/** Normalize any thrown value into a human-readable message. */
export function getIOCErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}

// ─── Normalization helpers ────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown): string[] {
  return asArray(value).map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
}

function pickString(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const val = record[key];
    if (val !== null && val !== undefined && String(val).trim() !== "") return String(val);
  }
  return fallback;
}

function pickNumber(record: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const val = record[key];
    const num = Number(val);
    if (val !== null && val !== undefined && Number.isFinite(num)) return num;
  }
  return fallback;
}

function toVerdict(value: unknown): IOCVerdict {
  const v = String(value ?? "").toLowerCase();
  if (v === "clean" || v === "safe" || v === "trusted") return "clean";
  if (v === "suspicious" || v === "unknown" || v === "watchlist" || v === "watchlisted") return "suspicious";
  return "malicious";
}

function normalizeType(value: unknown, fallback: IOCType): IOCType {
  const v = String(value ?? "").toLowerCase();
  if (v === "ip" || v === "ipv4" || v === "ipv6") return "ip";
  if (v === "domain") return "domain";
  if (v === "url") return "url";
  if (v === "hash" || v === "md5" || v === "sha1" || v === "sha256") return "hash";
  return fallback;
}

// ─── Response mappers ─────────────────────────────────────────────────────────

function mapDNSRecords(value: unknown): IOCDNSRecord[] {
  return asArray(value)
    .map((item) => {
      const raw = asRecord(item);
      return {
        type: pickString(raw, ["type", "recordType"], "A"),
        value: pickString(raw, ["value", "data", "content"]),
        ttl: pickNumber(raw, ["ttl"], 0) || undefined,
        status: pickString(raw, ["status"]),
        lastUpdated: pickString(raw, ["lastUpdated", "last_updated", "checkedAt"]),
      };
    })
    .filter((record) => record.value.length > 0);
}

function mapWHOIS(value: unknown): IOCWHOISData {
  const raw = asRecord(value);
  if (Object.keys(raw).length === 0) return {};

  const nameservers = asStringArray(raw.nameservers ?? raw.nameServers ?? raw.ns ?? raw.name_servers);
  const timeline = asArray(raw.timeline ?? []).map((item) => {
    const row = asRecord(item);
    return {
      label: pickString(row, ["label", "key"]),
      value: pickString(row, ["value", "date"]),
    };
  });

  return {
    domain: pickString(raw, ["domain", "domainName"]),
    registrar: pickString(raw, ["registrar", "registrarName"]),
    registrationDate: pickString(raw, ["registrationDate", "created", "createdDate", "registered"]),
    expiryDate: pickString(raw, ["expiryDate", "expires", "expirationDate", "registryExpiryDate"]),
    updatedDate: pickString(raw, ["updatedDate", "updated", "lastUpdated"]),
    nameservers,
    registrant: pickString(raw, ["registrant", "registrantName"]),
    organization: pickString(raw, ["organization", "org", "registrantOrganization"]),
    country: pickString(raw, ["country", "registrantCountry"]),
    status: pickString(raw, ["status", "domainStatus"]),
    privacyProtection: pickString(raw, ["privacyProtection", "privacy"]),
    domainAge: pickString(raw, ["domainAge", "age"]),
    timeline: timeline.length > 0 ? timeline : undefined,
  };
}

function mapIPIntelligence(value: unknown): IOCIPIntelligence {
  const raw = asRecord(value);
  if (Object.keys(raw).length === 0) return {};
  return {
    country: pickString(raw, ["country", "countryName"]),
    region: pickString(raw, ["region", "regionName", "state"]),
    city: pickString(raw, ["city"]),
    asn: pickString(raw, ["asn", "as_number"]),
    isp: pickString(raw, ["isp", "internetServiceProvider"]),
    organization: pickString(raw, ["organization", "org"]),
    hosting: raw.hosting !== undefined ? Boolean(raw.hosting) : undefined,
    latitude: pickNumber(raw, ["latitude", "lat"]) || undefined,
    longitude: pickNumber(raw, ["longitude", "lon"]) || undefined,
  };
}

function mapSecuritySources(value: unknown): IOCSecuritySource[] {
  return asArray(value).map((item) => {
    const raw = asRecord(item);
    const name = pickString(raw, ["name", "source", "provider"], "Security Source");
    return {
      name,
      status: pickString(raw, ["status", "verdict", "detection"], "No data"),
      score: pickNumber(raw, ["score", "confidence", "reputation"], 0) || undefined,
      lastChecked: pickString(raw, ["lastChecked", "last_checked", "queriedAt"]),
      details: pickString(raw, ["details", "description", "message"]),
    };
  });
}

function mapRecommendations(value: unknown): IOCRecommendation[] {
  return asArray(value).map((item) => {
    if (typeof item === "string") return { text: item };
    const raw = asRecord(item);
    return {
      text: pickString(raw, ["text", "recommendation", "message", "title"]),
      action: pickString(raw, ["action", "type"]),
    };
  });
}

// ─── Main response mapper ─────────────────────────────────────────────────────

function mapInvestigation(data: unknown, indicator: string, type: IOCType): IOCInvestigation {
  const payload = asRecord(data);

  // The scan controller returns { success: true, scanType, value, overallThreatScore, riskLevel, summary, sources, scannedAt }
  // Try to find the actual body - it may be nested under `data`, `result`, etc.
  const body = payload.data && typeof payload.data === 'object'
    ? asRecord(payload.data)
    : payload.result && typeof payload.result === 'object'
      ? asRecord(payload.result)
      : payload;

  // Extract sources (the backend puts them in `body.sources`)
  const sourcesMap = (body.sources ?? {}) as Record<string, unknown>;
  const sourceKeys = Object.keys(sourcesMap).filter(k => k !== 'fileInfo');

  // Extract values from individual sources
  const shodan = asRecord(sourcesMap.shodan ?? {});
  const abuseipdb = asRecord(sourcesMap.abuseipdb ?? {});
  const otx = asRecord(sourcesMap.otx ?? {});
  const ipinfo = asRecord(sourcesMap.ipinfo ?? {});
  const virustotal = asRecord(sourcesMap.virustotal ?? {});

  // Map risk level from backend
  const riskLevelRaw = String(body.riskLevel ?? '').toLowerCase();
  const overallThreatScore = pickNumber(body, ['overallThreatScore', 'threatScore', 'score'], 0);
  const verdict: IOCVerdict = riskLevelRaw === 'safe' || riskLevelRaw === 'low' ? 'clean'
    : riskLevelRaw === 'medium' || riskLevelRaw === 'suspicious' ? 'suspicious'
    : 'malicious';

  // Extract country from sources with fallbacks
  const country = pickString(body, ['country', 'countryName']) ||
    pickString(ipinfo, ['country']) ||
    pickString(abuseipdb, ['countryName']) ||
    pickString(shodan, ['country']) ||
    pickString(otx, ['country']) ||
    '';

  // Extract ISP from sources with fallbacks
  const isp = pickString(body, ['isp', 'internetServiceProvider']) ||
    pickString(ipinfo, ['org']) ||
    pickString(abuseipdb, ['isp']) ||
    pickString(shodan, ['isp']) ||
    '';

  // Extract ASN
  const asn = pickString(body, ['asn']) ||
    pickString(ipinfo, ['asn', 'asn']) ||
    pickString(shodan, ['asn']) ||
    pickString(otx, ['asn']) ||
    '';

  // Reports count
  const reports = pickNumber(body, ['reports', 'abuseReports', 'reportCount'], 0) ||
    pickNumber(abuseipdb, ['totalReports', 'abuseConfidenceScore'], 0) ||
    0;

  // Blacklist status
const blacklistStatus = pickString(body, ['blacklistStatus', 'blacklist', 'blacklisted']) ||
    (abuseipdb.isWhitelisted === true ? 'Whitelisted'
      : Number(abuseipdb.abuseConfidenceScore) > 0 ? 'Reported'
      : 'Not Listed');

  // First seen / last seen
  const firstSeen = pickString(body, ['firstSeen', 'first_seen', 'firstObserved']) ||
    pickString(shodan, ['lastUpdate']) ||
    pickString(abuseipdb, ['lastReportedAt']) ||
    '';
  const lastSeen = pickString(body, ['lastSeen', 'last_seen', 'lastObserved']) ||
    pickString(shodan, ['lastUpdate']) ||
    pickString(abuseipdb, ['lastReportedAt']) ||
    '';

  // Build WHOIS data from OTX if available
  const whoisRaw = otx.whois ? asRecord(otx.whois) : {};
  const whois = mapWHOIS(Object.keys(whoisRaw).length > 0 ? whoisRaw : null);

  // Build DNS records from Shodan hostnames
  const dnsRecords: IOCDNSRecord[] = [];
  if (shodan.hostnames && Array.isArray(shodan.hostnames)) {
    shodan.hostnames.forEach((h: unknown) => {
      if (typeof h === 'string' && h.trim()) {
        dnsRecords.push({ type: 'A', value: h.trim() });
      }
    });
  }
  if (ipinfo.hostname && typeof ipinfo.hostname === 'string') {
    dnsRecords.push({ type: 'PTR', value: ipinfo.hostname });
  }
  // Also add any from body.dns
  const bodyDns = mapDNSRecords(body.dns ?? body.dnsRecords ?? []);
  bodyDns.forEach(d => {
    if (!dnsRecords.some(ex => ex.value === d.value && ex.type === d.type)) {
      dnsRecords.push(d);
    }
  });

  // Build IP intelligence
  const ipIntelligence: IOCIPIntelligence = {
    country: country || undefined,
    region: pickString(ipinfo, ['region']) || undefined,
    city: pickString(ipinfo, ['city']) || undefined,
    asn: asn || undefined,
    isp: isp || undefined,
    organization: pickString(ipinfo, ['org']) || pickString(shodan, ['org']) || undefined,
hosting: ((ipinfo.privacy as Record<string, unknown>)?.hosting === true) || undefined,
    latitude: pickNumber(ipinfo, ['latitude', 'lat']) || pickNumber(shodan, ['latitude']) || undefined,
    longitude: pickNumber(ipinfo, ['longitude', 'lon']) || pickNumber(shodan, ['longitude']) || undefined,
  };

  // Build security sources
  const security: IOCSecuritySource[] = sourceKeys.map(name => {
    const src = asRecord(sourcesMap[name] ?? {});
    const s = {
      name,
      status: src.scanned === true ? 'Scanned' : src.error ? 'Error' : 'No Data',
      score: typeof src.threatScore === 'number' ? src.threatScore
        : typeof src.score === 'number' ? src.score
        : undefined,
      lastChecked: pickString(src, ['lastUpdate', 'lastReportedAt', 'scannedAt']),
      details: src.error ? String(src.error) : undefined,
    };
    return s;
  });

  // Build categories from reports data
  const categories: string[] = [];
  if (abuseipdb.categories && typeof abuseipdb.categories === 'object') {
    Object.keys(abuseipdb.categories as Record<string, unknown>).forEach(c => {
      if (!categories.includes(c)) categories.push(c);
    });
  }
  if (virustotal.categories && typeof virustotal.categories === 'object') {
    Object.values(virustotal.categories as Record<string, unknown>).forEach(v => {
      if (typeof v === 'string' && !categories.includes(v)) categories.push(v);
    });
  }

  // Tags from OTX pulses
  const tags: string[] = [];
  if (otx.pulses && Array.isArray(otx.pulses)) {
    otx.pulses.forEach((pulse: unknown) => {
      const p = asRecord(pulse);
      if (p.tags && Array.isArray(p.tags)) {
        (p.tags as string[]).forEach((t: string) => {
          if (typeof t === 'string' && t.trim() && !tags.includes(t)) tags.push(t.trim());
        });
      }
    });
  }

  // Source names
  const sourceNames = sourceKeys.length > 0 ? sourceKeys : ['VirusTotal', 'AbuseIPDB', 'OTX', 'Shodan', 'IPinfo'];

  // Recommendations from summary
  const summary = asRecord(body.summary ?? {});
  const recommendationsRaw = Array.isArray(summary.recommendations)
    ? summary.recommendations.map((r: unknown) => ({ text: String(r) }))
    : body.recommendations ?? [];

  return {
    indicator: String(body.value ?? indicator),
    type: normalizeType(String(body.scanType ?? type), type),
    verdict,
    riskScore: overallThreatScore,
    threatLevel: String(body.riskLevel ?? (verdict === 'clean' ? 'low' : verdict === 'suspicious' ? 'medium' : 'high')),
    confidence: pickNumber(body, ['confidence', 'confidenceScore'], 0) || (overallThreatScore > 0 ? Math.min(overallThreatScore, 100) : 0) || 50,
    reputation: verdict === 'clean' ? 'Clean' : verdict === 'suspicious' ? 'Suspicious' : 'Malicious',
    blacklistStatus,
    categories,
    tags,
    detectionRatio: '',
    firstSeen,
    lastSeen,
    lastUpdated: String(body.scannedAt ?? ''),
    country,
    isp,
    reports,
    sources: sourceNames,
    whois,
    dns: dnsRecords,
    ipIntelligence,
    security,
    recommendations: mapRecommendations(recommendationsRaw),
    suggestedActions: [],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Investigate an IOC (IP, Domain, URL, or Hash).
 *
 * Uses the existing backend IOC analysis endpoint (`POST /scan/analyze`)
 * which aggregates VirusTotal, AbuseIPDB, OTX, GreyNoise, IPInfo, Shodan
 * and WHOIS/DNS lookups. Returns a fully typed investigation result.
 *
 * @param indicator - The IOC value to investigate (e.g. "8.8.8.8").
 * @param type - One of "ip" | "domain" | "url" | "hash".
 */
export async function investigateIOC(indicator: string, type: IOCType): Promise<IOCInvestigation> {
  const data = await apiRequest<unknown>({
    method: "post",
    url: "/scan/analyze",
    data: { value: indicator, type },
  });
  return mapInvestigation(data, indicator, type);
}

/**
 * Convenience: investigate an IP address.
 */
export async function investigateIP(ip: string): Promise<IOCInvestigation> {
  return investigateIOC(ip, "ip");
}

/**
 * Convenience: investigate a domain.
 */
export async function investigateDomain(domain: string): Promise<IOCInvestigation> {
  return investigateIOC(domain, "domain");
}

/**
 * Convenience: investigate a URL.
 */
export async function investigateURL(url: string): Promise<IOCInvestigation> {
  return investigateIOC(url, "url");
}

/**
 * Convenience: investigate a file hash (MD5 / SHA-1 / SHA-256).
 */
export async function investigateHash(hash: string): Promise<IOCInvestigation> {
  return investigateIOC(hash, "hash");
}

const iocService = {
  investigateIOC,
  investigateIP,
  investigateDomain,
  investigateURL,
  investigateHash,
  getErrorMessage: getIOCErrorMessage,
};

export default iocService;

