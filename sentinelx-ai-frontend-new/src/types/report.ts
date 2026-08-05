/**
 * @file report.ts
 * @description Type definitions for the report builder and generated reports.
 * Used by reportMock.ts, ReportCard.tsx, ReportStats.tsx, and report components.
 */

import type { LucideIcon } from "lucide-react";

// ─── Enums / Unions ──────────────────────────────────────────────────────────

export enum ReportStatus {
  DRAFT = "draft",
  IN_REVIEW = "in_review",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum ReportType {
  EXECUTIVE = "executive",
  INCIDENT = "incident",
  VULNERABILITY = "vulnerability",
  COMPLIANCE = "compliance",
  THREAT_INTEL = "threat_intel",
  ASSET = "asset",
  CUSTOM = "custom",
}

export enum ReportFormat {
  PDF = "pdf",
  HTML = "html",
  EXCEL = "excel",
  CSV = "csv",
  JSON = "json",
}

export enum Severity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ComplianceFramework {
  SOC2 = "SOC 2",
  PCI_DSS = "PCI DSS",
  NIST = "NIST CSF",
  ISO27001 = "ISO 27001",
  GDPR = "GDPR",
  HIPAA = "HIPAA",
  CIS = "CIS Controls",
  CISA = "CISA BOD",
}

// ─── Core Types ──────────────────────────────────────────────────────────────

export interface ReportAuthor {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly title: string;
  readonly avatarUrl?: string;
}

export interface ReportDepartment {
  readonly id: string;
  readonly name: string;
  readonly division: string;
  readonly contactEmail: string;
}

export interface ReportBranding {
  readonly logoUrl: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly footerText: string;
  readonly classificationLabel: string;
  readonly showWatermark: boolean;
}

export interface ReportSchedule {
  readonly enabled: boolean;
  readonly cronExpression: string;
  readonly timezone: string;
  readonly nextRunAt: string;
  readonly lastRunAt: string;
  readonly notifyEmails: readonly string[];
  readonly autoArchive: boolean;
}

export interface ReportPermission {
  readonly userId: string;
  readonly role: "Owner" | "Editor" | "Viewer";
  readonly canEdit: boolean;
  readonly canShare: boolean;
  readonly canDelete: boolean;
}

export interface ReportShare {
  readonly id: string;
  readonly sharedWith: readonly string[];
  readonly sharedBy: string;
  readonly sharedAt: string;
  readonly linkUrl: string;
  readonly expiresAt: string | null;
}

export interface ReportHistory {
  readonly id: string;
  readonly action: string;
  readonly performedBy: string;
  readonly timestamp: string;
  readonly details: string;
}

export interface ReportAttachment {
  readonly id: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly sizeBytes: number;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
  readonly url: string;
}

export interface ReportComment {
  readonly id: string;
  readonly authorId: string;
  readonly content: string;
  readonly createdAt: string;
  readonly resolved: boolean;
}

export interface ReportKPI {
  readonly label: string;
  readonly value: number;
  readonly unit: string;
  readonly trend: "up" | "down" | "neutral";
  readonly severity: Severity;
}

// ─── Score Types ─────────────────────────────────────────────────────────────

export interface SecurityScore {
  readonly score: number;
  readonly grade: string;
  readonly delta: number;
  readonly breakdown: Record<string, number>;
  readonly calculatedAt: string;
}

export interface RiskScore {
  readonly score: number;
  readonly level: string;
  readonly delta: number;
  readonly breakdown: Record<string, number>;
  readonly topRiskFactors: readonly string[];
  readonly calculatedAt: string;
}

// ─── Summary Types ───────────────────────────────────────────────────────────

export interface ExecutiveSummary {
  readonly overview: string;
  readonly overallPosture: number;
  readonly criticalFindings: number;
  readonly topRisks: readonly string[];
  readonly improvements: readonly string[];
  readonly keyMetrics: readonly {
    label: string;
    value: number;
    unit: string;
    previousValue: number;
    changePercent: number;
    severity: Severity;
  }[];
  readonly strategicRecommendations: readonly string[];
}

export interface ThreatSummary {
  readonly totalThreats: number;
  readonly criticalThreats: number;
  readonly highThreats: number;
  readonly mediumThreats: number;
  readonly lowThreats: number;
  readonly topThreatCategories: readonly string[];
  readonly geographicOrigins: readonly string[];
  readonly meanTimeToDetect: number;
  readonly meanTimeToRespond: number;
  readonly trend: "improving" | "stable" | "worsening";
}

export interface IncidentSummary {
  readonly totalIncidents: number;
  readonly openIncidents: number;
  readonly resolvedIncidents: number;
  readonly inProgressIncidents: number;
  readonly averageSeverityScore: number;
  readonly topIncidentIds: readonly string[];
  readonly averageResolutionTimeHours: number;
  readonly escalatedCount: number;
}

export interface AssetSummary {
  readonly totalAssets: number;
  readonly criticalAssets: number;
  readonly offlineAssets: number;
  readonly unmonitoredAssets: number;
  readonly assetsByType: Record<string, number>;
  readonly assetsBySegment: Record<string, number>;
  readonly coveragePercent: number;
  readonly newlyDiscovered: number;
}

export interface ComplianceSummary {
  readonly frameworks: readonly ComplianceFramework[];
  readonly overallScore: number;
  readonly frameworkScores: Partial<Record<ComplianceFramework, number>>;
  readonly passedControls: number;
  readonly failedControls: number;
  readonly notAssessedControls: number;
  readonly topGaps: readonly string[];
  readonly nextReviewDate: string;
}

export interface MitreCoverage {
  readonly totalTactics: number;
  readonly coveredTactics: number;
  readonly totalTechniques: number;
  readonly coveredTechniques: number;
  readonly coveragePercent: number;
  readonly topGapTactics: readonly string[];
  readonly strongestTactics: readonly string[];
}

// ─── Statistics Types ────────────────────────────────────────────────────────

export interface CVEStatistic {
  readonly cveId: string;
  readonly description: string;
  readonly cvssScore: number;
  readonly severity: Severity;
  readonly affectedAssets: number;
  readonly exploitAvailable: boolean;
  readonly patchAvailable: boolean;
  readonly publishedAt: string;
}

export interface IOCStatistic {
  readonly type: string;
  readonly total: number;
  readonly malicious: number;
  readonly suspicious: number;
  readonly blocked: number;
  readonly topIndicators: readonly string[];
}

// ─── Recommendation / Insight Types ──────────────────────────────────────────

export interface ReportRecommendation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priority: Severity;
  readonly effort: "Low" | "Medium" | "High";
  readonly impact: "Low" | "Medium" | "High";
  readonly status: "Open" | "In Progress" | "Completed" | "Deferred";
  readonly frameworks: readonly ComplianceFramework[];
  readonly dueDate: string;
}

export interface ReportInsight {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly source: string;
  readonly relatedIds: readonly string[];
  readonly generatedAt: string;
}

// ─── Chart / Widget / Table Types ────────────────────────────────────────────

export interface ReportChart {
  readonly id: string;
  readonly type: "line" | "bar" | "donut" | "area" | "radar" | "heatmap";
  readonly title: string;
  readonly description: string;
  readonly series: readonly {
    name: string;
    data: readonly number[];
  }[];
  readonly categories: readonly string[];
}

export interface ReportWidget {
  readonly id: string;
  readonly type: "scoreCard" | "gauge" | "chart" | "table" | "heatmap" | "map" | "text";
  readonly title: string;
  readonly description: string;
  readonly dataSource: string;
  readonly defaultSize: { w: number; h: number };
  readonly configurable: boolean;
  readonly icon: string;
}

export interface ReportTable {
  readonly id: string;
  readonly title: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

// ─── Dashboard Summary ───────────────────────────────────────────────────────

export interface DashboardSummary {
  readonly totalReports: number;
  readonly publishedReports: number;
  readonly draftReports: number;
  readonly scheduledReports: number;
  readonly criticalFindings: number;
  readonly securityScore: SecurityScore;
  readonly riskScore: RiskScore;
  readonly complianceScore: number;
  readonly lastUpdated: string;
}

// ─── Main Report Type ────────────────────────────────────────────────────────

export interface Report {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type: ReportType;
  readonly format: ReportFormat;
  readonly status: ReportStatus;
  readonly severity: Severity;
  readonly owner: string;
  readonly author: ReportAuthor;
  readonly department: ReportDepartment;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
  readonly securityScore: SecurityScore;
  readonly riskScore: RiskScore;
  readonly executiveSummary: ExecutiveSummary;
  readonly threatSummary: ThreatSummary;
  readonly incidentSummary: IncidentSummary;
  readonly assetSummary: AssetSummary;
  readonly complianceSummary: ComplianceSummary;
  readonly mitreCoverage: MitreCoverage;
  readonly cveStatistics: readonly CVEStatistic[];
  readonly iocStatistics: readonly IOCStatistic[];
  readonly recommendations: readonly ReportRecommendation[];
  readonly insights: readonly ReportInsight[];
  readonly charts: readonly ReportChart[];
  readonly widgets: readonly ReportWidget[] | null;
  readonly tables: readonly ReportTable[];
  readonly attachments: readonly ReportAttachment[];
  readonly comments: readonly ReportComment[];
  readonly branding: ReportBranding;
  readonly schedule: ReportSchedule | null;
  readonly shares: readonly ReportShare[];
  readonly permissions: readonly ReportPermission[];
  readonly history: readonly ReportHistory[];
  readonly kpis: readonly ReportKPI[];
  readonly builderLayout: unknown;
}
