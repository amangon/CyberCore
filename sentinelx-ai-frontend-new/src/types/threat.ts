/**
 * Threat Intelligence types for the Threat Intelligence Center.
 *
 * Re-exports shared security-domain types where possible and adds the
 * aggregations returned by `GET /threats`.
 */

import type {
  CVE,
  MalwareFamily,
  ThreatItem,
  ThreatTrendPoint,
} from "@/types/security";

export type {
  CVE,
  MalwareFamily,
  ThreatItem,
  ThreatTrendPoint,
} from "@/types/security";

/** Aggregated stats displayed on the threat intelligence page. */
export interface ThreatStats {
  readonly activeThreats: number;
  readonly criticalCVEs: number;
  readonly malwareFamilies: number;
  readonly aptGroups: number;
  readonly blockedThreats?: number;
  readonly newIndicators?: number;
}

/** APT / threat actor entry. */
export interface APTGroupData {
  readonly id?: string;
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly origin?: string;
  readonly motivation?: string;
  readonly sophistication?: string;
  readonly activeSince?: string;
  readonly lastSeen?: string;
  readonly targets?: readonly string[];
  readonly tools?: readonly string[];
  readonly severity?: "critical" | "high" | "medium" | "low" | "info";
  readonly status?: string;
  readonly techniques?: readonly string[];
}

/** Full normalized response of `GET /threats`. */
export interface ThreatFeedData {
  readonly feed: ThreatItem[];
  readonly stats: ThreatStats;
  readonly malwareFamilies: MalwareFamily[];
  readonly cves: CVE[];
  readonly trend: ThreatTrendPoint[];
  readonly aptGroups: APTGroupData[];
}

