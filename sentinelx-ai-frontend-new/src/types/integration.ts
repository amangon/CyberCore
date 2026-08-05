export type IntegrationStatus = "active" | "disconnected" | "degraded" | "pending" | "error";
export type IntegrationCategory =
  | "threat-intelligence"
  | "siem"
  | "edr"
  | "cloud"
  | "collaboration"
  | "itsm"
  | "automation"
  | "custom";
export type IntegrationProvider =
  | "VirusTotal"
  | "AbuseIPDB"
  | "GreyNoise"
  | "Shodan"
  | "AlienVault OTX"
  | "ThreatFox"
  | "MalwareBazaar"
  | "URLScan"
  | "NVD"
  | "CISA KEV"
  | "IPInfo"
  | "WHOIS"
  | "Microsoft Defender"
  | "CrowdStrike"
  | "Splunk"
  | "Slack"
  | "Discord"
  | "Microsoft Teams"
  | "GitHub"
  | "GitLab"
  | "Jira"
  | "ServiceNow"
  | "Webhook"
  | "Email"
  | "Custom Integration";

export type IntegrationSeverity = "info" | "warning" | "success" | "error";
export type IntegrationSortKey = "name" | "status" | "health" | "latency" | "lastSync";
export type IntegrationSortDirection = "asc" | "desc";

export interface IntegrationMetric {
  readonly label: string;
  readonly value: number;
  readonly unit: string;
  readonly changePercent?: number;
  readonly trend?: "up" | "down" | "stable";
}

export interface IntegrationLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly severity: IntegrationSeverity;
  readonly source: string;
  readonly message: string;
}

export interface IntegrationSyncEvent {
  readonly id: string;
  readonly timestamp: string;
  readonly status: "success" | "warning" | "error";
  readonly recordsProcessed: number;
  readonly durationMs: number;
  readonly initiatedBy: string;
  readonly summary: string;
}

export interface IntegrationNotification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly severity: IntegrationSeverity;
  readonly createdAt: string;
  readonly isRead: boolean;
}

export interface IntegrationConnectionConfig {
  readonly endpoint?: string;
  readonly apiKeyConfigured: boolean;
  readonly webhookConfigured: boolean;
  readonly authMethod: "api-key" | "oauth" | "token" | "basic" | "webhook" | "manual";
  readonly region?: string;
  readonly version?: string;
  readonly sslEnabled: boolean;
}

export interface Integration {
  readonly id: string;
  readonly name: string;
  readonly provider: IntegrationProvider;
  readonly category: IntegrationCategory;
  readonly description: string;
  readonly status: IntegrationStatus;
  readonly isEnabled: boolean;
  readonly icon: string;
  readonly color: string;
  readonly healthScore: number;
  readonly latencyMs: number;
  readonly successRate: number;
  readonly lastSyncAt: string;
  readonly nextSyncAt: string;
  readonly rateLimit: {
    readonly limit: number;
    readonly remaining: number;
    readonly resetAt: string;
  };
  readonly usage: {
    readonly requestsToday: number;
    readonly requestsMonth: number;
    readonly volumeTrend: number;
  };
  readonly tags: readonly string[];
  readonly owner: string;
  readonly connection: IntegrationConnectionConfig;
  readonly metrics: readonly IntegrationMetric[];
  readonly logs: readonly IntegrationLogEntry[];
  readonly syncHistory: readonly IntegrationSyncEvent[];
  readonly notifications: readonly IntegrationNotification[];
  readonly docsUrl?: string;
  readonly isFavorite?: boolean;
}

export interface IntegrationFilterState {
  readonly query: string;
  readonly status: IntegrationStatus | "all";
  readonly category: IntegrationCategory | "all";
  readonly provider: IntegrationProvider | "all";
  readonly onlyEnabled: boolean;
}

export interface IntegrationListViewModel {
  readonly items: readonly Integration[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
}

export interface IntegrationSummary {
  readonly connected: number;
  readonly degraded: number;
  readonly errors: number;
  readonly totalRequests: number;
  readonly averageHealth: number;
}
