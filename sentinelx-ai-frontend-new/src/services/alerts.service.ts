import { api, apiRequest, getApiErrorMessage } from "@/lib/api";
import type {
  Alert,
  AlertStatus,
  AlertTimelineEvent,
  AlertIOC,
  AlertEvidence,
  AlertComment,
  AlertActivityEntry,
  MitreTechnique,
  Severity,
} from "@/types/security";

/**
 * Alerts service.
 *
 * Connects the Alerts module UI to the existing backend `/alerts` endpoints.
 * Provides strongly-typed CRUD accessors: list, get, create, update, delete,
 * plus normalized summary/trend/distribution views used by the alerts
 * dashboard widgets. Every response is mapped defensively so partial backend
 * payloads degrade gracefully.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AlertSummary {
  readonly total: number;
  readonly open: number;
  readonly investigating: number;
  readonly resolved: number;
  readonly suppressed: number;
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
  readonly info: number;
  readonly averageRisk: number;
  readonly distribution: readonly {
    readonly label: string;
    readonly value: number;
    readonly color: string;
    readonly glowColor: string;
    readonly bgClass: string;
    readonly textClass: string;
    readonly borderClass: string;
  }[];
}

export interface AlertTrendPoint {
  readonly time: string;
  readonly timestamp: number;
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
}

export interface AlertOverview {
  readonly alerts: readonly Alert[];
  readonly summary: AlertSummary;
  readonly trend: readonly AlertTrendPoint[];
}

export interface AlertPayload {
  readonly title: string;
  readonly description?: string;
  readonly severity?: Severity;
  readonly status?: AlertStatus;
  readonly source?: string;
  readonly sourceCategory?: string;
  readonly affectedAsset?: string;
  readonly assetIP?: string;
  readonly assignedTo?: string;
  readonly riskScore?: number;
}

// ─── Severity config (matches alerts UI) ─────────────────────────────────────

const SEVERITY_STYLES: Record<
  string,
  { color: string; glowColor: string; bgClass: string; textClass: string; borderClass: string }
> = {
  critical: {
    color: "#f43f5e",
    glowColor: "rgba(244,63,94,0.4)",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/20",
  },
  high: {
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.4)",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/20",
  },
  medium: {
    color: "#eab308",
    glowColor: "rgba(234,179,8,0.4)",
    bgClass: "bg-yellow-500/10",
    textClass: "text-yellow-400",
    borderClass: "border-yellow-500/20",
  },
  low: {
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.4)",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/20",
  },
  info: {
    color: "#6366f1",
    glowColor: "rgba(99,102,241,0.4)",
    bgClass: "bg-indigo-500/10",
    textClass: "text-indigo-400",
    borderClass: "border-indigo-500/20",
  },
};

// ─── Normalization helpers ───────────────────────────────────────────────────

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickString(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const val = record[key];
    if (val !== null && val !== undefined && String(val).trim() !== "") return String(val);
  }
  return fallback;
}

function toSeverity(value: unknown, fallback: Severity = "info"): Severity {
  const normalized = String(value ?? "").toLowerCase();
  if (["critical", "high", "medium", "low", "info"].includes(normalized)) {
    return normalized as Severity;
  }
  return fallback;
}

function toAlertStatus(value: unknown, fallback: AlertStatus = "open"): AlertStatus {
  const normalized = String(value ?? "").toLowerCase();
  if (["open", "investigating", "resolved", "suppressed"].includes(normalized)) {
    return normalized as AlertStatus;
  }
  return fallback;
}

function mapTactics(value: unknown): readonly MitreTechnique[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: pickString(raw, ["id", "techniqueId", "mitreId"]),
      name: pickString(raw, ["name", "technique", "label"]),
      tactic: pickString(raw, ["tactic", "phase"]),
      url: pickString(raw, ["url", "link"]),
    };
  });
}

function mapTimeline(value: unknown): readonly AlertTimelineEvent[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: pickString(raw, ["id", "_id"]),
      timestamp: pickString(raw, ["timestamp", "createdAt", "time"]),
      type: (pickString(raw, ["type", "kind"]) || "system") as AlertTimelineEvent["type"],
      actor: pickString(raw, ["actor", "author", "user"]),
      description: pickString(raw, ["description", "message", "content"]),
    };
  });
}

function mapIOCs(value: unknown): readonly AlertIOC[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: pickString(raw, ["id", "_id"]),
      type: (pickString(raw, ["type", "iocType"]) || "ip") as AlertIOC["type"],
      value: pickString(raw, ["value", "indicator"]),
      confidence: (pickString(raw, ["confidence"]) || "possible") as AlertIOC["confidence"],
      firstSeen: pickString(raw, ["firstSeen", "first_seen"]),
      lastSeen: pickString(raw, ["lastSeen", "last_seen"]),
      tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t)) : undefined,
    };
  });
}

function mapEvidence(value: unknown): readonly AlertEvidence[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: pickString(raw, ["id", "_id"]),
      type: (pickString(raw, ["type", "kind"]) || "log") as AlertEvidence["type"],
      name: pickString(raw, ["name", "fileName", "title"]),
      size: pickString(raw, ["size", "fileSize"]),
      collectedAt: pickString(raw, ["collectedAt", "collected_at", "timestamp"]),
      collectedBy: pickString(raw, ["collectedBy", "collected_by", "actor"]),
      hash: pickString(raw, ["hash", "sha256"]),
    };
  });
}

function mapComments(value: unknown): readonly AlertComment[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: pickString(raw, ["id", "_id"]),
      author: pickString(raw, ["author", "user", "createdBy"]),
      content: pickString(raw, ["content", "text", "message"]),
      timestamp: pickString(raw, ["timestamp", "createdAt", "time"]),
      edited: Boolean(raw.edited),
    };
  });
}

function mapActivity(value: unknown): readonly AlertActivityEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: pickString(raw, ["id", "_id"]),
      actor: pickString(raw, ["actor", "author", "user"]),
      action: pickString(raw, ["action", "type", "name"]),
      timestamp: pickString(raw, ["timestamp", "createdAt", "time"]),
      metadata: pickString(raw, ["metadata", "details", "description"]),
    };
  });
}

function mapRecommendedActions(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    const raw = (item ?? {}) as Record<string, unknown>;
    return pickString(raw, ["action", "title", "description", "label"]);
  }).filter(Boolean);
}

function mapAlert(raw: unknown, index = 0): Alert {
  const record = (raw ?? {}) as Record<string, unknown>;
  const id = pickString(record, ["id", "_id", "alertId"], String(index + 1));
  const severity = toSeverity(record.severity ?? record.level ?? record.riskLevel);
  const createdAt = pickString(record, ["createdAt", "created_at", "timestamp", "date"]);

  return {
    id,
    title: pickString(record, ["title", "name", "summary", "alert"]),
    description: pickString(record, ["description", "details", "body"]),
    severity,
    status: toAlertStatus(record.status ?? record.state),
    source: pickString(record, ["source", "origin", "integration", "tool"]),
    sourceCategory: pickString(record, ["sourceCategory", "category", "type"]),
    affectedAsset: pickString(record, ["affectedAsset", "asset", "target", "hostname"]),
    assetIP: pickString(record, ["assetIP", "ip", "ipAddress"]),
    assignedTo: pickString(record, ["assignedTo", "assignee", "owner"]),
    riskScore: record.riskScore != null ? toNumber(record.riskScore) : undefined,
    createdAt,
    updatedAt: pickString(record, ["updatedAt", "updated_at"]),
    tactics: mapTactics(record.tactics ?? record.mitre ?? record.techniques),
    timeline: mapTimeline(record.timeline ?? record.history ?? record.events),
    iocs: mapIOCs(record.iocs ?? record.indicators ?? record.ioc),
    evidence: mapEvidence(record.evidence ?? record.artifacts),
    comments: mapComments(record.comments ?? record.notes),
    activity: mapActivity(record.activity ?? record.audit ?? record.logs),
    aiSummary: pickString(record, ["aiSummary", "ai_summary", "summary"]),
    recommendedActions: mapRecommendedActions(record.recommendedActions ?? record.actions ?? record.recommendations),
  };
}

const DISTRIBUTION_LABELS = [
  { label: "Critical", color: "#f43f5e", key: "critical" },
  { label: "High", color: "#f97316", key: "high" },
  { label: "Medium", color: "#eab308", key: "medium" },
  { label: "Low", color: "#3b82f6", key: "low" },
  { label: "Informational", color: "#6366f1", key: "info" },
] as const;

function mapDistribution(alerts: readonly Alert[]): AlertSummary["distribution"] {
  const counts: Record<string, number> = {};
  alerts.forEach((alert) => {
    counts[alert.severity] = (counts[alert.severity] ?? 0) + 1;
  });

  return DISTRIBUTION_LABELS.map((d) => {
    const value = counts[d.key] ?? 0;
    const style = SEVERITY_STYLES[d.key] ?? SEVERITY_STYLES.info;
    return {
      label: d.label,
      value,
      color: style.color,
      glowColor: style.glowColor,
      bgClass: style.bgClass,
      textClass: style.textClass,
      borderClass: style.borderClass,
    };
  });
}

function mapTrend(value: unknown): readonly AlertTrendPoint[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    const timestamp = toNumber(raw.timestamp ?? raw.time ?? raw.date ?? 0);
    const asDate = new Date(timestamp);
    const timeLabel = Number.isNaN(asDate.getTime())
      ? String(raw.time ?? raw.label ?? "")
      : asDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    return {
      time: timeLabel,
      timestamp,
      critical: toNumber(raw.critical),
      high: toNumber(raw.high),
      medium: toNumber(raw.medium),
      low: toNumber(raw.low),
    };
  });
}

function buildSummary(
  alerts: readonly Alert[],
  backendSummary?: unknown,
): AlertSummary {
  const raw = (backendSummary ?? {}) as Record<string, unknown>;
  const countBy = (fn: (a: Alert) => boolean) => alerts.filter(fn).length;

  const total = toNumber(raw.total ?? raw.count ?? alerts.length, alerts.length);
  const severityCount = (sev: string) => toNumber(raw[sev], countBy((a) => a.severity === sev));
  const statusCount = (status: string) => toNumber(raw[status], countBy((a) => a.status === status));

  const avgRisk =
    alerts.length > 0
      ? alerts.reduce((sum, a) => sum + (a.riskScore ?? 0), 0) / alerts.length
      : toNumber(raw.averageRisk ?? raw.avgRiskScore, 0);

  return {
    total,
    open: statusCount("open"),
    investigating: statusCount("investigating"),
    resolved: statusCount("resolved"),
    suppressed: statusCount("suppressed"),
    critical: severityCount("critical"),
    high: severityCount("high"),
    medium: severityCount("medium"),
    low: severityCount("low"),
    info: severityCount("info"),
    averageRisk: Math.round(avgRisk * 10) / 10,
    distribution: mapDistribution(alerts),
  };
}

function mapListResponse(data: unknown): AlertOverview {
  const payload = (data as Record<string, unknown>) ?? {};
  const list = payload.alerts ?? payload.data ?? payload.items ?? payload.results ?? [];

  if (!Array.isArray(list)) {
    return { alerts: [], summary: buildSummary([]), trend: [] };
  }

  const alerts = list.map(mapAlert);
  const summary = buildSummary(alerts, payload.summary ?? payload.stats);
  const trend = mapTrend(payload.trend ?? payload.trendData ?? payload.timeline ?? []);

  return { alerts, summary, trend };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GET /alerts
 *
 * Fetches all alerts plus a normalized summary and trend series.
 */
export async function getAlerts(): Promise<AlertOverview> {
  const data = await apiRequest<unknown>({ method: "get", url: "/alerts" });
  return mapListResponse((data as Record<string, unknown>)?.data ?? data);
}

/**
 * GET /alerts/:id
 *
 * Fetches a single alert by id (includes timeline, IOCs, evidence, comments).
 */
export async function getAlertById(id: string): Promise<Alert | null> {
  const data = await apiRequest<unknown>({ method: "get", url: `/alerts/${encodeURIComponent(id)}` });
  const payload = (data as Record<string, unknown>)?.data ?? data;
  const raw = Array.isArray(payload) ? payload[0] : payload;
  if (!raw || typeof raw !== "object") return null;
  const alert = mapAlert(raw);
  return alert.id ? alert : null;
}

/**
 * POST /alerts
 *
 * Creates a new alert.
 */
export async function createAlert(payload: AlertPayload): Promise<Alert> {
  const data = await apiRequest<unknown>({ method: "post", url: "/alerts", data: payload });
  const raw = (data as Record<string, unknown>)?.data ?? data;
  return mapAlert(Array.isArray(raw) ? raw[0] : raw);
}

/**
 * PUT /alerts/:id
 *
 * Updates an existing alert (e.g., status, assignment).
 */
export async function updateAlert(id: string, payload: Partial<AlertPayload>): Promise<Alert> {
  const data = await apiRequest<unknown>({ method: "put", url: `/alerts/${encodeURIComponent(id)}`, data: payload });
  const raw = (data as Record<string, unknown>)?.data ?? data;
  return mapAlert(Array.isArray(raw) ? raw[0] : raw);
}

/**
 * DELETE /alerts/:id
 *
 * Deletes an alert.
 */
export async function deleteAlert(id: string): Promise<void> {
  await apiRequest<unknown>({ method: "delete", url: `/alerts/${encodeURIComponent(id)}` });
}

// ─── Error helper + default export ───────────────────────────────────────────

export function getAlertsErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}

const alertsService = {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  getErrorMessage: getAlertsErrorMessage,
};

export default alertsService;

// Keep `api` imported for consumers that may need the raw instance.
export { api };

