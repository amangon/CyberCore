import { apiRequest, getApiErrorMessage } from "@/lib/api";

/**
 * Report service.
 *
 * Connects the Reports UI to the backend `/reports` endpoints.
 * Replaces the previous hardcoded mock report data with real API
 * responses. All responses are mapped defensively so partial payloads
 * degrade gracefully.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReportStatus = "Completed" | "Scheduled" | "Failed" | "Draft" | "Archived";
export type ReportFormat = "PDF" | "CSV" | "JSON" | "EXCEL" | "HTML";
export type ReportSeverity = "low" | "medium" | "high" | "critical";

export interface ReportDTO {
  readonly id: string;
  readonly reportId: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly status: ReportStatus;
  readonly severity: ReportSeverity;
  readonly format: ReportFormat;
  readonly author: string;
  readonly department: string;
  readonly tags: readonly string[];
  readonly isArchived: boolean;
  readonly publishedAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface ReportStatsDTO {
  readonly total: number;
  readonly completed: number;
  readonly scheduled: number;
  readonly failed: number;
  readonly archived: number;
  readonly lastGenerated: string | null;
}

export interface ReportListResponse {
  readonly items: readonly ReportDTO[];
  readonly total: number;
  readonly page: number;
  readonly pages: number;
}

export interface CreateReportInput {
  readonly title: string;
  readonly description?: string;
  readonly category?: string;
  readonly status?: ReportStatus;
  readonly severity?: ReportSeverity;
  readonly format?: ReportFormat;
  readonly author?: string;
  readonly department?: string;
  readonly tags?: readonly string[];
  readonly payload?: Record<string, unknown>;
}

// ─── Error helper ─────────────────────────────────────────────────────────────

export function getReportErrorMessage(error: unknown): string {
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

function pickString(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const val = record[key];
    if (val !== null && val !== undefined && String(val).trim() !== "") return String(val);
  }
  return fallback;
}

function pickStatus(value: unknown): ReportStatus {
  const v = String(value ?? "").toLowerCase();
  if (v === "completed") return "Completed";
  if (v === "scheduled") return "Scheduled";
  if (v === "failed") return "Failed";
  if (v === "archived") return "Archived";
  return "Draft";
}

function pickFormat(value: unknown): ReportFormat {
  const v = String(value ?? "").toUpperCase();
  if (v === "CSV") return "CSV";
  if (v === "JSON") return "JSON";
  if (v === "EXCEL") return "EXCEL";
  if (v === "HTML") return "HTML";
  return "PDF";
}

function pickSeverity(value: unknown): ReportSeverity {
  const v = String(value ?? "").toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "low") return "low";
  return "medium";
}

function mapReport(value: unknown): ReportDTO {
  const raw = asRecord(value);
  return {
    id: pickString(raw, ["id", "_id"]),
    reportId: pickString(raw, ["reportId", "report_id"]),
    title: pickString(raw, ["title"], "Untitled Report"),
    description: pickString(raw, ["description"]),
    category: pickString(raw, ["category"], "Executive"),
    status: pickStatus(raw.status),
    severity: pickSeverity(raw.severity),
    format: pickFormat(raw.format),
    author: pickString(raw, ["author"]),
    department: pickString(raw, ["department"]),
    tags: asArray(raw.tags).map((t) => String(t)),
    isArchived: Boolean(raw.isArchived),
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    createdAt: raw.createdAt ? String(raw.createdAt) : null,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GET /reports
 *
 * Fetch a paginated list of reports with optional filtering.
 */
export async function getReports(params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
}): Promise<ReportListResponse> {
  const res = await apiRequest<unknown>({
    method: "get",
    url: "/reports",
    params,
  });
  const body = asRecord(res);
  const data = asArray(body.data);
  return {
    items: data.map(mapReport),
    total: Number(body.total ?? 0),
    page: Number(body.page ?? 1),
    pages: Number(body.pages ?? 1),
  };
}

/**
 * GET /reports/stats
 *
 * Fetch report KPI statistics.
 */
export async function getReportStats(): Promise<ReportStatsDTO> {
  const res = await apiRequest<unknown>({
    method: "get",
    url: "/reports/stats",
  });
  const body = asRecord(res);
  const data = asRecord(body.data);
  return {
    total: Number(data.total ?? 0),
    completed: Number(data.completed ?? 0),
    scheduled: Number(data.scheduled ?? 0),
    failed: Number(data.failed ?? 0),
    archived: Number(data.archived ?? 0),
    lastGenerated: data.lastGenerated ? String(data.lastGenerated) : null,
  };
}

/**
 * GET /reports/:id
 *
 * Fetch a single report.
 */
export async function getReport(id: string): Promise<ReportDTO> {
  const res = await apiRequest<unknown>({
    method: "get",
    url: `/reports/${id}`,
  });
  const body = asRecord(res);
  return mapReport(body.data ?? body);
}

/**
 * POST /reports
 *
 * Create a new report.
 */
export async function createReport(input: CreateReportInput): Promise<ReportDTO> {
  const res = await apiRequest<unknown>({
    method: "post",
    url: "/reports",
    data: input,
  });
  const body = asRecord(res);
  return mapReport(body.data ?? body);
}

/**
 * PUT /reports/:id
 *
 * Update a report.
 */
export async function updateReport(
  id: string,
  input: Partial<CreateReportInput>,
): Promise<ReportDTO> {
  const res = await apiRequest<unknown>({
    method: "put",
    url: `/reports/${id}`,
    data: input,
  });
  const body = asRecord(res);
  return mapReport(body.data ?? body);
}

/**
 * DELETE /reports/:id
 *
 * Delete a report.
 */
export async function deleteReport(id: string): Promise<void> {
  await apiRequest({
    method: "delete",
    url: `/reports/${id}`,
  });
}

/**
 * PUT /reports/:id/archive
 *
 * Archive or restore a report.
 */
export async function archiveReport(id: string, isArchived = true): Promise<ReportDTO> {
  const res = await apiRequest<unknown>({
    method: "put",
    url: `/reports/${id}/archive`,
    data: { isArchived },
  });
  const body = asRecord(res);
  return mapReport(body.data ?? body);
}

const reportService = {
  getReports,
  getReport,
  getReportStats,
  createReport,
  updateReport,
  deleteReport,
  archiveReport,
  getErrorMessage: getReportErrorMessage,
};

export default reportService;
