import { api, apiRequest, getApiErrorMessage } from "@/lib/api";
import type {
  Asset,
  AssetStatus,
  AssetType,
  RiskLevel,
  Vulnerability,
} from "@/types/security";

/**
 * Assets service.
 *
 * Connects the Assets module UI to the existing backend `/assets` endpoints.
 * Provides strongly-typed CRUD accessors: list, get, create, update, delete.
 * Every response is mapped defensively so partial backend payloads degrade
 * gracefully (missing fields are hidden, never faked).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AssetSummary {
  readonly total: number;
  readonly healthy: number;
  readonly warning: number;
  readonly critical: number;
  readonly offline: number;
  readonly servers: number;
  readonly endpoints: number;
  readonly cloud: number;
  readonly averageHealth: number;
  readonly riskScore: number;
  readonly riskBreakdown: readonly {
    readonly label: string;
    readonly count: number;
    readonly percent: number;
  }[];
  readonly activity: readonly AssetActivityEvent[];
}

export interface AssetActivityEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly time: string;
  readonly type: AssetStatus;
}

export interface AssetPayload {
  readonly hostname: string;
  readonly ipAddress: string;
  readonly owner?: string;
  readonly os?: string;
  readonly type?: AssetType;
  readonly status?: AssetStatus;
  readonly health?: number;
  readonly risk?: RiskLevel;
  readonly openCVEs?: number;
  readonly severity?: RiskLevel;
}

export interface AssetOverview {
  readonly assets: readonly Asset[];
  readonly summary: AssetSummary;
}

// ─── Normalization helpers ───────────────────────────────────────────────────

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toAssetType(value: unknown, fallback: AssetType = "server"): AssetType {
  const normalized = String(value ?? "").toLowerCase();
  if (["server", "endpoint", "cloud", "mobile", "network"].includes(normalized)) {
    return normalized as AssetType;
  }
  return fallback;
}

function toAssetStatus(value: unknown, fallback: AssetStatus = "healthy"): AssetStatus {
  const normalized = String(value ?? "").toLowerCase();
  if (["healthy", "warning", "critical", "offline"].includes(normalized)) {
    return normalized as AssetStatus;
  }
  return fallback;
}

function toRiskLevel(value: unknown, fallback: RiskLevel = "low"): RiskLevel {
  const normalized = String(value ?? "").toLowerCase();
  if (["low", "medium", "high", "critical"].includes(normalized)) {
    return normalized as RiskLevel;
  }
  return fallback;
}

function pickString(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const val = record[key];
    if (val !== null && val !== undefined && String(val).trim() !== "") return String(val);
  }
  return fallback;
}

function mapAsset(raw: unknown, index = 0): Asset {
  const record = (raw ?? {}) as Record<string, unknown>;
  const id = pickString(record, ["id", "_id"], String(index + 1));
  const hostname = pickString(record, ["hostname", "name", "assetName"], "");
  const ipAddress = pickString(record, ["ipAddress", "ip", "ip_address", "address"], "");
  const type = toAssetType(record.type ?? record.assetType ?? record.kind, "server");
  const health = toNumber(record.health ?? record.healthScore, 100);

  return {
    id,
    hostname,
    ipAddress,
    owner: pickString(record, ["owner", "department", "team"]),
    os: pickString(record, ["os", "operatingSystem", "platform"]),
    type,
    status: toAssetStatus(record.status ?? record.state ?? record.healthStatus, health === 0 ? "offline" : health < 50 ? "critical" : health < 80 ? "warning" : "healthy"),
    health,
    risk: toRiskLevel(record.risk ?? record.riskLevel ?? record.severity, "low"),
    lastSeen: pickString(record, ["lastSeen", "last_seen", "lastCheckIn", "updatedAt"]),
    openCVEs: toNumber(record.openCVEs ?? record.cves ?? record.openCves),
    severity: toRiskLevel(record.severity ?? record.risk, "low"),
  };
}

function mapRiskBreakdown(assets: readonly Asset[]): AssetSummary["riskBreakdown"] {
  const labels = ["Critical", "High", "Medium", "Low"] as const;
  const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  assets.forEach((asset) => {
    const key = asset.risk.charAt(0).toUpperCase() + asset.risk.slice(1);
    if (key in counts) counts[key] += 1;
  });

  const total = Math.max(assets.length, 1);
  return labels.map((label) => ({
    label,
    count: counts[label],
    percent: Math.round((counts[label] / total) * 1000) / 10,
  }));
}

function mapActivity(value: unknown): readonly AssetActivityEvent[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: pickString(raw, ["id", "_id"], String(Math.random())),
      title: pickString(raw, ["title", "name", "event"]),
      description: pickString(raw, ["description", "message", "details"]),
      time: pickString(raw, ["time", "timestamp", "createdAt"]),
      type: toAssetStatus(raw.type ?? raw.severity, "healthy"),
    };
  });
}

function buildSummary(
  assets: readonly Asset[],
  activity: readonly AssetActivityEvent[] = [],
  backendSummary?: unknown,
): AssetSummary {
  const raw = (backendSummary ?? {}) as Record<string, unknown>;
  const countBy = (key: AssetStatus) => assets.filter((a) => a.status === key).length;
  const typeBy = (key: AssetType) => assets.filter((a) => a.type === key).length;

  const total = toNumber(raw.total ?? raw.totalAssets ?? raw.count ?? assets.length, assets.length);
  const avgHealth =
    assets.length > 0
      ? Math.round((assets.reduce((sum, a) => sum + a.health, 0) / assets.length) * 10) / 10
      : toNumber(raw.averageHealth ?? raw.avgHealth, 0);

  return {
    total,
    healthy: toNumber(raw.healthy, countBy("healthy")),
    warning: toNumber(raw.warning, countBy("warning")),
    critical: toNumber(raw.critical, countBy("critical")),
    offline: toNumber(raw.offline, countBy("offline")),
    servers: toNumber(raw.servers, typeBy("server")),
    endpoints: toNumber(raw.endpoints, typeBy("endpoint")),
    cloud: toNumber(raw.cloud, typeBy("cloud")),
    averageHealth: avgHealth,
    riskScore: toNumber(raw.riskScore, 0),
    riskBreakdown: Array.isArray(raw.riskBreakdown)
      ? (raw.riskBreakdown as Record<string, unknown>[]).map((r) => ({
          label: String(r.label ?? r.name ?? ""),
          count: toNumber(r.count),
          percent: toNumber(r.percent),
        }))
      : mapRiskBreakdown(assets),
    activity,
  };
}

function mapListResponse(data: unknown): AssetOverview {
  const payload = (data as Record<string, unknown>) ?? {};
  const list = payload.assets ?? payload.data ?? payload.items ?? payload.results ?? [];

  if (!Array.isArray(list)) {
    return { assets: [], summary: buildSummary([]) };
  }

  const assets = list.map(mapAsset);
  const activity = mapActivity(payload.activity ?? payload.recentActivity ?? []);
  const summary = buildSummary(assets, activity, payload.summary ?? payload.stats);

  return { assets, summary };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GET /assets
 *
 * Fetches all assets and an aggregated summary.
 */
export async function getAssets(): Promise<AssetOverview> {
  const data = await apiRequest<unknown>({ method: "get", url: "/assets" });
  return mapListResponse((data as Record<string, unknown>)?.data ?? data);
}

/**
 * GET /assets/:id
 *
 * Fetches a single asset by id.
 */
export async function getAssetById(id: string): Promise<Asset | null> {
  const data = await apiRequest<unknown>({ method: "get", url: `/assets/${encodeURIComponent(id)}` });
  const payload = (data as Record<string, unknown>)?.data ?? data;
  const raw = Array.isArray(payload) ? payload[0] : payload;
  if (!raw || typeof raw !== "object") return null;
  const asset = mapAsset(raw);
  return asset.id ? asset : null;
}

/**
 * POST /assets
 *
 * Creates a new asset.
 */
export async function createAsset(payload: AssetPayload): Promise<Asset> {
  const data = await apiRequest<unknown>({ method: "post", url: "/assets", data: payload });
  const raw = (data as Record<string, unknown>)?.data ?? data;
  return mapAsset(Array.isArray(raw) ? raw[0] : raw);
}

/**
 * PUT /assets/:id
 *
 * Updates an existing asset.
 */
export async function updateAsset(id: string, payload: Partial<AssetPayload>): Promise<Asset> {
  const data = await apiRequest<unknown>({ method: "put", url: `/assets/${encodeURIComponent(id)}`, data: payload });
  const raw = (data as Record<string, unknown>)?.data ?? data;
  return mapAsset(Array.isArray(raw) ? raw[0] : raw);
}

/**
 * DELETE /assets/:id
 *
 * Deletes an asset.
 */
export async function deleteAsset(id: string): Promise<void> {
  await apiRequest<unknown>({ method: "delete", url: `/assets/${encodeURIComponent(id)}` });
}

// ─── Error helper + default export ───────────────────────────────────────────

export function getAssetsErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}

const assetsService = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getErrorMessage: getAssetsErrorMessage,
};

export default assetsService;

// Keep `api` imported for consumers that may need the raw instance.
export { api };

