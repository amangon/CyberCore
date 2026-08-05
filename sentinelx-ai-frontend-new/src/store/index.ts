"use client";

import { create } from "zustand";
import type { IOCType } from "@/types/security";
import { investigateIOC, type IOCInvestigation } from "@/services/ioc.service";

/**
 * IOC Investigation store.
 *
 * Shares the current IOC investigation across the IOC page components
 * (IOCSearch, IOCResult, ReputationScore, DNSRecords, WHOISInfo) without
 * prop-drilling. Replaces the previous hardcoded mock investigation data.
 */

export interface IOCRecentSearch {
  readonly indicator: string;
  readonly type: IOCType;
  readonly analyzedAt: string;
}

interface IOCStoreState {
  readonly investigation: IOCInvestigation | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly analyzed: boolean;
  readonly recentSearches: readonly IOCRecentSearch[];
  analyze: (indicator: string, type: IOCType) => Promise<void>;
  reset: () => void;
  clearError: () => void;
  clearRecentSearches: () => void;
}

const RECENT_KEY = "sentinelx-ioc-recent";

function loadRecent(): IOCRecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecent(items: IOCRecentSearch[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 10)));
  } catch {
    // ignore storage errors
  }
}

const initialInvestigation = (): IOCInvestigation => ({
  indicator: "",
  type: "ip",
  verdict: "clean",
  riskScore: 0,
  threatLevel: "low",
  confidence: 0,
  reputation: "Clean",
  blacklistStatus: "Not Listed",
  categories: [],
  tags: [],
  detectionRatio: "",
  firstSeen: "",
  lastSeen: "",
  lastUpdated: "",
  country: "",
  isp: "",
  reports: 0,
  sources: [],
  whois: {},
  dns: [],
  ipIntelligence: {},
  security: [],
  recommendations: [],
  suggestedActions: [],
});

export const useIOCStore = create<IOCStoreState>((set, get) => ({
  investigation: null,
  loading: false,
  error: null,
  analyzed: false,
  recentSearches: loadRecent(),

  analyze: async (indicator: string, type: IOCType) => {
    set({ loading: true, error: null, analyzed: true });
    try {
      const investigation = await investigateIOC(indicator, type);
      const entry: IOCRecentSearch = {
        indicator,
        type,
        analyzedAt: new Date().toISOString(),
      };
      const current = get().recentSearches;
      const deduped = [entry, ...current.filter((c) => !(c.indicator === indicator && c.type === type))];
      saveRecent(deduped);
      set({ investigation, loading: false, recentSearches: deduped });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to analyze this indicator.";
      set({ error: message, loading: false });
    }
  },

  reset: () => set({ investigation: null, loading: false, error: null, analyzed: false }),
  clearError: () => set({ error: null }),
  clearRecentSearches: () => {
    saveRecent([]);
    set({ recentSearches: [] });
  },
}));

export type { IOCInvestigation };
export const createInitialInvestigation = initialInvestigation;

