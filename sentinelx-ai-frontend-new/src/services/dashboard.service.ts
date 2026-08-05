import { apiRequest, getApiErrorMessage } from "@/lib/api";
import type {
  DashboardAiInsights,
  DashboardAssetOverview,
  DashboardData,
  DashboardIncidentSummary,
  DashboardRecentAlert,
  DashboardRecentScan,
  DashboardSecurityScore,
  DashboardThreatLevel,
  ThreatItem,
  ThreatTrendPoint,
  Vulnerability,
} from "@/types/security";

/**
 * Dashboard service.
 *
 * Connects the frontend dashboard to the existing backend `GET /dashboard`
 * endpoint. Provides strongly-typed, reusable accessors for each dashboard
 * widget. Every response is mapped defensively so partial backend payloads
 * degrade gracefully (returning sensible defaults instead of crashing).
 */

interface NormalizedDashboard {
  readonly securityScore: DashboardSecurityScore;
  readonly threatLevel: DashboardThreatLevel;
  readonly assetOverview: DashboardAssetOverview;
  readonly incidentSummary: DashboardIncidentSummary;
  readonly recentAlerts: readonly DashboardRecentAlert[];
  readonly recentScans: readonly DashboardRecentScan[];
  readonly aiInsights: DashboardAiInsights;
  readonly threatFeed: readonly ThreatItem[];
  readonly threatChart: readonly ThreatTrendPoint[];
  readonly vulnerabilities: readonly Vulnerability[];
  readonly lastUpdated?: string;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSeverity(value: unknown): DashboardSecurityScore["label"] {
  const normalized = String(value ?? "").toLowerCase();
  if (["excellent", "good", "strong"].includes(normalized)) return "Excellent";
  if (["fair", "average", "moderate"].includes(normalized)) return "Fair";
  if (["poor", "critical", "bad"].includes(normalized)) return "Poor";
  return undefined;
}

function mapSecurityScore(value: unknown): DashboardSecurityScore {
  if (typeof value === "number") {
    return { score: value, label: toSeverity(value >= 90 ? "excellent" : value >= 70 ? "fair" : "poor") };
  }

  const raw = (value ?? {}) as Record<string, unknown>;
  const score = toNumber(raw.score ?? raw.value ?? raw.securityScore ?? raw.overallThreatScore, 0);
  return {
    score,
    label: typeof raw.label === "string" ? (raw.label as DashboardSecurityScore["label"]) : toSeverity(score),
    changePercent: raw.changePercent != null ? toNumber(raw.changePercent) : undefined,
    threatsBlocked: raw.threatsBlocked != null ? toNumber(raw.threatsBlocked) : undefined,
    systemsProtected: raw.systemsProtected != null ? toNumber(raw.systemsProtected) : undefined,
    lastUpdated: raw.lastUpdated ? String(raw.lastUpdated) : undefined,
  };
}

function mapThreatLevel(value: unknown): DashboardThreatLevel {
  const raw = (value ?? {}) as Record<string, unknown>;
  const level = String(raw.level ?? raw.threatLevel ?? raw.riskLevel ?? "low").toLowerCase() as DashboardThreatLevel["level"];
  return {
    level: ["low", "medium", "high", "critical"].includes(level) ? level : "low",
    score: toNumber(raw.score ?? raw.threatScore, 0),
    activeThreats: raw.activeThreats != null ? toNumber(raw.activeThreats) : undefined,
    blockedAttacks: raw.blockedAttacks != null ? toNumber(raw.blockedAttacks) : undefined,
    lastUpdated: raw.lastUpdated ? String(raw.lastUpdated) : undefined,
  };
}

function mapAssetOverview(value: unknown): DashboardAssetOverview {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    totalAssets: toNumber(raw.totalAssets ?? raw.total ?? raw.assets),
    healthy: toNumber(raw.healthy),
    warning: toNumber(raw.warning),
    critical: toNumber(raw.critical),
    offline: toNumber(raw.offline),
    averageHealth: raw.averageHealth != null ? toNumber(raw.averageHealth) : undefined,
    riskScore: raw.riskScore != null ? toNumber(raw.riskScore) : undefined,
  };
}

function mapIncidentSummary(value: unknown): DashboardIncidentSummary {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    total: toNumber(raw.total ?? raw.count ?? raw.open),
    critical: toNumber(raw.critical),
    high: toNumber(raw.high),
    medium: toNumber(raw.medium),
    low: toNumber(raw.low),
    investigating: toNumber(raw.investigating),
    resolvedToday: toNumber(raw.resolvedToday ?? raw.resolved),
  };
}

function mapRecentAlerts(value: unknown): readonly DashboardRecentAlert[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(raw.id ?? raw._id ?? ""),
      title: String(raw.title ?? raw.name ?? ""),
      severity: (String(raw.severity ?? "info").toLowerCase() as DashboardRecentAlert["severity"]),
      source: raw.source ? String(raw.source) : "",
      createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    };
  });
}

function mapRecentScans(value: unknown): readonly DashboardRecentScan[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(raw.id ?? raw._id ?? ""),
      target: String(raw.target ?? ""),
      type: (String(raw.type ?? "file").toLowerCase() as DashboardRecentScan["type"]),
      status: (String(raw.status ?? "safe").toLowerCase() as DashboardRecentScan["status"]),
      riskScore: toNumber(raw.riskScore ?? raw.risk),
      createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    };
  });
}

function mapAiInsights(value: unknown): DashboardAiInsights {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    predictedRisk: (String(raw.predictedRisk ?? raw.risk ?? "low").toLowerCase() as DashboardAiInsights["predictedRisk"]),
    confidence: toNumber(raw.confidence, 0),
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.map((r) => String(r))
      : [],
    newThreatsDetected: toNumber(raw.newThreatsDetected ?? raw.threatsDetected),
    potentialImpact: raw.potentialImpact ? String(raw.potentialImpact) : "Low",
    modelStatus: raw.modelStatus ? String(raw.modelStatus) : "online",
    summary: raw.summary ? String(raw.summary) : undefined,
  };
}

function mapThreatFeed(value: unknown): readonly ThreatItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(raw.id ?? raw._id ?? ""),
      title: String(raw.title ?? raw.name ?? ""),
      description: raw.description ? String(raw.description) : undefined,
      type: raw.type ? String(raw.type) : undefined,
      severity: (String(raw.severity ?? "info").toLowerCase() as ThreatItem["severity"]),
      source: raw.source ? String(raw.source) : undefined,
      country: raw.country ? String(raw.country) : undefined,
      coordinates: (() => {
        const coords = raw.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return undefined;
        const [lon, lat] = coords.slice(0, 2).map((n) => Number(n));
        return Number.isFinite(lon) && Number.isFinite(lat)
          ? ([lon, lat] as readonly [number, number])
          : undefined;
      })(),
      timestamp: raw.timestamp ?? raw.createdAt ? String(raw.timestamp ?? raw.createdAt) : undefined,
      status: raw.status ? String(raw.status) : undefined,
      tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t)) : undefined,
    };
  });
}

function mapThreatChart(value: unknown): readonly ThreatTrendPoint[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      timestamp: String(raw.timestamp ?? raw.date ?? ""),
      value: toNumber(raw.value ?? raw.count),
      severity: raw.severity ? (String(raw.severity).toLowerCase() as ThreatTrendPoint["severity"]) : undefined,
    };
  });
}

function mapVulnerabilities(value: unknown): readonly Vulnerability[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(raw.id ?? raw._id ?? ""),
      title: String(raw.title ?? raw.name ?? ""),
      cve: raw.cve ? String(raw.cve) : undefined,
      severity: (String(raw.severity ?? "low").toLowerCase() as Vulnerability["severity"]),
      cvssScore: raw.cvssScore != null ? toNumber(raw.cvssScore) : undefined,
      affectedAssets: raw.affectedAssets != null ? toNumber(raw.affectedAssets) : undefined,
      status: raw.status ? (String(raw.status) as Vulnerability["status"]) : undefined,
      publishedAt: raw.publishedAt ? String(raw.publishedAt) : undefined,
    };
  });
}

function computeSafetyScore(severityDist: Record<string, number>): number {
  const total = Object.values(severityDist).reduce((a, b) => a + b, 0);
  if (total === 0) return 100;
  const weighted = (severityDist.critical ?? 0) * 3 + (severityDist.high ?? 0) * 2 + (severityDist.medium ?? 0) * 1;
  const maxPossible = total * 3;
  const riskRatio = weighted / maxPossible;
  return Math.round((1 - riskRatio) * 100);
}

function computeThreatScore(severityDist: Record<string, number>): number {
  const total = Object.values(severityDist).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const weighted = (severityDist.critical ?? 0) * 3 + (severityDist.high ?? 0) * 2 + (severityDist.medium ?? 0) * 1;
  const maxPossible = total * 3;
  const riskRatio = weighted / maxPossible;
  return Math.round(riskRatio * 100);
}

function scoreToLabel(score: number): DashboardSecurityScore["label"] {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

function scoreToThreatLevel(score: number): DashboardThreatLevel["level"] {
  if (score < 25) return "low";
  if (score < 50) return "medium";
  if (score < 75) return "high";
  return "critical";
}

function normalizeDashboard(data: Partial<DashboardData> | null | undefined): NormalizedDashboard {
  const payload = data ?? {};
  const lastUpdated =
    typeof payload.lastUpdated === "string"
      ? payload.lastUpdated
      : (payload as Record<string, unknown>).updatedAt
        ? String((payload as Record<string, unknown>).updatedAt)
        : undefined;

  // If recentScans is not directly provided, extract from recentActivity.scans
  let recentScansVal = payload.recentScans;
  if ((!recentScansVal || recentScansVal.length === 0) && payload.recentActivity?.scans) {
    recentScansVal = payload.recentActivity.scans.map((s: Record<string, unknown>) => ({
      id: String(s._id ?? s.id ?? ""),
      target: String(s.value ?? s.target ?? ""),
      type: (String(s.scanType ?? s.type ?? "file").toLowerCase() as DashboardRecentScan["type"]),
      status: (String(s.status ?? "safe").toLowerCase() as DashboardRecentScan["status"]),
      riskScore: Number(s.overallThreatScore ?? s.riskScore ?? 0),
      createdAt: String(s.createdAt ?? s.scannedAt ?? new Date().toISOString()),
    }));
  }

  // Map recentAlerts from recentActivity.alerts if not provided directly
  let recentAlertsVal = payload.recentAlerts;
  if ((!recentAlertsVal || recentAlertsVal.length === 0) && payload.recentActivity?.alerts) {
    recentAlertsVal = payload.recentActivity.alerts.map((a: Record<string, unknown>) => ({
      id: String(a._id ?? a.id ?? ""),
      title: String(a.title ?? ""),
      severity: (String(a.severity ?? "info").toLowerCase() as DashboardRecentAlert["severity"]),
      source: String(a.source ?? ""),
      createdAt: String(a.createdAt ?? new Date().toISOString()),
    }));
  }

  return {
    securityScore: mapSecurityScore(payload.securityScore),
    threatLevel: mapThreatLevel(payload.threatLevel),
    assetOverview: mapAssetOverview(payload.assetOverview),
    incidentSummary: mapIncidentSummary(payload.incidentSummary),
    recentAlerts: mapRecentAlerts(recentAlertsVal),
    recentScans: mapRecentScans(recentScansVal),
    aiInsights: mapAiInsights(payload.aiInsights),
    threatFeed: mapThreatFeed(payload.threatFeed),
    threatChart: mapThreatChart(payload.threatChart),
    vulnerabilities: mapVulnerabilities(payload.vulnerabilities),
    lastUpdated,
  };
}

/**
 * GET /dashboard
 *
 * Fetches the aggregated dashboard payload and normalizes it into
 * strongly-typed widget data.
 */
export async function getDashboard(): Promise<NormalizedDashboard> {
  const data = await apiRequest<unknown>({
    method: "get",
    url: "/dashboard",
  });

  // The backend may return the dashboard directly or nested under `data`.
  const rawPayload = (data as Record<string, unknown>)?.data ?? data;
  return normalizeDashboard(rawPayload as Partial<DashboardData>);
}

/**
 * Alias for `getDashboard` that preserves a future-friendly name.
 */
export async function fetchDashboard(): Promise<NormalizedDashboard> {
  return getDashboard();
}

export async function fetchDashboardData(): Promise<NormalizedDashboard> {
  return getDashboard();
}

export function getDashboardErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}

// Re-export the normalized shape type for consumers.
export type { NormalizedDashboard };

// Default export object for convenience.
const dashboardService = {
  getDashboard,
  fetchDashboard,
  fetchDashboardData,
  getErrorMessage: getDashboardErrorMessage,
};

export default dashboardService;

