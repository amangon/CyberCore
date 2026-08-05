// src/services/report.service.ts

import type {
  Report,
  ReportFilter,
  ReportSortField,
  PaginatedResult,
  DashboardSummary,
  ExecutiveKPIs,
  SecurityScore,
  RiskScore,
  ComplianceScore,
  ThreatAnalytics,
  IncidentAnalytics,
  AssetAnalytics,
  RiskAnalytics,
  ComplianceAnalytics,
  MitreCoverage,
  CVEItem,
  ThreatActorItem,
  CountryThreatItem,
  AssetRiskItem,
  UserRiskItem,
  IOCAnalytics,
  AttackTimelineEvent,
  ReportTemplate,
  ScheduledReport,
  ReportHistoryItem,
  DownloadItem,
  ExportResult,
  ExportFormat,
  ReportWidget,
  BuilderLayout,
  ShareResult,
  ReportStatus,
  Severity,
} from "../types/report";

import {
  mockReports,
  mockDashboardSummary,
  mockExecutiveKPIs,
  mockSecurityScore,
  mockRiskScore,
  mockComplianceScore,
  mockThreatAnalytics,
  mockIncidentAnalytics,
  mockAssetAnalytics,
  mockRiskAnalytics,
  mockComplianceAnalytics,
  mockMitreCoverage,
  mockTopCVEs,
  mockTopThreatActors,
  mockTopCountries,
  mockTopAssets,
  mockTopUsers,
  mockIOCAnalytics,
  mockAttackTimeline,
  mockTemplates,
  mockScheduledReports,
  mockHistory,
  mockDownloads,
  mockWidgets,
} from "../data/reportMock";

/**
 * ---------------------------------------------------------------------------
 * ReportService
 * ---------------------------------------------------------------------------
 * Single source of truth for all report / dashboard / analytics data access.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * This class is intentionally shaped to mirror a future Axios-based REST
 * client 1:1. Every public method:
 *   - is async and returns a Promise<T>
 *   - simulates network latency via `this.delay()`
 *   - simulates the exact call-signature an HTTP client would use
 *     (e.g. GET /reports/:id, POST /reports/:id/share, etc.)
 *
 * When a real backend is introduced, only the PRIVATE implementation of
 * each method needs to change (swap `this.delay()` + mock lookup for
 * `this.http.get<T>(url)`), the PUBLIC method signatures and return types
 * remain identical. No consuming component should ever need to change.
 *
 * NOTE ON MUTABLE MOCK ARRAYS:
 * `mockReports`, `mockTemplates`, and `mockScheduledReports` are treated as
 * mutable in-memory collections (push/splice) to simulate persistence across
 * calls within a session. They are cast to their mutable array types locally
 * so this file compiles regardless of whether reportMock.ts exports them as
 * `readonly T[]` or `T[]`.
 * ---------------------------------------------------------------------------
 */
class ReportService {
  /** Simulated base latency (ms) applied to all mock calls. */
  private readonly baseLatencyMs = 350;

  /** Simulated latency jitter (ms) to mimic real network variance. */
  private readonly latencyJitterMs = 150;

  /** Mutable working copies of mock collections (session-scoped "persistence"). */
  private readonly reports: Report[] = [...(mockReports as Report[])];
  private readonly templates: ReportTemplate[] = [
    ...((mockTemplates ?? []) as ReportTemplate[]),
  ];
  private readonly schedules: ScheduledReport[] = [
    ...((mockScheduledReports ?? []) as ScheduledReport[]),
  ];

  /**
   * Placeholder for a future Axios instance.
   * e.g. private readonly http = axios.create({ baseURL: "/api/v1/reports" });
   */
  // private readonly http: AxiosInstance;

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Simulates network latency for a mock request.
   * Replaced by real HTTP round-trip time once a backend exists.
   */
  private delay<T>(payload: T, ms: number = this.baseLatencyMs): Promise<T> {
    const jitter = Math.random() * this.latencyJitterMs;
    return new Promise((resolve) => {
      setTimeout(() => resolve(payload), ms + jitter);
    });
  }

  /**
   * Simulates a rejected network request (404-equivalent) for a given id.
   */
  private delayError<T = never>(error: Error, ms: number = 150): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(error), ms);
    });
  }

  /**
   * Deep-clones mock payloads so consumers can never mutate the
   * in-memory mock source of truth. A real API response would already
   * be a fresh object per request, so this keeps behavior consistent.
   */
  private clone<T>(payload: T): T {
    return JSON.parse(JSON.stringify(payload)) as T;
  }

  /**
   * Simulates a "not found" REST error (404-equivalent) for a given id.
   */
  private notFoundError(resource: string, id: string): Error {
    return new Error(`${resource} with id "${id}" was not found.`);
  }

  /**
   * Generic case-insensitive substring matcher used by search utilities.
   */
  private matchesQuery(value: string | undefined, query: string): boolean {
    if (!value) return false;
    return value.toLowerCase().includes(query.toLowerCase());
  }

  /**
   * Applies a partial filter object against a Report, only checking
   * keys that are actually present on the filter.
   */
  private applyReportFilters(report: Report, filters: ReportFilter): boolean {
    if (filters.type && report.type !== filters.type) return false;
    if (filters.status && report.status !== filters.status) return false;
    if (filters.severity && report.severity !== filters.severity) return false;
    if (filters.owner && report.owner !== filters.owner) return false;
    if (filters.tags && filters.tags.length > 0) {
      const reportTags = report.tags ?? [];
      const hasAllTags = filters.tags.every((tag) => reportTags.includes(tag));
      if (!hasAllTags) return false;
    }
    if (filters.dateFrom) {
      if (new Date(report.createdAt) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      if (new Date(report.createdAt) > new Date(filters.dateTo)) return false;
    }
    return true;
  }

  /**
   * Sorts a Report array by a given field, always returning a new array.
   */
  private applyReportSort(reports: Report[], sortBy: ReportSortField): Report[] {
    const sorted = [...reports];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case "titleAsc":
          return a.title.localeCompare(b.title);
        case "titleDesc":
          return b.title.localeCompare(a.title);
        case "dateAsc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "dateDesc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "severityDesc":
          return this.severityWeight(b.severity) - this.severityWeight(a.severity);
        case "severityAsc":
          return this.severityWeight(a.severity) - this.severityWeight(b.severity);
        default:
          return 0;
      }
    });

    return sorted;
  }

  /**
   * Maps a severity label to a numeric weight for sorting/scoring.
   * Accepts either the Severity enum or a raw lowercase string, since
   * mock data and enum values may not always line up exactly.
   */
  private severityWeight(severity: Severity | string | undefined): number {
    const normalized = String(severity ?? "").toLowerCase();
    switch (normalized) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Slices an array into a page given page number (1-indexed) and page size.
   */
  private paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      items: items.slice(start, end),
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    };
  }

  /**
   * Generates a pseudo-unique id for newly created mock entities.
   * Backend equivalent: server-generated UUID.
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Returns current ISO timestamp. Centralized so future audit fields
   * are consistent everywhere.
   */
  private now(): string {
    return new Date().toISOString();
  }

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  /** GET /dashboard/summary */
  public async getDashboardSummary(): Promise<DashboardSummary> {
    return this.delay(this.clone(mockDashboardSummary));
  }

  /** GET /dashboard/kpis */
  public async getExecutiveKPIs(): Promise<ExecutiveKPIs> {
    return this.delay(this.clone(mockExecutiveKPIs as ExecutiveKPIs));
  }

  /** GET /dashboard/security-score */
  public async getSecurityScore(): Promise<SecurityScore> {
    return this.delay(this.clone(mockSecurityScore));
  }

  /** GET /dashboard/risk-score */
  public async getRiskScore(): Promise<RiskScore> {
    return this.delay(this.clone(mockRiskScore));
  }

  /** GET /dashboard/compliance-score */
  public async getComplianceScore(): Promise<ComplianceScore> {
    return this.delay(this.clone(mockComplianceScore as unknown as ComplianceScore));
  }

  // ==========================================================================
  // REPORTS
  // ==========================================================================

  /** GET /reports */
  public async getReports(): Promise<Report[]> {
    return this.delay(this.clone(this.reports));
  }

  /** GET /reports/:id */
  public async getReportById(id: string): Promise<Report> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) {
      return this.delayError<Report>(this.notFoundError("Report", id));
    }
    return this.delay(this.clone(report));
  }

  /** GET /reports/search?q= */
  public async searchReports(query: string): Promise<Report[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.delay(this.clone(this.reports));

    const results = this.reports.filter(
      (r) =>
        this.matchesQuery(r.title, trimmed) ||
        this.matchesQuery(r.description, trimmed) ||
        this.matchesQuery(r.owner, trimmed) ||
        (r.tags ?? []).some((tag) => this.matchesQuery(tag, trimmed))
    );

    return this.delay(this.clone(results));
  }

  /** GET /reports?filters= */
  public async filterReports(filters: ReportFilter): Promise<Report[]> {
    const results = this.reports.filter((r) => this.applyReportFilters(r, filters));
    return this.delay(this.clone(results));
  }

  /** GET /reports?sortBy= */
  public async sortReports(sortBy: ReportSortField): Promise<Report[]> {
    const sorted = this.applyReportSort(this.reports, sortBy);
    return this.delay(this.clone(sorted));
  }

  /** GET /reports?page=&pageSize= */
  public async paginateReports(
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<Report>> {
    const result = this.paginate(this.reports, page, pageSize);
    return this.delay(this.clone(result));
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  /** GET /analytics/threats */
  public async getThreatAnalytics(): Promise<ThreatAnalytics> {
    return this.delay(this.clone(mockThreatAnalytics));
  }

  /** GET /analytics/incidents */
  public async getIncidentAnalytics(): Promise<IncidentAnalytics> {
    return this.delay(this.clone(mockIncidentAnalytics));
  }

  /** GET /analytics/assets */
  public async getAssetAnalytics(): Promise<AssetAnalytics> {
    return this.delay(this.clone(mockAssetAnalytics));
  }

  /** GET /analytics/risk */
  public async getRiskAnalytics(): Promise<RiskAnalytics> {
    return this.delay(this.clone(mockRiskAnalytics as unknown as RiskAnalytics));
  }

  /** GET /analytics/compliance */
  public async getComplianceAnalytics(): Promise<ComplianceAnalytics> {
    return this.delay(
      this.clone(mockComplianceAnalytics as unknown as ComplianceAnalytics)
    );
  }

  /** GET /analytics/mitre-coverage */
  public async getMitreCoverage(): Promise<MitreCoverage> {
    return this.delay(this.clone(mockMitreCoverage));
  }

  /** GET /analytics/top-cves */
  public async getTopCVEs(): Promise<CVEItem[]> {
    return this.delay(this.clone(mockTopCVEs as CVEItem[]));
  }

  /** GET /analytics/top-threat-actors */
  public async getTopThreatActors(): Promise<ThreatActorItem[]> {
    return this.delay(this.clone((mockTopThreatActors ?? []) as ThreatActorItem[]));
  }

  /** GET /analytics/top-countries */
  public async getTopCountries(): Promise<CountryThreatItem[]> {
    return this.delay(this.clone((mockTopCountries ?? []) as CountryThreatItem[]));
  }

  /** GET /analytics/top-assets */
  public async getTopAssets(): Promise<AssetRiskItem[]> {
    return this.delay(this.clone((mockTopAssets ?? []) as AssetRiskItem[]));
  }

  /** GET /analytics/top-users */
  public async getTopUsers(): Promise<UserRiskItem[]> {
    return this.delay(this.clone((mockTopUsers ?? []) as UserRiskItem[]));
  }

  /** GET /analytics/ioc */
  public async getIOCAnalytics(): Promise<IOCAnalytics> {
    return this.delay(this.clone(mockIOCAnalytics as unknown as IOCAnalytics));
  }

  /** GET /analytics/attack-timeline */
  public async getAttackTimeline(): Promise<AttackTimelineEvent[]> {
    return this.delay(this.clone((mockAttackTimeline ?? []) as AttackTimelineEvent[]));
  }

  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  /** GET /templates */
  public async getTemplates(): Promise<ReportTemplate[]> {
    return this.delay(this.clone(this.templates));
  }

  /** POST /templates */
  public async createTemplate(
    template: Omit<ReportTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<ReportTemplate> {
    const newTemplate = {
      ...template,
      id: this.generateId("tpl"),
      createdAt: this.now(),
      updatedAt: this.now(),
    } as ReportTemplate;

    this.templates.push(newTemplate);
    return this.delay(this.clone(newTemplate));
  }

  /** PUT /templates/:id */
  public async updateTemplate(
    id: string,
    updates: Partial<ReportTemplate>
  ): Promise<ReportTemplate> {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) {
      return this.delayError<ReportTemplate>(this.notFoundError("Template", id));
    }

    const updated: ReportTemplate = {
      ...this.templates[index],
      ...updates,
      id: this.templates[index].id,
      updatedAt: this.now(),
    };

    this.templates[index] = updated;
    return this.delay(this.clone(updated));
  }

  /** DELETE /templates/:id */
  public async deleteTemplate(id: string): Promise<{ success: boolean; id: string }> {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) {
      return this.delayError<{ success: boolean; id: string }>(
        this.notFoundError("Template", id)
      );
    }

    this.templates.splice(index, 1);
    return this.delay({ success: true, id });
  }

  // ==========================================================================
  // SCHEDULING
  // ==========================================================================

  /** GET /schedules */
  public async getScheduledReports(): Promise<ScheduledReport[]> {
    return this.delay(this.clone(this.schedules));
  }

  /** POST /schedules */
  public async createSchedule(
    schedule: Omit<ScheduledReport, "id" | "createdAt" | "updatedAt">
  ): Promise<ScheduledReport> {
    const newSchedule = {
      ...schedule,
      id: this.generateId("sched"),
      createdAt: this.now(),
      updatedAt: this.now(),
    } as ScheduledReport;

    this.schedules.push(newSchedule);
    return this.delay(this.clone(newSchedule));
  }

  /** PUT /schedules/:id */
  public async updateSchedule(
    id: string,
    updates: Partial<ScheduledReport>
  ): Promise<ScheduledReport> {
    const index = this.schedules.findIndex((s) => s.id === id);
    if (index === -1) {
      return this.delayError<ScheduledReport>(this.notFoundError("Schedule", id));
    }

    const updated: ScheduledReport = {
      ...this.schedules[index],
      ...updates,
      id: this.schedules[index].id,
      updatedAt: this.now(),
    };

    this.schedules[index] = updated;
    return this.delay(this.clone(updated));
  }

  /** DELETE /schedules/:id */
  public async deleteSchedule(id: string): Promise<{ success: boolean; id: string }> {
    const index = this.schedules.findIndex((s) => s.id === id);
    if (index === -1) {
      return this.delayError<{ success: boolean; id: string }>(
        this.notFoundError("Schedule", id)
      );
    }

    this.schedules.splice(index, 1);
    return this.delay({ success: true, id });
  }

  // ==========================================================================
  // HISTORY
  // ==========================================================================

  /** GET /history */
  public async getHistory(): Promise<ReportHistoryItem[]> {
    return this.delay(this.clone((mockHistory ?? []) as ReportHistoryItem[]));
  }

  /** GET /history/downloads */
  public async getDownloads(): Promise<DownloadItem[]> {
    return this.delay(this.clone((mockDownloads ?? []) as DownloadItem[]));
  }

  // ==========================================================================
  // EXPORT
  // ==========================================================================

  /**
   * Simulates exporting a report to a given format.
   * Real implementation would call POST /reports/:id/export and
   * return a signed URL / Blob from the backend.
   */
  private async simulateExport(
    id: string,
    format: ExportFormat
  ): Promise<ExportResult> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) {
      return this.delayError<ExportResult>(this.notFoundError("Report", id));
    }

    const formatLabel = String(format);

    const result: ExportResult = {
      reportId: id,
      format,
      fileName: `${report.title.replace(/\s+/g, "_")}.${formatLabel.toLowerCase()}`,
      generatedAt: this.now(),
      // Mock download URL — a real backend would return a signed asset URL.
      url: `mock://exports/${id}.${formatLabel.toLowerCase()}`,
      sizeBytes: Math.floor(Math.random() * 500000) + 10000,
    };

    return this.delay(result, 700);
  }

  /** POST /reports/:id/export/pdf */
  public async exportPDF(id: string): Promise<ExportResult> {
    return this.simulateExport(id, "PDF" as ExportFormat);
  }

  /** POST /reports/:id/export/csv */
  public async exportCSV(id: string): Promise<ExportResult> {
    return this.simulateExport(id, "CSV" as ExportFormat);
  }

  /** POST /reports/:id/export/json */
  public async exportJSON(id: string): Promise<ExportResult> {
    return this.simulateExport(id, "JSON" as ExportFormat);
  }

  /** POST /reports/:id/print */
  public async printReport(id: string): Promise<{ success: boolean; id: string }> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) {
      return this.delayError<{ success: boolean; id: string }>(
        this.notFoundError("Report", id)
      );
    }
    return this.delay({ success: true, id });
  }

  /** GET /reports/:id/preview */
  public async previewReport(id: string): Promise<Report> {
    return this.getReportById(id);
  }

  // ==========================================================================
  // BUILDER
  // ==========================================================================

  /** GET /builder/widgets */
  public async getWidgets(): Promise<ReportWidget[]> {
    return this.delay(this.clone(mockWidgets as ReportWidget[]));
  }

  /** POST /builder/:reportId/save */
  public async saveBuilder(
    reportId: string,
    layout: BuilderLayout
  ): Promise<{ success: boolean; reportId: string; savedAt: string }> {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) {
      return this.delayError<{ success: boolean; reportId: string; savedAt: string }>(
        this.notFoundError("Report", reportId)
      );
    }

    // Persist the builder layout onto the in-memory mock report.
    report.builderLayout = layout;
    report.updatedAt = this.now();

    return this.delay({
      success: true,
      reportId,
      savedAt: report.updatedAt,
    });
  }

  /** GET /builder/:reportId/load */
  public async loadBuilder(reportId: string): Promise<BuilderLayout> {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) {
      return this.delayError<BuilderLayout>(this.notFoundError("Report", reportId));
    }

    const layout =
      report.builderLayout ?? ({ widgets: [], layoutMeta: {} } as BuilderLayout);
    return this.delay(this.clone(layout));
  }

  // ==========================================================================
  // SHARING
  // ==========================================================================

  /** POST /reports/:id/share */
  public async shareReport(id: string, recipients: string[]): Promise<ShareResult> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) {
      return this.delayError<ShareResult>(this.notFoundError("Report", id));
    }

    const result: ShareResult = {
      reportId: id,
      sharedWith: recipients,
      sharedAt: this.now(),
      shareLink: `mock://shared-reports/${id}`,
    };

    return this.delay(result);
  }

  /** POST /reports/:id/duplicate */
  public async duplicateReport(id: string): Promise<Report> {
    const source = this.reports.find((r) => r.id === id);
    if (!source) {
      return this.delayError<Report>(this.notFoundError("Report", id));
    }

    const duplicate: Report = {
      ...this.clone(source),
      id: this.generateId("rpt"),
      title: `${source.title} (Copy)`,
      createdAt: this.now(),
      updatedAt: this.now(),
    };

    this.reports.push(duplicate);
    return this.delay(this.clone(duplicate));
  }

  /** PATCH /reports/:id/archive */
  public async archiveReport(id: string): Promise<Report> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) {
      return this.delayError<Report>(this.notFoundError("Report", id));
    }

    report.status = "archived" as ReportStatus;
    report.updatedAt = this.now();

    return this.delay(this.clone(report));
  }

  /** DELETE /reports/:id */
  public async deleteReport(id: string): Promise<{ success: boolean; id: string }> {
    const index = this.reports.findIndex((r) => r.id === id);
    if (index === -1) {
      return this.delayError<{ success: boolean; id: string }>(
        this.notFoundError("Report", id)
      );
    }

    this.reports.splice(index, 1);
    return this.delay({ success: true, id });
  }

  // ==========================================================================
  // UTILITIES (calculated / derived metrics)
  // ==========================================================================

  /**
   * Recalculates an aggregate security score from current mock data.
   * A real backend would perform this server-side; kept here as a
   * pure derived-metric utility so the contract stays identical.
   */
  public async calculateSecurityScore(): Promise<SecurityScore> {
    const base = mockSecurityScore;
    const openCriticalReports = this.reports.filter(
      (r) => String(r.severity).toLowerCase() === "critical" && r.status !== "archived"
    ).length;

    const penalty = Math.min(openCriticalReports * 2, 30);
    const score = Math.max(0, base.score - penalty);

    const result: SecurityScore = {
      ...this.clone(base),
      score,
      calculatedAt: this.now(),
    };

    return this.delay(result);
  }

  /**
   * Recalculates an aggregate risk score from current mock data.
   */
  public async calculateRiskScore(): Promise<RiskScore> {
    const base = mockRiskScore;
    const severityBoost = this.reports.reduce(
      (sum, r) => sum + this.severityWeight(r.severity),
      0
    );

    const score = Math.min(100, base.score + Math.round(severityBoost / 10));

    const result: RiskScore = {
      ...this.clone(base),
      score,
      calculatedAt: this.now(),
    };

    return this.delay(result);
  }

  /**
   * Recalculates an aggregate compliance percentage from current mock data.
   */
  public async calculateCompliance(): Promise<ComplianceScore> {
    const base = mockComplianceScore as unknown as ComplianceScore;

    const result: ComplianceScore = {
      ...this.clone(base),
      calculatedAt: this.now(),
    };

    return this.delay(result);
  }

  /**
   * Generates a lightweight executive summary string derived from
   * the current dashboard, security, and risk data. Backend equivalent
   * would likely be an LLM-generated or templated server-side summary.
   */
  public async generateExecutiveSummary(): Promise<string> {
    const [summary, security, risk, compliance] = await Promise.all([
      this.getDashboardSummary(),
      this.calculateSecurityScore(),
      this.calculateRiskScore(),
      this.calculateCompliance(),
    ]);

    const totalReports = (summary as any).totalReports ?? this.reports.length;
    const criticalFindings = (summary as any).criticalFindings ?? 0;

    const text =
      `As of ${new Date().toLocaleDateString()}, the organization holds a security ` +
      `score of ${security.score}/100 and a risk score of ${risk.score}/100, ` +
      `with overall compliance at ${(compliance as any).score ?? (compliance as any).overallScore}%. ` +
      `There are currently ${totalReports} reports on record, including ` +
      `${criticalFindings} findings marked as critical severity. ` +
      `Continued monitoring and remediation of high-severity findings is recommended ` +
      `to sustain and improve the current security posture.`;

    return this.delay(text, 500);
  }
}

export default new ReportService();