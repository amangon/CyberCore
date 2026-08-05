"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  ChevronDown,
  Filter,
  X,
  Search,
  Calendar as CalendarIcon,
  Layers,
  Building2,
  User,
  Activity,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportFiltersState {
  categories: string[];
  departments: string[];
  authors: string[];
  statuses: string[];
  severities: string[];
  frameworks: string[];
  dateRange: { start: string; end: string };
}

interface ReportFiltersProps {
  filters: ReportFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersState>>;
}

// ─── Static Options ───────────────────────────────────────────────────────────

const FILTER_OPTIONS = {
  categories: ["Executive", "Threat", "Compliance", "Risk", "Incident", "Vulnerability", "Asset"],
  departments: ["Engineering", "Finance", "Marketing", "HR", "Legal", "Operations", "Security"],
  authors: ["Sarah Chen", "Marcus Lee", "Priya Nair", "James Wright", "System"],
  statuses: ["Completed", "Scheduled", "Failed", "Draft", "Archived"],
  severities: ["Critical", "High", "Medium", "Low", "Info"],
  frameworks: ["NIST", "ISO 27001", "SOC 2", "GDPR", "HIPAA", "PCI-DSS"],
};

const FILTER_CONFIG = [
  { key: "categories" as const, label: "Category", icon: Layers, options: FILTER_OPTIONS.categories },
  { key: "departments" as const, label: "Department", icon: Building2, options: FILTER_OPTIONS.departments },
  { key: "authors" as const, label: "Author", icon: User, options: FILTER_OPTIONS.authors },
  { key: "statuses" as const, label: "Status", icon: Activity, options: FILTER_OPTIONS.statuses },
  { key: "severities" as const, label: "Severity", icon: AlertTriangle, options: FILTER_OPTIONS.severities },
  { key: "frameworks" as const, label: "Framework", icon: ShieldCheck, options: FILTER_OPTIONS.frameworks },
];

// ─── Multi-Select Filter Component ────────────────────────────────────────────

interface MultiSelectFilterProps {
  label: string;
  icon: React.ElementType;
  options: string[];
  selected: string[];
  onChange: (value: string) => void;
}

function MultiSelectFilter({ label, icon: Icon, options, selected, onChange }: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-9 w-full justify-between border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:text-white font-medium text-xs transition-colors ${
            selected.length > 0 ? "text-blue-400 border-blue-500/30 bg-blue-500/5" : "text-slate-400"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {selected.length > 0 ? `${label} (${selected.length})` : label}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 border-white/10 bg-[#0B1120]/95 backdrop-blur-xl shadow-2xl shadow-black/50">
        <div className="p-2 border-b border-white/5">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <Input
              placeholder={`Search ${label}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-6 border-0 bg-transparent p-0 text-xs text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        <ScrollArea className="h-48">
          <div className="p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-4">No results found.</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => onChange(option)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <Checkbox
                    checked={selected.includes(option)}
                    onCheckedChange={() => onChange(option)}
                    className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className="text-xs text-slate-300 group-hover:text-white">{option}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ─── Date Range Filter Component ──────────────────────────────────────────────

interface DateRangeFilterProps {
  value: { start: string; end: string };
  onChange: (key: "start" | "end", value: string) => void;
}

function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const isActive = value.start || value.end;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-9 w-full justify-between border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:text-white font-medium text-xs transition-colors ${
            isActive ? "text-blue-400 border-blue-500/30 bg-blue-500/5" : "text-slate-400"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {isActive ? `${value.start || "..."} - ${value.end || "..."}` : "Date Range"}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 border-white/10 bg-[#0B1120]/95 backdrop-blur-xl shadow-2xl shadow-black/50 space-y-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Start Date</label>
          <Input
            type="date"
            value={value.start}
            onChange={(e) => onChange("start", e.target.value)}
            className="h-8 border-white/10 bg-white/5 text-xs text-slate-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">End Date</label>
          <Input
            type="date"
            value={value.end}
            onChange={(e) => onChange("end", e.target.value)}
            className="h-8 border-white/10 bg-white/5 text-xs text-slate-200"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main ReportFilters Component ─────────────────────────────────────────────

export function ReportFilters({ filters, setFilters }: ReportFiltersProps) {
  const handleArrayChange = (key: keyof Omit<ReportFiltersState, "dateRange">, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const handleDateChange = (key: "start" | "end", value: string) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value,
      },
    }));
  };

  const removeFilter = (key: keyof ReportFiltersState, value: string) => {
    if (key === "dateRange") {
       // For date range, value is 'start' or 'end'
       setFilters((prev) => ({
         ...prev,
         dateRange: { ...prev.dateRange, [value]: "" },
       }));
    } else {
       setFilters((prev) => ({
         ...prev,
         [key]: (prev[key] as string[]).filter((v) => v !== value),
       }));
    }
  };

  const clearAll = () => {
    setFilters({
      categories: [],
      departments: [],
      authors: [],
      statuses: [],
      severities: [],
      frameworks: [],
      dateRange: { start: "", end: "" },
    });
  };

  const activeFilterCount =
    filters.categories.length +
    filters.departments.length +
    filters.authors.length +
    filters.statuses.length +
    filters.severities.length +
    filters.frameworks.length +
    (filters.dateRange.start ? 1 : 0) +
    (filters.dateRange.end ? 1 : 0);

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col xl:flex-row xl:items-center gap-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 flex-1">
          {FILTER_CONFIG.map((config) => (
            <MultiSelectFilter
              key={config.key}
              label={config.label}
              icon={config.icon}
              options={config.options}
              selected={filters[config.key] as string[]}
              onChange={(val) => handleArrayChange(config.key, val)}
            />
          ))}
          
          <DateRangeFilter 
            value={filters.dateRange} 
            onChange={handleDateChange} 
          />
        </div>

        {activeFilterCount > 0 && (
          <Button
            onClick={clearAll}
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-xs text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 flex-shrink-0"
          >
            <X className="w-3 h-3 mr-1.5" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Search Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 flex items-center gap-1.5 mr-1">
            <Filter className="w-3 h-3" />
            Active:
          </span>
          
          {FILTER_CONFIG.map((config) => 
            (filters[config.key] as string[]).map((value: string) => (
              <Badge
                key={`${config.key}-${value}`}
                variant="outline"
                className="pl-2.5 pr-1 py-1 text-xs font-normal bg-blue-500/5 border-blue-500/20 text-blue-300 hover:bg-blue-500/10 transition-colors flex items-center gap-1.5 group"
              >
                {value}
                <button
                  onClick={() => removeFilter(config.key, value)}
                  className="rounded-full p-0.5 hover:bg-blue-500/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}

          {filters.dateRange.start && (
            <Badge
              variant="outline"
              className="pl-2.5 pr-1 py-1 text-xs font-normal bg-emerald-500/5 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5"
            >
              Start: {filters.dateRange.start}
              <button
                onClick={() => removeFilter("dateRange", "start")}
                className="rounded-full p-0.5 hover:bg-emerald-500/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.dateRange.end && (
            <Badge
              variant="outline"
              className="pl-2.5 pr-1 py-1 text-xs font-normal bg-emerald-500/5 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5"
            >
              End: {filters.dateRange.end}
              <button
                onClick={() => removeFilter("dateRange", "end")}
                className="rounded-full p-0.5 hover:bg-emerald-500/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}