"use client";

import { useMemo, useState } from "react";
import type { Integration, IntegrationFilterState, IntegrationListViewModel, IntegrationSortDirection, IntegrationSortKey } from "@/types/integration";
import { INTEGRATION_MOCK_DATA } from "@/data/integrationMock";

export function useIntegrations() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<IntegrationFilterState["status"]>("all");
  const [category, setCategory] = useState<IntegrationFilterState["category"]>("all");
  const [provider, setProvider] = useState<IntegrationFilterState["provider"]>("all");
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [sortKey, setSortKey] = useState<IntegrationSortKey>("health");
  const [sortDirection, setSortDirection] = useState<IntegrationSortDirection>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = INTEGRATION_MOCK_DATA.filter((integration) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [integration.name, integration.provider, integration.description, integration.owner]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus = status === "all" || integration.status === status;
      const matchesCategory = category === "all" || integration.category === category;
      const matchesProvider = provider === "all" || integration.provider === provider;
      const matchesEnabled = !onlyEnabled || integration.isEnabled;

      return matchesQuery && matchesStatus && matchesCategory && matchesProvider && matchesEnabled;
    });

    const sorted = [...items].sort((left, right) => {
      let comparison = 0;
      switch (sortKey) {
        case "name":
          comparison = left.name.localeCompare(right.name);
          break;
        case "status":
          comparison = left.status.localeCompare(right.status);
          break;
        case "health":
          comparison = left.healthScore - right.healthScore;
          break;
        case "latency":
          comparison = left.latencyMs - right.latencyMs;
          break;
        case "lastSync":
          comparison = left.lastSyncAt.localeCompare(right.lastSyncAt);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [category, onlyEnabled, provider, query, sortDirection, sortKey, status]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);

  const viewModel = useMemo<IntegrationListViewModel>(() => ({
    items: pagedItems,
    total: filteredItems.length,
    page,
    pageSize,
    hasMore: page * pageSize < filteredItems.length,
  }), [filteredItems.length, page, pagedItems, pageSize]);

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setCategory("all");
    setProvider("all");
    setOnlyEnabled(false);
    setPage(1);
  };

  const selectIntegration = (id: string) => {
    const found = INTEGRATION_MOCK_DATA.find((item) => item.id === id);
    return found ?? null;
  };

  return {
    items: viewModel.items,
    total: viewModel.total,
    page: viewModel.page,
    pageSize: viewModel.pageSize,
    hasMore: viewModel.hasMore,
    query,
    setQuery,
    status,
    setStatus,
    category,
    setCategory,
    provider,
    setProvider,
    onlyEnabled,
    setOnlyEnabled,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    setPage,
    resetFilters,
    selectIntegration,
  };
}

export function useIntegrationById(id: string) {
  const integration = INTEGRATION_MOCK_DATA.find((item) => item.id === id) ?? null;
  return integration;
}
