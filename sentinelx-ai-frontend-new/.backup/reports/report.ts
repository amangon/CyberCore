/**
 * @file report.ts
 * @description Core type definitions for the SentinelX AI reporting module.
 * Covers report lifecycle, content structure, scheduling, access control,
 * and dashboard aggregation — no business logic included.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Lifecycle state of a report. */
export enum ReportStatus {
  DRAFT     = "DRAFT",
  GENERATING = "GENERATING",
  COMPLETED  = "COMPLETED",
  FAILED     = "FAILED",
  SCHEDULED  = "SCHEDULED",
  ARCHIVED   = "ARCHIVED",
}

/** High-level classification of a report's purpose. */
export enum ReportType {
  EXECUTIVE      = "EXECUTIVE",
  THREAT         = "THREAT",
  INCIDENT       = "INCIDENT",
  ASSET          = "ASSET",
  COMPLIANCE     = "COMPLIANCE",
  VULNERABILITY  = "VULNERABILITY",
  IOC            = "IOC",
  MITRE          = "MITRE",
  SECURITY_SCORE = "SECURITY_SCORE",
  CUSTOM         = "CUSTOM",
}

/** Output format for an exported report. */
export enum ReportFormat {
  PDF  = "PDF",
  CSV  = "CSV",
  JSON = "JSON",
  XLSX = "XLSX",
}

/** Standardised severity classification used across findings and metrics. */
export enum Severity {
  LOW      = "LOW",
  MEDIUM   = "MEDIUM",
  HIGH     = "HIGH",
  CRITICAL = "CRITICAL",
}

/** Supported compliance frameworks. */
export enum ComplianceFramework {
  ISO27001 = "ISO27001",
  NIST     = "NIST",
  CIS      = "CIS",
  PCI_DSS  = "PCI_DSS",
  SOC2     = "SOC2",
  HIPAA    = "HIPAA",
  GDPR     = "GDPR",
  CISA     = "CISA",
}

// ---------------------------------------------------------------------------
// Supporting interfaces
// ---------------------------------------------------------------------------

/** Identity of the user who authored or owns the report. */
export interface ReportAuthor {
  /** Unique user identifier. */
  readonly id: string;
  /** Display name shown in the report header. */
  readonly name: string;
  /** Business email address. */
  readonly email: string;
  /** Job title or role (e.g. "CISO", "SOC Analyst"). */
  readonly title?: string;
  /** URL to the author's avatar image. */
  readonly avatarUrl?: string;
}

/** Organisational unit that owns or requested the report. */
export interface ReportDepartment {
  /** Unique department identifier. */
  readonly id: string;
  /** Human-readable department name. */
  readonly name: string;
  /** Optional parent or business unit label. */
  readonly division?: string;
  /** Primary contact email for the department. */
  readonly contactEmail?: string;
}

/** Recurrence and delivery configuration for scheduled reports. */
export interface ReportSchedule {
  /** Indicates whether the schedule is active. */
  readonly enabled: boolean;
  /** Cron expression defining the recurrence pattern (e.g. "0 8 * * 1"). */
  readonly cronExpression: string;
  /** IANA timezone string (e.g. "America/New_York"). */
  readonly timezone: string;
  /** ISO 8601 datetime for the next scheduled run. */
  readonly nextRunAt: string;
  /** ISO 8601 datetime of the most recent successful run. */
  readonly lastRunAt?: string;
  /** Email addresses to notify upon completion. */
  readonly notifyEmails: readonly string[];
  /** Whether to automatically archive the previous version on each run. */
  readonly autoArchive: boolean;
}

/** Reusable layout or content template for generating reports. */
export interface ReportTemplate {
  /** Unique template identifier. */
  readonly id: string;
  /** Human-readable template name. */
  readonly name: string;
  /** Short description of the template's purpose. */
  readonly description?: string;
  /** Report type this template targets. */
  readonly type: ReportType;
  /** Ordered list of section keys included in this template. */
  readonly sections: readonly string[];
  /** Whether this template is visible to all users. */
  readonly isPublic: boolean;
  /** Author who created the template. */
  readonly createdBy: string;
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string;
}

/** Visualisation element embedded within a report. */
export interface ReportChart {
  /** Unique chart identifier within the report. */
  readonly id: string;
  /** Display title rendered above the chart. */
  readonly title: string;
  /** Chart variant (e.g. "bar", "line", "pie", "heatmap"). */
  readonly chartType: string;
  /** Serialised data payload consumed by the renderer. */
  readonly data: Record<string, unknown>;
  /** Optional description or caption displayed below the chart. */
  readonly description?: string;
  /** Display width as a percentage of the container (1–100). */
  readonly widthPercent?: number;
}

/** Configurable dashboard-style widget embedded in a report. */
export interface ReportWidget {
  /** Unique widget identifier within the report. */
  readonly id: string;
  /** Display title for the widget. */
  readonly title: string;
  /** Widget variant (e.g. "stat", "gauge", "timeline"). */
  readonly widgetType: string;
  /** Serialised configuration for the widget renderer. */
  readonly config: Record<string, unknown>;
  /** Grid column position (zero-based). */
  readonly column?: number;
  /** Grid row position (zero-based). */
  readonly row?: number;
}

/** Tabular data section within a report. */
export interface ReportTable {
  /** Unique table identifier within the report. */
  readonly id: string;
  /** Display title rendered above the table. */
  readonly title: string;
  /** Ordered column header labels. */
  readonly columns: readonly string[];
  /** Row data; each row maps column labels to cell values. */
  readonly rows: readonly Record<string, string | number | boolean | null>[];
  /** Optional footer annotations (e.g. totals, averages). */
  readonly footnote?: string;
}

/** A single measured data point included in a report. */
export interface ReportMetric {
  /** Metric label or name. */
  readonly label: string;
  /** Current numeric or string value of the metric. */
  readonly value: number | string;
  /** Unit of measure (e.g. "ms", "%", "count"). */
  readonly unit?: string;
  /** Comparison value from the previous period. */
  readonly previousValue?: number | string;
  /** Percentage change relative to the previous period. */
  readonly changePercent?: number;
  /** Severity classification for threshold-based colouring. */
  readonly severity?: Severity;
}

/** Key performance indicator tracked across reporting periods. */
export interface ReportKPI {
  /** Unique KPI identifier. */
  readonly id: string;
  /** KPI name (e.g. "Mean Time to Detect"). */
  readonly name: string;
  /** Short description of what this KPI measures. */
  readonly description?: string;
  /** Current KPI value. */
  readonly value: number;
  /** Target or threshold value for this KPI. */
  readonly target: number;
  /** Unit of measure (e.g. "hours", "%"). */
  readonly unit: string;
  /** Trend direction: positive movement, negative, or flat. */
  readonly trend: "up" | "down" | "stable";
  /** ISO 8601 timestamp of the last measurement. */
  readonly measuredAt: string;
}

/** Filter criteria applied when generating a report. */
export interface ReportFilter {
  /** ISO 8601 start of the reporting window. */
  readonly dateFrom?: string;
  /** ISO 8601 end of the reporting window. */
  readonly dateTo?: string;
  /** Restrict results to specific severity levels. */
  readonly severities?: readonly Severity[];
  /** Restrict results to specific asset identifiers. */
  readonly assetIds?: readonly string[];
  /** Restrict results to assets in specific network segments. */
  readonly networkSegments?: readonly string[];
  /** Restrict results to specific compliance frameworks. */
  readonly frameworks?: readonly ComplianceFramework[];
  /** Free-text search term applied to titles and descriptions. */
  readonly searchQuery?: string;
  /** Additional arbitrary key-value filter parameters. */
  readonly custom?: Record<string, string | number | boolean>;
}

/** AI-generated or analyst-authored insight derived from report data. */
export interface ReportInsight {
  /** Unique insight identifier. */
  readonly id: string;
  /** Short summary of the insight. */
  readonly title: string;
  /** Detailed explanation of the finding. */
  readonly description: string;
  /** Severity level associated with the insight. */
  readonly severity: Severity;
  /** Source category (e.g. "AI", "Analyst", "Automated Scan"). */
  readonly source: string;
  /** Related entity identifiers (assets, incidents, CVEs). */
  readonly relatedIds?: readonly string[];
  /** ISO 8601 timestamp when the insight was generated. */
  readonly generatedAt: string;
}

/** Actionable recommendation produced from report findings. */
export interface ReportRecommendation {
  /** Unique recommendation identifier. */
  readonly id: string;
  /** Short title summarising the recommended action. */
  readonly title: string;
  /** Full description including rationale and implementation guidance. */
  readonly description: string;
  /** Priority level. */
  readonly priority: Severity;
  /** Estimated remediation effort (e.g. "Low", "Medium", "High"). */
  readonly effort: "Low" | "Medium" | "High";
  /** Expected impact after remediation (e.g. "Low", "Medium", "High"). */
  readonly impact: "Low" | "Medium" | "High";
  /** Current implementation status. */
  readonly status: "Open" | "In Progress" | "Resolved" | "Accepted Risk";
  /** Compliance frameworks addressed by this recommendation. */
  readonly frameworks?: readonly ComplianceFramework[];
  /** ISO 8601 target date for resolution. */
  readonly dueDate?: string;
}

// ---------------------------------------------------------------------------
// Section summaries
// ---------------------------------------------------------------------------

/** High-level narrative intended for C-suite or board audiences. */
export interface ExecutiveSummary {
  /** Opening paragraph giving overall posture context. */
  readonly overview: string;
  /** Quantified overall security posture score (0–100). */
  readonly overallPosture: number;
  /** Count of critical findings requiring immediate action. */
  readonly criticalFindings: number;
  /** Top-priority risks surfaced during the reporting period. */
  readonly topRisks: readonly string[];
  /** Notable improvements observed since the last reporting period. */
  readonly improvements: readonly string[];
  /** Metrics and KPIs highlighted for executive review. */
  readonly keyMetrics: readonly ReportMetric[];
  /** Strategic recommendations targeted at leadership. */
  readonly strategicRecommendations: readonly string[];
}

/** Aggregated threat intelligence and detection statistics. */
export interface ThreatSummary {
  /** Total threat events detected during the reporting period. */
  readonly totalThreats: number;
  /** Count of threats classified as CRITICAL. */
  readonly criticalThreats: number;
  /** Count of threats classified as HIGH. */
  readonly highThreats: number;
  /** Count of threats classified as MEDIUM. */
  readonly mediumThreats: number;
  /** Count of threats classified as LOW. */
  readonly lowThreats: number;
  /** Top threat categories identified (e.g. "Ransomware", "Phishing"). */
  readonly topThreatCategories: readonly string[];
  /** Geographic origins of observed threats (country codes). */
  readonly geographicOrigins: readonly string[];
  /** Average time from detection to containment, in minutes. */
  readonly meanTimeToDetect: number;
  /** Average time from detection to full remediation, in minutes. */
  readonly meanTimeToRespond: number;
  /** Trend direction compared with the previous reporting period. */
  readonly trend: "improving" | "worsening" | "stable";
}

/** Aggregate statistics for security incidents within the reporting period. */
export interface IncidentSummary {
  /** Total number of incidents recorded. */
  readonly totalIncidents: number;
  /** Incidents currently open and under investigation. */
  readonly openIncidents: number;
  /** Incidents fully resolved during the period. */
  readonly resolvedIncidents: number;
  /** Incidents in active containment or remediation. */
  readonly inProgressIncidents: number;
  /** Average severity score across all incidents (0–100). */
  readonly averageSeverityScore: number;
  /** Incident identifiers for the most severe or impactful events. */
  readonly topIncidentIds: readonly string[];
  /** Average time from incident detection to full resolution, in hours. */
  readonly averageResolutionTimeHours: number;
  /** Count of incidents that escalated to a major incident status. */
  readonly escalatedCount: number;
}

/** Summary of the monitored asset inventory. */
export interface AssetSummary {
  /** Total number of assets under management. */
  readonly totalAssets: number;
  /** Assets with an active CRITICAL or HIGH vulnerability. */
  readonly criticalAssets: number;
  /** Assets currently unreachable or offline. */
  readonly offlineAssets: number;
  /** Assets without a recent patch or configuration update. */
  readonly unmonitoredAssets: number;
  /** Distribution of assets by type (e.g. { "Server": 120, "Endpoint": 340 }). */
  readonly assetsByType: Record<string, number>;
  /** Distribution of assets by network segment. */
  readonly assetsBySegment: Record<string, number>;
  /** Percentage of the asset inventory covered by monitoring tooling. */
  readonly coveragePercent: number;
  /** Count of newly discovered assets since the last report. */
  readonly newlyDiscovered: number;
}

/** Compliance posture across one or more frameworks. */
export interface ComplianceSummary {
  /** Frameworks assessed in this report. */
  readonly frameworks: readonly ComplianceFramework[];
  /** Overall compliance score across all assessed frameworks (0–100). */
  readonly overallScore: number;
  /** Per-framework compliance scores. */
  readonly frameworkScores: Record<ComplianceFramework, number>;
  /** Number of controls that passed assessment. */
  readonly passedControls: number;
  /** Number of controls that failed assessment. */
  readonly failedControls: number;
  /** Number of controls not yet assessed. */
  readonly notAssessedControls: number;
  /** Controls with the most critical gaps. */
  readonly topGaps: readonly string[];
  /** ISO 8601 date of the next scheduled compliance review. */
  readonly nextReviewDate?: string;
}

/** Coverage statistics mapped to the MITRE ATT&CK framework. */
export interface MitreCoverage {
  /** Total number of MITRE tactics relevant to the environment. */
  readonly totalTactics: number;
  /** Number of tactics with at least one detective or preventive control. */
  readonly coveredTactics: number;
  /** Total number of MITRE techniques assessed. */
  readonly totalTechniques: number;
  /** Number of techniques with active coverage. */
  readonly coveredTechniques: number;
  /** Coverage percentage across all assessed techniques (0–100). */
  readonly coveragePercent: number;
  /** Tactic IDs identified as the highest-priority gaps. */
  readonly topGapTactics: readonly string[];
  /** Tactic IDs with the strongest detection capability. */
  readonly strongestTactics: readonly string[];
}

/** Statistics for a specific CVE within the reporting period. */
export interface CVEStatistic {
  /** CVE identifier (e.g. "CVE-2024-12345"). */
  readonly cveId: string;
  /** Human-readable vulnerability description. */
  readonly description: string;
  /** CVSS base score (0.0–10.0). */
  readonly cvssScore: number;
  /** Severity classification derived from the CVSS score. */
  readonly severity: Severity;
  /** Number of assets affected by this CVE. */
  readonly affectedAssets: number;
  /** Whether a public exploit is known to exist. */
  readonly exploitAvailable: boolean;
  /** Whether a patch or official fix is available. */
  readonly patchAvailable: boolean;
  /** ISO 8601 date the CVE was published. */
  readonly publishedAt: string;
}

/** Aggregated statistics for a category of Indicators of Compromise. */
export interface IOCStatistic {
  /** IOC category (e.g. "IP Address", "Domain", "File Hash", "URL"). */
  readonly type: string;
  /** Total number of unique IOCs observed. */
  readonly total: number;
  /** IOCs confirmed malicious through threat intelligence correlation. */
  readonly malicious: number;
  /** IOCs flagged as suspicious but not yet confirmed. */
  readonly suspicious: number;
  /** IOCs that were proactively blocked by security controls. */
  readonly blocked: number;
  /** Top IOC values observed (e.g. most-seen IP addresses). */
  readonly topIndicators: readonly string[];
}

/** Computed security posture score for an entity or the organisation. */
export interface SecurityScore {
  /** Numeric score (0–100; higher is better). */
  readonly score: number;
  /** Categorical band derived from the score (e.g. "Good", "Fair", "Poor"). */
  readonly grade: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  /** Change in score relative to the previous reporting period. */
  readonly delta: number;
  /** Category-level score breakdown (e.g. { "Endpoint": 78, "Network": 65 }). */
  readonly breakdown: Record<string, number>;
  /** ISO 8601 timestamp of the last score calculation. */
  readonly calculatedAt: string;
}

/** Quantified risk exposure for an entity or the organisation. */
export interface RiskScore {
  /** Numeric risk score (0–100; lower is better). */
  readonly score: number;
  /** Categorical risk level. */
  readonly level: "Low" | "Medium" | "High" | "Critical";
  /** Change in risk score relative to the previous reporting period. */
  readonly delta: number;
  /** Risk score breakdown by category (e.g. { "Vulnerability": 45, "Threat": 30 }). */
  readonly breakdown: Record<string, number>;
  /** Primary risk drivers contributing to the current score. */
  readonly topRiskFactors: readonly string[];
  /** ISO 8601 timestamp of the last risk calculation. */
  readonly calculatedAt: string;
}

// ---------------------------------------------------------------------------
// Report management interfaces
// ---------------------------------------------------------------------------

/** Custom branding applied to exported report documents. */
export interface ReportBranding {
  /** URL to the organisation's logo image. */
  readonly logoUrl?: string;
  /** Primary brand colour as a hex string (e.g. "#0A74DA"). */
  readonly primaryColor?: string;
  /** Secondary brand colour as a hex string. */
  readonly secondaryColor?: string;
  /** Legal or classification footer text rendered on each page. */
  readonly footerText?: string;
  /** Confidentiality or classification label (e.g. "CONFIDENTIAL"). */
  readonly classificationLabel?: string;
  /** Whether to include the SentinelX AI platform watermark. */
  readonly showWatermark: boolean;
}

/** Configuration options for exporting a report. */
export interface ReportExportOptions {
  /** Target export format. */
  readonly format: ReportFormat;
  /** Whether to encrypt the exported file. */
  readonly encrypt: boolean;
  /** Password used for file-level encryption (omitted when not encrypted). */
  readonly password?: string;
  /** Whether to apply branding to the exported document. */
  readonly includeBranding: boolean;
  /** Whether to include raw data appendices in the export. */
  readonly includeRawData: boolean;
  /** Whether to include chart images in the export. */
  readonly includeCharts: boolean;
  /** Specific section keys to include; omit to export all sections. */
  readonly sections?: readonly string[];
}

/** An immutable audit record of a status transition or update to a report. */
export interface ReportHistory {
  /** Unique history entry identifier. */
  readonly id: string;
  /** Previous report status before this transition. */
  readonly previousStatus?: ReportStatus;
  /** New report status after this transition. */
  readonly newStatus: ReportStatus;
  /** Human-readable description of the change. */
  readonly action: string;
  /** Identifier of the user who performed the action. */
  readonly performedBy: string;
  /** ISO 8601 timestamp of the action. */
  readonly performedAt: string;
  /** Optional additional context about the change. */
  readonly notes?: string;
}

/** A file or artefact attached to a report. */
export interface ReportAttachment {
  /** Unique attachment identifier. */
  readonly id: string;
  /** Original filename including extension. */
  readonly fileName: string;
  /** MIME type of the attached file. */
  readonly mimeType: string;
  /** File size in bytes. */
  readonly sizeBytes: number;
  /** Secure URL for downloading the attachment. */
  readonly downloadUrl: string;
  /** SHA-256 hash of the file for integrity verification. */
  readonly sha256Hash: string;
  /** Identifier of the user who uploaded the attachment. */
  readonly uploadedBy: string;
  /** ISO 8601 timestamp of the upload. */
  readonly uploadedAt: string;
}

/** An analyst or stakeholder comment thread entry on a report. */
export interface ReportComment {
  /** Unique comment identifier. */
  readonly id: string;
  /** Identifier of the user who authored the comment. */
  readonly authorId: string;
  /** Display name of the comment author. */
  readonly authorName: string;
  /** Markdown-formatted comment body. */
  readonly body: string;
  /** Parent comment identifier for threaded replies. */
  readonly parentId?: string;
  /** Whether the comment has been marked as resolved. */
  readonly resolved: boolean;
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string;
  /** ISO 8601 timestamp of the last edit, if applicable. */
  readonly updatedAt?: string;
}

/** A record of a report being shared with an individual or group. */
export interface ReportShare {
  /** Unique share record identifier. */
  readonly id: string;
  /** Identifier of the recipient user or service account. */
  readonly recipientId: string;
  /** Email address the share notification was sent to. */
  readonly recipientEmail: string;
  /** Level of access granted to the recipient. */
  readonly accessLevel: "View" | "Comment" | "Edit";
  /** ISO 8601 expiry datetime; no expiry when omitted. */
  readonly expiresAt?: string;
  /** ISO 8601 timestamp when the share was created. */
  readonly sharedAt: string;
  /** Identifier of the user who created the share. */
  readonly sharedBy: string;
}

/** Access-control entry governing a user's permissions on a report. */
export interface ReportPermission {
  /** Identifier of the user or role this entry applies to. */
  readonly principalId: string;
  /** Whether the principal is a role (true) or an individual user (false). */
  readonly isRole: boolean;
  /** Whether the principal can view the report. */
  readonly canView: boolean;
  /** Whether the principal can add or edit comments. */
  readonly canComment: boolean;
  /** Whether the principal can modify report content or settings. */
  readonly canEdit: boolean;
  /** Whether the principal can export the report. */
  readonly canExport: boolean;
  /** Whether the principal can delete the report. */
  readonly canDelete: boolean;
  /** Whether the principal can manage permissions for other users. */
  readonly canShare: boolean;
}

// ---------------------------------------------------------------------------
// Main Report interface
// ---------------------------------------------------------------------------

/**
 * Canonical representation of a SentinelX AI report.
 * Combines lifecycle metadata, content sections, access control,
 * and collaboration artefacts into a single top-level entity.
 */
export interface Report {
  /** Internal UUID primary key. */
  readonly id: string;
  /** Human-readable report identifier (e.g. "RPT-2024-001"). */
  readonly reportId: string;
  /** Report title displayed in listings and document headers. */
  readonly title: string;
  /** Optional long-form description of the report's scope and purpose. */
  readonly description?: string;
  /** Current lifecycle status of the report. */
  readonly status: ReportStatus;
  /** Classification of the report's primary subject matter. */
  readonly type: ReportType;
  /** Output format for the exported document. */
  readonly format: ReportFormat;
  /** User who created or owns the report. */
  readonly author: ReportAuthor;
  /** Organisational unit that owns or requested the report. */
  readonly department: ReportDepartment;
  /** ISO 8601 timestamp when the report record was created. */
  readonly createdAt: string;
  /** ISO 8601 timestamp of the most recent update to the report. */
  readonly updatedAt: string;
  /** ISO 8601 timestamp when report content was last generated. */
  readonly generatedAt?: string;
  /** ISO 8601 timestamp for the next scheduled generation. */
  readonly scheduledAt?: string;
  /** Active schedule configuration, if the report runs on a recurring basis. */
  readonly schedule?: ReportSchedule;
  /** Filters applied during report generation. */
  readonly filters?: ReportFilter;
  /** Branding configuration applied to exported documents. */
  readonly branding?: ReportBranding;
  /** Overall security posture score for the reporting period. */
  readonly securityScore?: SecurityScore;
  /** Quantified risk exposure for the reporting period. */
  readonly riskScore?: RiskScore;
  /** C-suite narrative and top-line metrics. */
  readonly executiveSummary?: ExecutiveSummary;
  /** Aggregated threat intelligence and detection statistics. */
  readonly threatSummary?: ThreatSummary;
  /** Incident statistics and resolution metrics. */
  readonly incidentSummary?: IncidentSummary;
  /** Asset inventory coverage and health summary. */
  readonly assetSummary?: AssetSummary;
  /** Compliance posture across assessed frameworks. */
  readonly complianceSummary?: ComplianceSummary;
  /** MITRE ATT&CK coverage mapping. */
  readonly mitreCoverage?: MitreCoverage;
  /** CVE-level vulnerability statistics. */
  readonly cveStatistics?: readonly CVEStatistic[];
  /** IOC category statistics for the reporting period. */
  readonly iocStatistics?: readonly IOCStatistic[];
  /** Prioritised actionable recommendations derived from findings. */
  readonly recommendations?: readonly ReportRecommendation[];
  /** AI-generated or analyst-authored insights. */
  readonly insights?: readonly ReportInsight[];
  /** Embedded chart visualisations. */
  readonly charts?: readonly ReportChart[];
  /** Embedded tabular data sections. */
  readonly tables?: readonly ReportTable[];
  /** Embedded dashboard-style widgets. */
  readonly widgets?: readonly ReportWidget[];
  /** Immutable audit trail of status transitions and updates. */
  readonly history?: readonly ReportHistory[];
  /** Files and artefacts attached to the report. */
  readonly attachments?: readonly ReportAttachment[];
  /** Analyst and stakeholder comments. */
  readonly comments?: readonly ReportComment[];
  /** Records of shares sent to individuals or groups. */
  readonly shares?: readonly ReportShare[];
  /** Access-control entries for users and roles. */
  readonly permissions?: readonly ReportPermission[];
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/**
 * Aggregated statistics for the reports dashboard.
 * Provides a quick snapshot of reporting activity and security posture.
 */
export interface DashboardSummary {
  /** Total number of report records across all statuses. */
  readonly totalReports: number;
  /** Reports that completed generation within the current calendar day. */
  readonly generatedToday: number;
  /** Reports currently in SCHEDULED status. */
  readonly scheduledReports: number;
  /** Reports of type EXECUTIVE across all statuses. */
  readonly executiveReports: number;
  /** Current organisation-wide security score snapshot. */
  readonly securityScore: SecurityScore;
  /** Current organisation-wide risk score snapshot. */
  readonly riskScore: RiskScore;
  /** Aggregate compliance score across all active frameworks (0–100). */
  readonly complianceScore: number;
  /** Number of distinct assets referenced across all completed reports. */
  readonly assetsCovered: number;
  /** Number of distinct incidents covered in completed reports. */
  readonly incidentsCovered: number;
  /** Total number of completed THREAT type reports. */
  readonly threatReports: number;
}