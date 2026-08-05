"use client";

import { apiRequest, getApiErrorMessage } from "@/lib/api";
import type {
  APTGroupData,
  CVE,
  MalwareFamily,
  ThreatFeedData,
  ThreatItem,
  ThreatStats,
  ThreatTrendPoint,
} from "@/types/threat";

/**
 * Threat Intelligence service.
 *
 * Connects the Threat Intelligence Center UI to the existing backend
 * `/threats` endpoint. All mock threat data has been replaced with real
 * API responses. Responses are mapped defensively so partial payloads
 * degrade gracefully (missing fields are hidden, never faked).
 */

// ─── Error helper ─────────────────────────────────────────────────────────────

/** Normalize any thrown value into a human-readable message. */
export function getThreatErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}

// ─── Type guards / normalization ──────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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

function toSeverity(value: unknown): ThreatItem["severity"] {
  const v = String(value ?? "").toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  if (v === "info") return "info";
  return "low";
}

// ─── Response mappers ─────────────────────────────────────────────────────────

function mapThreatItem(value: unknown): ThreatItem {
  const raw = asRecord(value);
  return {
    id: pickString(raw, ["id", "_id"]),
    title: pickString(raw, ["title", "name", "headline"]),
    description: pickString(raw, ["description", "summary"]),
    type: pickString(raw, ["type", "category", "kind"]),
    severity: toSeverity(pickString(raw, ["severity", "level"], "low")),
    source: pickString(raw, ["source", "provider", "origin"]),
    country: pickString(raw, ["country", "region"]),
    coordinates:
      Array.isArray(raw.coordinates) && raw.coordinates.length >= 2
        ? [Number(raw.coordinates[0]) || 0, Number(raw.coordinates[1]) || 0]
        : undefined,
    timestamp: pickString(raw, ["timestamp", "createdAt", "reportedAt", "time"]),
    status: pickString(raw, ["status", "state"]),
    tags: asArray(raw.tags).map((t) => String(t)),
  };
}

function mapMalwareFamily(value: unknown): MalwareFamily {
  const raw = asRecord(value);
  const severityRaw = pickString(raw, ["severity", "level"], "high");
  const severityMap: Record<string, MalwareFamily["severity"]> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    info: "info",
  };
  const severity = severityMap[severityRaw.toLowerCase()] ?? "low";

  return {
    id: pickString(raw, ["id", "_id"]),
    name: pickString(raw, ["name", "family"]),
    category: pickString(raw, ["category", "type"]),
    severity,
    detectionCount: pickNumber(raw, ["detectionCount", "detections", "detectionsCount"], 0),
    firstSeen: pickString(raw, ["firstSeen", "first_seen"]),
    lastSeen: pickString(raw, ["lastSeen", "last_seen"]),
    platforms: asArray(raw.platforms).map((t) => String(t)),
    behavior: asArray(raw.behavior).map((t) => String(t)),
  };
}

function mapCVE(value: unknown): CVE {
  const raw = asRecord(value);
  const severityRaw = pickString(raw, ["severity", "level"], "medium");
  const severityMap: Record<string, CVE["severity"]> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    info: "info",
  };
  const severity = severityMap[severityRaw.toLowerCase()] ?? "low";

  return {
    id: pickString(raw, ["id", "cve", "cveId"]),
    description: pickString(raw, ["description", "summary"]),
    cvssScore: pickNumber(raw, ["cvssScore", "cvss", "score"], 0),
    cvssVector: pickString(raw, ["cvssVector", "vector"]),
    publishedAt: pickString(raw, ["publishedAt", "published", "published_date"]),
    modifiedAt: pickString(raw, ["modifiedAt", "modified", "last_modified"]),
    severity,
    affectedAssets: pickNumber(raw, ["affectedAssets", "affected_assets"], 0),
    exploitAvailable: Boolean(raw.exploitAvailable ?? raw.exploit),
    knownExploited: Boolean(raw.knownExploited ?? raw.kev),
  };
}

function mapTrendPoint(value: unknown): ThreatTrendPoint {
  const raw = asRecord(value);
  return {
    timestamp: pickString(raw, ["timestamp", "date", "time"]),
    value: pickNumber(raw, ["value", "count", "threats"], 0),
    severity: toSeverity(pickString(raw, ["severity", "level"], "low")),
  };
}

// ─── Main response mapper ─────────────────────────────────────────────────────

function mapThreatsResponse(data: unknown): ThreatFeedData {
  const payload = asRecord(data);

  // Backend may return nested objects under `data`, `threats`, `summary`.
  const body = payload.data && typeof payload.data === "object" ? asRecord(payload.data) : payload;

  const feedRaw = body.feed ?? body.threats ?? body.items ?? body.results ?? [];
  const statsRaw = asRecord(body.stats ?? body.summary ?? {});
  const malwareRaw = body.malware ?? body.malwareFamilies ?? body.families ?? [];
  const cvesRaw = body.cves ?? body.vulnerabilities ?? [];
  const trendRaw = body.trend ?? body.threatChart ?? body.history ?? [];
  const aptGroupsRaw = body.aptGroups ?? body.groups ?? body.actors ?? [];

  const feed = asArray(feedRaw).map(mapThreatItem);

  const stats: ThreatStats = {
    activeThreats: pickNumber(statsRaw, ["activeThreats", "active_threats", "active"], feed.length),
    criticalCVEs: pickNumber(statsRaw, ["criticalCVEs", "critical_cves", "criticalCves"]),
    malwareFamilies: pickNumber(statsRaw, ["malwareFamilies", "malware_families", "totalMalware"]),
    aptGroups: pickNumber(statsRaw, ["aptGroups", "apt_groups", "totalGroups"]),
    blockedThreats: pickNumber(statsRaw, ["blockedThreats", "blocked", "threatsBlocked"]),
    newIndicators: pickNumber(statsRaw, ["newIndicators", "new_indicators", "newIocs"]),
  };

  return {
    feed,
    stats,
    malwareFamilies: asArray(malwareRaw).map(mapMalwareFamily),
    cves: asArray(cvesRaw).map(mapCVE),
    trend: asArray(trendRaw).map(mapTrendPoint),
    aptGroups: asArray(aptGroupsRaw).map((item) => {
      const raw = asRecord(item);
      return {
        id: pickString(raw, ["id", "_id"]),
        name: pickString(raw, ["name", "group"]),
        aliases: asArray(raw.aliases).map(String),
        origin: pickString(raw, ["origin", "country", "attribution"]),
        motivation: pickString(raw, ["motivation"]),
        sophistication: pickString(raw, ["sophistication", "skill"]),
        activeSince: pickString(raw, ["activeSince", "firstSeen"]),
        lastSeen: pickString(raw, ["lastSeen", "last_seen"]),
        targets: asArray(raw.targets).map(String),
        tools: asArray(raw.tools).map(String),
        severity: toSeverity(pickString(raw, ["severity", "level"], "high")),
        status: pickString(raw, ["status", "state"], "Monitoring"),
        techniques: asArray(raw.techniques).map(String),
      } satisfies APTGroupData;
    }),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GET /threats/summary
 *
 * Fetch the aggregated threat intelligence payload (live feed, stats, malware
 * families, CVEs, APT groups, trend data, IOCs) from the PUBLIC read-only
 * summary endpoint. All values derive from persisted backend data.
 */
export async function getThreats(params?: { limit?: number }): Promise<ThreatFeedData> {
  const data = await apiRequest<unknown>({
    method: "get",
    url: "/threats/summary",
    params,
  });
  return mapThreatsResponse(data);
}

/**
 * GET /threats
 *
 * Convenience: fetch just the live threat feed.
 */
export async function getThreatFeed(params?: { limit?: number }): Promise<ThreatItem[]> {
  const data = await getThreats(params);
  return data.feed;
}

/**
 * GET /threats
 *
 * Convenience: fetch just the threat stats.
 */
export async function getThreatStats(params?: { limit?: number }): Promise<ThreatStats> {
  const data = await getThreats(params);
  return data.stats;
}

/**
 * GET /threats
 *
 * Convenience: fetch just malware families.
 */
export async function getMalwareFamilies(params?: { limit?: number }): Promise<MalwareFamily[]> {
  const data = await getThreats(params);
  return data.malwareFamilies;
}

/**
 * GET /threats
 *
 * Convenience: fetch just CVEs.
 */
export async function getCVEs(params?: { limit?: number }): Promise<CVE[]> {
  const data = await getThreats(params);
  return data.cves;
}

/**
 * GET /threats
 *
 * Convenience: fetch the threat trend chart.
 */
export async function getThreatTrend(params?: { limit?: number }): Promise<ThreatTrendPoint[]> {
  const data = await getThreats(params);
  return data.trend;
}

/**
 * GET /threats
 *
 * Convenience: fetch APT groups / threat actors.
 */
export async function getAPTGroups(params?: { limit?: number }): Promise<APTGroupData[]> {
  const data = await getThreats(params);
  return data.aptGroups;
}

const threatService = {
  getThreats,
  getThreatFeed,
  getThreatStats,
  getMalwareFamilies,
  getCVEs,
  getThreatTrend,
  getAPTGroups,
  getErrorMessage: getThreatErrorMessage,
};

export default threatService;

