import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Report,
  DashboardSummary,
  ExecutiveKPI,
  ReportTemplate,
  ScheduledReport,
  ReportHistory,
  ReportDownload,
  ReportWidget,
  ReportAnalytics,
  ReportChart,
  ThreatAnalytics,
  IncidentAnalytics,
  AssetAnalytics,
  ComplianceAnalytics,
  MitreCoverage,
  CVE,
  ThreatActor,
  Country,
  Asset,
  User,
  IOCAnalytics,
  AttackTimeline,
  ReportFilters,
  ReportSorting,
  PaginationState,
  DateRange,
  ExportFormat,
  ViewMode,
  ActiveTab,
  ReportStatus,
  ReportBuilderConfig
} from '../types/report';
import * as reportService from '../services/report.service';

export const useReports = () => {
  // Core State
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [executiveKPIs, setExecutiveKPIs] = useState<ExecutiveKPI[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
  const [downloads, setDownloads] = useState<ReportDownload[]>([]);
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [charts, setCharts] = useState<ReportChart[]>([]);
  const [threatAnalytics, setThreatAnalytics] = useState<ThreatAnalytics[]>([]);
  const [incidentAnalytics, setIncidentAnalytics] = useState<IncidentAnalytics[]>([]);
  const [assetAnalytics, setAssetAnalytics] = useState<AssetAnalytics[]>([]);
  const [complianceAnalytics, setComplianceAnalytics] = useState<ComplianceAnalytics[]>([]);
  const [mitreCoverage, setMitreCoverage] = useState<MitreCoverage[]>([]);
  const [topCVEs, setTopCVEs] = useState<CVE[]>([]);
  const [topThreatActors, setTopThreatActors] = useState<ThreatActor[]>([]);
  const [topCountries, setTopCountries] = useState<Country[]>([]);
  const [topAssets, setTopAssets] = useState<Asset[]>([]);
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [IOCAnalytics, setIOCAnalytics] = useState<IOCAnalytics[]>([]);
  const [attackTimeline, setAttackTimeline] = useState<AttackTimeline[]>([]);

  // UI State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({} as ReportFilters);
  const [sorting, setSorting] = useState<ReportSorting>({ field: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');

  // Error Handler
  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unknown error occurred');
    }
  }, []);

  // Data Loading Functions
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summary,
        kpis,
        analyticsData,
        chartsData,
        threatData,
        incidentData,
        assetData,
        complianceData,
        mitreData,
        cves,
        actors,
        countries,
        assets,
        users,
        iocData,
        timeline
      ] = await Promise.all([
        reportService.getDashboardSummary(),
        reportService.getExecutiveKPIs(),
        reportService.getAnalytics(),
        reportService.getCharts(),
        reportService.getThreatAnalytics(),
        reportService.getIncidentAnalytics(),
        reportService.getAssetAnalytics(),
        reportService.getComplianceAnalytics(),
        reportService.getMitreCoverage(),
        reportService.getTopCVEs(),
        reportService.getTopThreatActors(),
        reportService.getTopCountries(),
        reportService.getTopAssets(),
        reportService.getTopUsers(),
        reportService.getIOCAnalytics(),
        reportService.getAttackTimeline()
      ]);

      setDashboardSummary(summary);
      setExecutiveKPIs(kpis);
      setAnalytics(analyticsData);
      setCharts(chartsData);
      setThreatAnalytics(threatData);
      setIncidentAnalytics(incidentData);
      setAssetAnalytics(assetData);
      setComplianceAnalytics(complianceData);
      setMitreCoverage(mitreData);
      setTopCVEs(cves);
      setTopThreatActors(actors);
      setTopCountries(countries);
      setTopAssets(assets);
      setTopUsers(users);
      setIOCAnalytics(iocData);
      setAttackTimeline(timeline);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getReports();
      setReports(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadReport = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const report = await reportService.getReport(id);
      setSelectedReport(report);
      setSelectedReportId(id);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadDashboard(), loadReports()]);
    } catch (err) {
      handleError(err);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard, loadReports, handleError]);

  const retry = useCallback(async () => {
    await Promise.all([loadDashboard(), loadReports()]);
  }, [loadDashboard, loadReports]);

  // UI Actions
  const searchReports = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const filterReports = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const sortReports = useCallback((newSorting: ReportSorting) => {
    setSorting(newSorting);
  }, []);

  const changePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const changePageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const selectReport = useCallback((id: string | null) => {
    setSelectedReportId(id);
    if (id) {
      const report = reports.find(r => r.id === id) || null;
      setSelectedReport(report);
    } else {
      setSelectedReport(null);
    }
  }, [reports]);

  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedRows([]), []);

  // Report CRUD & Actions
  const generateReport = useCallback(async (data: Partial<Report>) => {
    setLoading(true);
    try {
      const newReport = await reportService.createReport(data);
      setReports(prev => [newReport, ...prev]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const duplicateReport = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const duplicated = await reportService.duplicateReport(id);
      setReports(prev => [duplicated, ...prev]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const archiveReport = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await reportService.archiveReport(id);
      setReports(prev => prev.map(r => (r.id === id ? { ...r, status: 'archived' as ReportStatus } : r)));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteReport = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await reportService.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const shareReport = useCallback(async (id: string, userIds: string[]) => {
    setLoading(true);
    try {
      await reportService.shareReport(id, userIds);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const previewReport = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const report = await reportService.getReport(id);
      setSelectedReport(report);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const printReport = useCallback((id: string) => {
    if (typeof window !== 'undefined') {
      window.open(`/reports/${id}/print`, '_blank');
    }
  }, []);

  const exportPDF = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await reportService.exportReport(id, 'pdf');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const exportCSV = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await reportService.exportReport(id, 'csv');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const exportJSON = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await reportService.exportReport(id, 'json');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getTemplates();
      setTemplates(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createTemplate = useCallback(async (data: Partial<ReportTemplate>) => {
    setLoading(true);
    try {
      const newTemplate = await reportService.createTemplate(data);
      setTemplates(prev => [...prev, newTemplate]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateTemplate = useCallback(async (id: string, data: Partial<ReportTemplate>) => {
    setLoading(true);
    try {
      const updated = await reportService.updateTemplate(id, data);
      setTemplates(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteTemplate = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await reportService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Schedules
  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getSchedules();
      setScheduledReports(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createSchedule = useCallback(async (data: Partial<ScheduledReport>) => {
    setLoading(true);
    try {
      const newSchedule = await reportService.createSchedule(data);
      setScheduledReports(prev => [...prev, newSchedule]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateSchedule = useCallback(async (id: string, data: Partial<ScheduledReport>) => {
    setLoading(true);
    try {
      const updated = await reportService.updateSchedule(id, data);
      setScheduledReports(prev => prev.map(s => (s.id === id ? updated : s)));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteSchedule = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await reportService.deleteSchedule(id);
      setScheduledReports(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // History, Downloads, Widgets
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getReportHistory();
      setReportHistory(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadDownloads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getDownloads();
      setDownloads(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadWidgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getWidgets();
      setWidgets(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Builder
  const saveBuilder = useCallback(async (config: ReportBuilderConfig) => {
    setLoading(true);
    try {
      await reportService.saveReportBuilder(config);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadBuilder = useCallback(async (id: string): Promise<ReportBuilderConfig | null> => {
    setLoading(true);
    try {
      const config = await reportService.getReportBuilder(id);
      return config || null;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Lifecycle
  useEffect(() => {
    loadDashboard();
    loadReports();
  }, [loadDashboard, loadReports]);

  // Derived Data
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = searchQuery
        ? report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesFilters = Object.entries(filters as Record<string, unknown>).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        const reportValue = report[key as keyof Report];
        if (Array.isArray(value)) {
          return value.includes(reportValue);
        }
        return reportValue === value;
      });

      return matchesSearch && matchesFilters;
    });
  }, [reports, searchQuery, filters]);

  const sortedReports = useMemo(() => {
    const sortable = [...filteredReports];
    sortable.sort((a, b) => {
      const field = sorting.field as keyof Report;
      const valA = a[field];
      const valB = b[field];

      if (valA === undefined || valB === undefined) return 0;
      if (valA < valB) return sorting.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sorting.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [filteredReports, sorting]);

  const paginatedReports = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedReports.slice(start, end);
  }, [sortedReports, pagination]);

  const totalReports = useMemo(() => reports.length, [reports]);

  const completedReports = useMemo(() => reports.filter(r => r.status === 'completed').length, [reports]);
  
  const scheduledCount = useMemo(() => reports.filter(r => r.status === 'scheduled').length, [reports]);
  
  const failedReports = useMemo(() => reports.filter(r => r.status === 'failed').length, [reports]);

  const averageSecurityScore = useMemo(() => {
    if (reports.length === 0) return 0;
    return reports.reduce((acc, r) => acc + (r.securityScore || 0), 0) / reports.length;
  }, [reports]);

  const averageRiskScore = useMemo(() => {
    if (reports.length === 0) return 0;
    return reports.reduce((acc, r) => acc + (r.riskScore || 0), 0) / reports.length;
  }, [reports]);

  const averageComplianceScore = useMemo(() => {
    if (reports.length === 0) return 0;
    return reports.reduce((acc, r) => acc + (r.complianceScore || 0), 0) / reports.length;
  }, [reports]);

  const highRiskReports = useMemo(() => reports.filter(r => r.riskScore >= 75).length, [reports]);

  return {
    // Core State
    reports,
    selectedReport,
    dashboardSummary,
    executiveKPIs,
    templates,
    scheduledReports,
    reportHistory,
    downloads,
    widgets,
    analytics,
    charts,
    threatAnalytics,
    incidentAnalytics,
    assetAnalytics,
    complianceAnalytics,
    mitreCoverage,
    topCVEs,
    topThreatActors,
    topCountries,
    topAssets,
    topUsers,
    IOCAnalytics,
    attackTimeline,

    // UI State
    loading,
    error,
    refreshing,
    searchQuery,
    filters,
    sorting,
    pagination,
    selectedRows,
    selectedReportId,
    activeTab,
    viewMode,
    dateRange,
    exportFormat,

    // Setters
    setActiveTab,
    setViewMode,
    setDateRange,
    setExportFormat,

    // Functions
    refresh,
    retry,
    loadDashboard,
    loadReports,
    loadReport,
    searchReports,
    filterReports,
    sortReports,
    changePage,
    changePageSize,
    selectReport,
    toggleRowSelection,
    clearSelection,
    generateReport,
    duplicateReport,
    archiveReport,
    deleteReport,
    shareReport,
    previewReport,
    printReport,
    exportPDF,
    exportCSV,
    exportJSON,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loadHistory,
    loadDownloads,
    loadWidgets,
    saveBuilder,
    loadBuilder,

    // Derived Values
    filteredReports,
    sortedReports,
    paginatedReports,
    totalReports,
    completedReports,
    scheduledCount,
    failedReports,
    averageSecurityScore,
    averageRiskScore,
    averageComplianceScore,
    highRiskReports
  };
};