/**
 * Shared security-domain types used across the SentinelX AI frontend.
 *
 * These types map to the existing UI data shapes AND common backend
 * response formats. Field names follow the backend where possible, with
 * optional aliases to accommodate different naming conventions.
 */

// ─── Enums / Unions ──────────────────────────────────────────────────────────

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type RiskLevel = "critical" | "high" | "medium" | "low";
export type AlertStatus = "open" | "investigating" | "resolved" | "suppressed";
export type IncidentStatus = "open" | "investigating" | "contained" | "resolved" | "closed";
export type AssetStatus = "healthy" | "warning" | "critical" | "offline";
export type AssetType = "server" | "endpoint" | "cloud" | "mobile" | "network";
export type ScanType = "file" | "url" | "ip" | "hash";
export type ScanStatus = "safe" | "suspicious" | "malicious";
export type ThreatLevel = "low" | "medium" | "high" | "critical";
export type IOCType = "ip" | "domain" | "url" | "hash" | "email";

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardSecurityScore {
  readonly score: number;
  readonly label?: string;
  readonly changePercent?: number;
  readonly threatsBlocked?: number;
  readonly systemsProtected?: number;
  readonly lastUpdated?: string;
}

export interface DashboardThreatLevel {
  readonly level: ThreatLevel;
  readonly score: number;
  readonly activeThreats?: number;
  readonly blockedAttacks?: number;
  readonly lastUpdated?: string;
}

export interface DashboardAssetOverview {
  readonly totalAssets: number;
  readonly healthy: number;
  readonly warning: number;
  readonly critical: number;
  readonly offline: number;
  readonly averageHealth?: number;
  readonly riskScore?: number;
}

export interface DashboardIncidentSummary {
  readonly total: number;
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
  readonly investigating: number;
  readonly resolvedToday: number;
}

export interface DashboardRecentAlert {
  readonly id: string;
  readonly title: string;
  readonly severity: Severity;
  readonly source: string;
  readonly createdAt: string;
}

export interface DashboardRecentScan {
  readonly id: string;
  readonly target: string;
  readonly type: ScanType;
  readonly status: ScanStatus;
  readonly riskScore: number;
  readonly createdAt: string;
}

export interface DashboardAiInsights {
  readonly predictedRisk: ThreatLevel;
  readonly confidence: number;
  readonly recommendations: readonly string[];
  readonly newThreatsDetected: number;
  readonly potentialImpact: string;
  readonly modelStatus?: string;
  readonly summary?: string;
}

/**
 * Aggregated response of `GET /dashboard`.
 * All fields optional so the backend can return a partial payload safely.
 */
export interface DashboardData {
  /** Counts of various entities */
  readonly counts?: {
    users: number;
    organizations: number;
    teams: number;
    assets: number;
    alerts: number;
    incidents: number;
    cases: number;
    threatIntelligence: number;
    iocs: number;
    vulnerabilities: number;
    yaraRules: number;
  };
/** Recent activity items */
  readonly recentActivity?: {
    alerts: any[];
    incidents: any[];
    cases: any[];
    scans?: any[];
  };
  /** Analytics data */
  readonly analytics?: {
    topThreats: Record<string, number>;
    severityDistribution: Record<string, number>;
    incidentStatusDistribution: Record<string, number>;
    assetTypeDistribution: Record<string, number>;
  };
  // Additional fields provided by the backend for dashboard widgets
  readonly securityScore?: DashboardSecurityScore | number;
  readonly threatLevel?: DashboardThreatLevel;
  readonly assetOverview?: DashboardAssetOverview;
  readonly incidentSummary?: DashboardIncidentSummary;
  readonly recentAlerts?: readonly DashboardRecentAlert[];
  readonly recentScans?: readonly DashboardRecentScan[];
  readonly aiInsights?: DashboardAiInsights;
  readonly threatFeed?: readonly ThreatItem[];
  readonly threatChart?: readonly ThreatTrendPoint[];
  readonly vulnerabilities?: readonly Vulnerability[];
  readonly lastUpdated?: string;
}

// ─── Threats / Threat Intelligence ───────────────────────────────────────────

export interface ThreatActor {
  readonly id: string;
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly origin?: string;
  readonly motivation?: string;
  readonly sophistication?: string;
  readonly activeSince?: string;
  readonly lastSeen?: string;
  readonly targets?: readonly string[];
  readonly tools?: readonly string[];
}

export interface MalwareFamily {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
  readonly severity: Severity;
  readonly detectionCount?: number;
  readonly firstSeen?: string;
  readonly lastSeen?: string;
  readonly platforms?: readonly string[];
  readonly behavior?: readonly string[];
}

export interface CVE {
  readonly id: string;
  readonly description?: string;
  readonly cvssScore: number;
  readonly cvssVector?: string;
  readonly publishedAt?: string;
  readonly modifiedAt?: string;
  readonly severity: Severity;
  readonly affectedAssets?: number;
  readonly exploitAvailable?: boolean;
  readonly knownExploited?: boolean;
}

export interface ThreatItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly type?: string;
  readonly severity: Severity;
  readonly source?: string;
  readonly country?: string;
  readonly coordinates?: readonly [number, number];
  readonly timestamp?: string;
  readonly status?: string;
  readonly tags?: readonly string[];
}

export interface ThreatTrendPoint {
  readonly timestamp: string;
  readonly value: number;
  readonly severity?: Severity;
}

// ─── Vulnerability ───────────────────────────────────────────────────────────

export interface Vulnerability {
  readonly id: string;
  readonly title: string;
  readonly cve?: string;
  readonly severity: Severity;
  readonly cvssScore?: number;
  readonly affectedAssets?: number;
  readonly status?: "open" | "in-progress" | "patched" | "mitigated" | "false-positive";
  readonly publishedAt?: string;
  readonly lastUpdated?: string;
  readonly description?: string;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export interface MitreTechnique {
  readonly id: string;
  readonly name: string;
  readonly tactic?: string;
  readonly url?: string;
}

export interface AlertTimelineEvent {
  readonly id: string;
  readonly timestamp: string;
  readonly type: "detection" | "escalation" | "action" | "comment" | "system";
  readonly actor: string;
  readonly description: string;
}

export interface AlertIOC {
  readonly id: string;
  readonly type: IOCType;
  readonly value: string;
  readonly confidence: "confirmed" | "likely" | "possible";
  readonly firstSeen?: string;
  readonly lastSeen?: string;
  readonly tags?: readonly string[];
}

export interface AlertEvidence {
  readonly id: string;
  readonly type: "log" | "pcap" | "screenshot" | "file" | "memory";
  readonly name: string;
  readonly size?: string;
  readonly collectedAt?: string;
  readonly collectedBy?: string;
  readonly hash?: string;
}

export interface AlertComment {
  readonly id: string;
  readonly author: string;
  readonly content: string;
  readonly timestamp: string;
  readonly edited?: boolean;
}

export interface AlertActivityEntry {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly timestamp: string;
  readonly metadata?: string;
}

export interface Alert {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly severity: Severity;
  readonly status: AlertStatus;
  readonly source?: string;
  readonly sourceCategory?: string;
  readonly affectedAsset?: string;
  readonly assetIP?: string;
  readonly assignedTo?: string;
  readonly riskScore?: number;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly tactics?: readonly MitreTechnique[];
  readonly timeline?: readonly AlertTimelineEvent[];
  readonly iocs?: readonly AlertIOC[];
  readonly evidence?: readonly AlertEvidence[];
  readonly comments?: readonly AlertComment[];
  readonly activity?: readonly AlertActivityEntry[];
  readonly aiSummary?: string;
  readonly recommendedActions?: readonly string[];
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export interface Asset {
  readonly id: string;
  readonly hostname: string;
  readonly ipAddress: string;
  readonly owner?: string;
  readonly os?: string;
  readonly type: AssetType;
  readonly status: AssetStatus;
  readonly health: number;
  readonly risk: RiskLevel;
  readonly lastSeen?: string;
  readonly openCVEs?: number;
  readonly severity?: RiskLevel;
}

// ─── Incidents ───────────────────────────────────────────────────────────────

export interface Incident {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly severity: Severity;
  readonly status: IncidentStatus;
  readonly affectedAsset?: string;
  readonly assignedTo?: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

// ─── Scans ───────────────────────────────────────────────────────────────────

export interface ScanRequest {
  readonly type: ScanType;
  readonly target: string;
}

/** Normalized per-provider scan status returned by the backend. */
export interface ProviderStatus {
  readonly provider: string;
  readonly label: string;
  readonly available: boolean;
  readonly success: boolean;
  /** Explicit provider status enum from the backend. */
  readonly status:
    | "completed"
    | "not_configured"
    | "authentication_failed"
    | "timeout"
    | "rate_limited"
    | "service_unavailable"
    | "network_error"
    | "no_match"
    | "idle"
    | "error"
    | string;
  readonly verdict: string;
  readonly confidence: number;
  readonly detections: number;
  readonly threatScore: number;
  readonly responseTime: number;
  readonly lastUpdated: string | null;
  readonly error: string | null;
}

export interface ScanResult {
  readonly id?: string;
  readonly target: string;
  readonly type: ScanType;
  readonly status: ScanStatus;
  readonly riskScore: number;
  readonly detectionStatus?: string;
  readonly threatLevel?: string;
  readonly threatFamily?: string;
  readonly detectionEngines?: string;
  readonly detectionCount?: string;
  readonly reputation?: string;
  readonly blacklistStatus?: string;
  readonly country?: string;
  readonly city?: string;
  readonly isp?: string;
  readonly asn?: string;
  readonly organization?: string;
  readonly connectionType?: string;
  readonly usageType?: string;
  readonly domain?: string;
  readonly hostnames?: string;
  readonly totalReports?: number;
  readonly positiveReports?: number;
  readonly lastReported?: string;
  readonly abuseScore?: number;
  readonly fileType?: string;
  readonly firstSeen?: string;
  readonly lastAnalysis?: string;
  readonly aiVerdict?: string;
  readonly createdAt?: string;
  /** Resolved IP address (for URL scans) */
  readonly ipAddress?: string;
  /** Server header (for URL scans) */
  readonly server?: string;
  /** Hosting country (for URL scans) */
  readonly hostingCountry?: string;
  /** Category (for URL scans) */
  readonly category?: string;
  /** SSL certificate info (for URL scans) */
  readonly sslInfo?: string;
/** Domain reputation (for URL scans) */
  readonly domainReputation?: string;
  /** Normalized per-provider statuses (for provider cards). */
  readonly providers?: readonly ProviderStatus[];
  readonly raw?: unknown;
}

export interface ScanRecord {
  readonly id: string;
  readonly target: string;
  readonly type: ScanType;
  readonly status: ScanStatus;
  readonly riskScore: number;
  readonly createdAt: string;
}

// ─── IOC Analysis ────────────────────────────────────────────────────────────

export interface IOCAnalysis {
  readonly indicator: string;
  readonly type: IOCType;
  readonly status: "clean" | "suspicious" | "malicious";
  readonly riskScore: number;
  readonly reputation?: string;
  readonly country?: string;
  readonly isp?: string;
  readonly blacklistStatus?: string;
  readonly abuseReports?: number;
  readonly threatLevel?: string;
  readonly tags?: readonly string[];
  readonly dnsRecords?: readonly { readonly type: string; readonly value: string }[];
  readonly whois?: Record<string, string>;
  readonly firstSeen?: string;
  readonly lastSeen?: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  readonly id: string;
  readonly title: string;
  readonly body?: string;
  readonly severity: Severity;
  readonly type?: "alert" | "incident" | "scan" | "system" | "report";
  readonly read?: boolean;
  readonly createdAt: string;
}

