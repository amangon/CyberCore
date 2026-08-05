"use client";

import React, { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Pencil,
  Copy,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Server,
  Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  title: string;
  category: string;
  department: string;
  author: string;
  createdAt: string;
  status: "Completed" | "Scheduled" | "Failed" | "Draft" | "Archived";
  format: "PDF" | "CSV" | "JSON";
}

interface SortConfig {
  key: keyof Report | "";
  direction: "asc" | "desc";
}

interface PaginationState {
  page: number;
  pageSize: number;
}

interface ReportTableProps {
  reports: Report[];
  selectedReports: string[];
  setSelectedReports: React.Dispatch<React.SetStateAction<string[]>>;
  sortConfig: SortConfig;
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  onExport?: (id: string) => void;
}

// ─── Static Configs ───────────────────────────────────────────────────────────

const CategoryIcon: Record<string, React.ElementType> = {
  Executive: ShieldCheck,
  Threat: AlertTriangle,
  Incident: Activity,
  Vulnerability: Eye,
  Asset: Server,
  Compliance: FileText,
  Risk: AlertTriangle,
  User: Users,
};

const StatusStyles: Record<Report["status"], string> = {
  Completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Failed: "bg-red-500/10 text-red-400 border-red-500/20",
  Draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Archived: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

const FormatStyles: Record<Report["format"], string> = {
  PDF: "bg-red-500/10 text-red-400 border-red-500/20",
  CSV: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  JSON: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

// ─── Table Header Cell ─────────────────────────────────────────────────────────

interface TableHeaderCellProps {
  label: string;
  sortKey?: keyof Report;
  sortConfig: SortConfig;
  onSort: (key: keyof Report) => void;
  className?: string;
}

const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  label,
  sortKey,
  sortConfig,
  onSort,
  className = "",
}) => {
  const isSortable = !!sortKey;
  const isActive = sortConfig.key === sortKey;

  return (
    <th
      className={`sticky top-0 z-10 bg-[#0B1120]/95 backdrop-blur-xl px-4 py-3 text-left font-medium text-xs text-slate-400 uppercase tracking-wider border-b border-white/5 ${className}`}
    >
      {isSortable ? (
        <button
          onClick={() => onSort(sortKey!)}
          className="flex items-center gap-1.5 hover:text-white transition-colors group"
        >
          {label}
          <span className={`flex flex-col ${isActive ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"}`}>
            {isActive ? (
              sortConfig.direction === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3" />
            )}
          </span>
        </button>
      ) : (
        label
      )}
    </th>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function ReportTable({
  reports,
  selectedReports,
  setSelectedReports,
  sortConfig,
  setSortConfig,
  pagination,
  setPagination,
  onExport,
}: ReportTableProps) {
  
  // Sorting Logic
  const handleSort = (key: keyof Report) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Selection Logic
  const isAllSelected = reports.length > 0 && selectedReports.length === reports.length;
  const isIndeterminate = selectedReports.length > 0 && selectedReports.length < reports.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r) => r.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(reports.length / pagination.pageSize));
  const currentPage = Math.min(pagination.page, totalPages);
  const startIndex = (currentPage - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedReports = reports.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: Math.max(1, Math.min(newPage, totalPages)) }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({ page: 1, pageSize: newSize });
  };

  // Date formatting helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Table Wrapper - No overflow, flexes gracefully */}
      <div className="w-full overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr>
                {/* Selection Column */}
                <th className="sticky top-0 z-10 bg-[#0B1120]/95 backdrop-blur-xl w-[40px] px-4 py-3 border-b border-white/5">
                  <Checkbox
                    checked={isAllSelected || isIndeterminate}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </th>
                
                <TableHeaderCell label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
                <TableHeaderCell label="Title" sortKey="title" sortConfig={sortConfig} onSort={handleSort} />
                <TableHeaderCell label="Category" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />
                <TableHeaderCell label="Department" sortKey="department" sortConfig={sortConfig} onSort={handleSort} className="hidden lg:table-cell" />
                <TableHeaderCell label="Generated By" sortKey="author" sortConfig={sortConfig} onSort={handleSort} className="hidden xl:table-cell" />
                <TableHeaderCell label="Created" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} className="hidden md:table-cell" />
                <TableHeaderCell label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                <TableHeaderCell label="Format" sortKey="format" sortConfig={sortConfig} onSort={handleSort} className="hidden lg:table-cell" />
                <th className="sticky top-0 z-10 bg-[#0B1120]/95 backdrop-blur-xl px-4 py-3 text-right font-medium text-xs text-slate-400 uppercase tracking-wider border-b border-white/5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-slate-500">
                    No reports found. Adjust your filters or generate a new report.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report) => {
                  const isSelected = selectedReports.includes(report.id);
                  const CatIcon = CategoryIcon[report.category] || FileText;

                  return (
                    <tr
                      key={report.id}
                      className={`group transition-colors ${isSelected ? "bg-blue-500/[0.04]" : "hover:bg-white/[0.02]"}`}
                    >
                      {/* Selection */}
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(report.id)}
                          aria-label={`Select report ${report.id}`}
                          className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">
                        #{report.id}
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-white/5 border border-white/5">
                            <CatIcon className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <span className="text-sm font-medium text-white truncate max-w-[200px]">
                            {report.title}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {report.category}
                      </td>

                      {/* Department */}
                      <td className="hidden lg:table-cell px-4 py-3 text-xs text-slate-400">
                        {report.department}
                      </td>

                      {/* Author */}
                      <td className="hidden xl:table-cell px-4 py-3 text-xs text-slate-400">
                        {report.author}
                      </td>

                      {/* Created */}
                      <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-400">
                        {formatDate(report.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${StatusStyles[report.status]}`}>
                          {report.status}
                        </span>
                      </td>

                      {/* Format */}
                      <td className="hidden lg:table-cell px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${FormatStyles[report.format]}`}>
                          {report.format}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 data-[state=open]:bg-white/5"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 border-white/10 bg-[#0B1120]/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-xs text-slate-500 font-normal">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="text-xs text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                              <Eye className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              View Report
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                              <Pencil className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                              <Copy className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                              <CalendarClock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              Schedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                              onClick={() => onExport?.(report.id)}
                              className="text-xs text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white"
                            >
                              <Download className="w-3.5 h-3.5 mr-2 text-slate-400" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-300">
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>
            {selectedReports.length > 0
              ? `${selectedReports.length} of ${reports.length} row(s) selected.`
              : `${reports.length} total report(s).`}
          </span>
          
          <div className="hidden sm:flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size} className="bg-[#0B1120]">
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 border-white/10 bg-white/5 hover:bg-white/8 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 border-white/10 bg-white/5 hover:bg-white/8 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}