import type {
  ApiKeyRecord,
  AuditEntry,
  ConnectedDevice,
  KeyboardShortcut,
  NotificationPreferences,
  OrganizationSettings,
  PermissionEntry,
  RolePermission,
  SecurityPreferences,
  SessionRecord,
  SettingsState,
  TeamMember,
  UserProfile,
  WorkspaceSettings,
} from "@/types/settings";

export const PROFILE_MOCK: UserProfile = {
  id: "usr-001",
  fullName: "Ava Martinez",
  email: "ava.martinez@sentinelx.ai",
  title: "Principal Security Architect",
  phone: "+1 (415) 555-0148",
  timezone: "America/Los_Angeles",
  locale: "en-US",
  bio: "Leads enterprise detection engineering and zero-trust program initiatives across global operations.",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
  department: "Security Engineering",
  location: "San Francisco, CA",
};

export const ORGANIZATION_MOCK: OrganizationSettings = {
  id: "org-001",
  name: "SentinelX AI",
  slug: "sentinelx-ai",
  industry: "Cybersecurity",
  region: "North America",
  size: "500-1000 employees",
  plan: "Enterprise Plus",
  primaryContact: "Ava Martinez",
  supportEmail: "support@sentinelx.ai",
  branding: {
    companyName: "SentinelX AI",
    logoUrl: "/images/sentinelx-logo.svg",
    accentColor: "violet",
    themeMode: "dark",
  },
};

export const WORKSPACE_MOCK: WorkspaceSettings = {
  id: "ws-001",
  name: "Global Security Operations",
  environment: "production",
  tenantId: "tenant-sentinelx-01",
  defaultRegion: "us-east-1",
  retentionDays: 365,
  enableSIEM: true,
  enableMFA: true,
  allowGuestAccess: false,
};

export const NOTIFICATION_MOCK: NotificationPreferences = {
  emailAlerts: true,
  pushAlerts: true,
  digestFrequency: "real-time",
  channels: ["email", "push", "slack", "teams"],
  criticalOnly: false,
};

export const SECURITY_MOCK: SecurityPreferences = {
  passwordPolicy: "Minimum 16 characters, 1 symbol, 1 number",
  mfaEnabled: true,
  sessionTimeoutMinutes: 30,
  autoLock: true,
  requireRecoveryCode: true,
  allowDeviceTrust: true,
};

export const SESSION_MOCK: SessionRecord[] = [
  {
    id: "sess-001",
    device: "MacBook Pro 14-inch",
    platform: "macOS",
    ipAddress: "198.51.100.42",
    lastSeen: "2026-08-01T08:14:00Z",
    status: "active",
    location: "San Francisco, US",
  },
  {
    id: "sess-002",
    device: "Surface Pro 9",
    platform: "Windows",
    ipAddress: "203.0.113.11",
    lastSeen: "2026-07-31T17:06:00Z",
    status: "idle",
    location: "Austin, US",
  },
  {
    id: "sess-003",
    device: "Ubuntu Workstation",
    platform: "Linux",
    ipAddress: "192.0.2.77",
    lastSeen: "2026-07-28T10:22:00Z",
    status: "revoked",
    location: "London, UK",
  },
];

export const CONNECTED_DEVICES_MOCK: ConnectedDevice[] = [
  {
    id: "device-001",
    name: "Ava’s MacBook Pro",
    platform: "macOS",
    ipAddress: "198.51.100.42",
    lastSeen: "2026-08-01T08:14:00Z",
    trusted: true,
  },
  {
    id: "device-002",
    name: "Ava’s iPhone 15",
    platform: "iOS",
    ipAddress: "198.51.100.14",
    lastSeen: "2026-08-01T07:40:00Z",
    trusted: true,
  },
  {
    id: "device-003",
    name: "SOC Analyst Laptop",
    platform: "Windows",
    ipAddress: "203.0.113.88",
    lastSeen: "2026-07-30T18:03:00Z",
    trusted: false,
  },
];

export const TEAM_MEMBERS_MOCK: TeamMember[] = [
  {
    id: "member-001",
    name: "Ava Martinez",
    email: "ava.martinez@sentinelx.ai",
    role: "owner",
    department: "Security Engineering",
    status: "active",
    lastActive: "2m ago",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
  },
  {
    id: "member-002",
    name: "Nadia Flores",
    email: "nadia.flores@sentinelx.ai",
    role: "admin",
    department: "SOC",
    status: "active",
    lastActive: "12m ago",
  },
  {
    id: "member-003",
    name: "Liam Ortiz",
    email: "liam.ortiz@sentinelx.ai",
    role: "analyst",
    department: "Threat Hunting",
    status: "pending",
    lastActive: "1h ago",
  },
  {
    id: "member-004",
    name: "Mina Patel",
    email: "mina.patel@sentinelx.ai",
    role: "viewer",
    department: "Compliance",
    status: "active",
    lastActive: "Yesterday",
  },
];

export const PERMISSIONS_MOCK: PermissionEntry[] = [
  {
    key: "view-dashboard",
    label: "View dashboard",
    description: "Access security dashboards and executive summaries.",
  },
  {
    key: "manage-alerts",
    label: "Manage alerts",
    description: "Triage, acknowledge, and escalate incidents.",
  },
  {
    key: "manage-incidents",
    label: "Manage incidents",
    description: "Create, update, and resolve incidents.",
  },
  {
    key: "manage-integrations",
    label: "Manage integrations",
    description: "Configure connectors and provider sync policies.",
  },
  {
    key: "manage-team",
    label: "Manage team",
    description: "Invite members and manage user roles.",
  },
  {
    key: "manage-settings",
    label: "Manage settings",
    description: "Access security and organization configuration screens.",
  },
  {
    key: "export-reports",
    label: "Export reports",
    description: "Publish compliance and executive reports.",
  },
];

export const ROLE_PERMISSIONS_MOCK: RolePermission[] = [
  {
    id: "owner",
    name: "Owner",
    description: "Full control across the platform, including organizational settings.",
    permissions: [
      "view-dashboard",
      "manage-alerts",
      "manage-incidents",
      "manage-integrations",
      "manage-team",
      "manage-settings",
      "export-reports",
    ],
  },
  {
    id: "admin",
    name: "Administrator",
    description: "Manage operations, integrations, and security workflows.",
    permissions: [
      "view-dashboard",
      "manage-alerts",
      "manage-incidents",
      "manage-integrations",
      "manage-team",
      "manage-settings",
      "export-reports",
    ],
  },
  {
    id: "analyst",
    name: "Analyst",
    description: "Investigate alerts and incidents with limited admin access.",
    permissions: ["view-dashboard", "manage-alerts", "manage-incidents", "export-reports"],
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "View dashboards and reports without modification permissions.",
    permissions: ["view-dashboard", "export-reports"],
  },
];

export const API_KEYS_MOCK: ApiKeyRecord[] = [
  {
    id: "key-001",
    name: "SOC Automation Key",
    createdAt: "2026-06-12T10:40:00Z",
    expiresAt: "2027-06-12T10:40:00Z",
    scopes: ["alerts:read", "incidents:write", "integrations:manage"],
    lastUsedAt: "2026-08-01T07:58:00Z",
    enabled: true,
  },
  {
    id: "key-002",
    name: "Compliance Exporter",
    createdAt: "2026-05-18T16:10:00Z",
    expiresAt: "2026-11-18T16:10:00Z",
    scopes: ["reports:export", "audit:read"],
    lastUsedAt: "2026-07-31T12:40:00Z",
    enabled: true,
  },
  {
    id: "key-003",
    name: "Legacy SIEM Sync",
    createdAt: "2026-02-09T09:20:00Z",
    expiresAt: "2026-08-09T09:20:00Z",
    scopes: ["alerts:read"],
    lastUsedAt: "2026-07-15T21:05:00Z",
    enabled: false,
  },
];

export const AUDIT_LOGS_MOCK: AuditEntry[] = [
  {
    id: "audit-001",
    actor: "Ava Martinez",
    action: "Updated MFA policy",
    target: "Security Settings",
    timestamp: "2026-08-01T08:05:00Z",
    severity: "warning",
  },
  {
    id: "audit-002",
    actor: "Nadia Flores",
    action: "Invited team member",
    target: "Team Members",
    timestamp: "2026-07-31T18:30:00Z",
    severity: "info",
  },
  {
    id: "audit-003",
    actor: "System",
    action: "Rotated API key",
    target: "SOC Automation Key",
    timestamp: "2026-07-31T10:12:00Z",
    severity: "critical",
  },
];

export const KEYBOARD_SHORTCUTS_MOCK: KeyboardShortcut[] = [
  { id: "shortcut-001", action: "Open command palette", keys: "Ctrl+K" },
  { id: "shortcut-002", action: "Focus search", keys: "Ctrl+/" },
  { id: "shortcut-003", action: "Switch to alerts", keys: "G A" },
  { id: "shortcut-004", action: "Open settings", keys: "G S" },
];

export const SETTINGS_STATE_MOCK: SettingsState = {
  profile: PROFILE_MOCK,
  organization: ORGANIZATION_MOCK,
  workspace: WORKSPACE_MOCK,
  notifications: NOTIFICATION_MOCK,
  security: SECURITY_MOCK,
  sessions: SESSION_MOCK,
  devices: CONNECTED_DEVICES_MOCK,
  teamMembers: TEAM_MEMBERS_MOCK,
  roles: ROLE_PERMISSIONS_MOCK,
  apiKeys: API_KEYS_MOCK,
  auditLogs: AUDIT_LOGS_MOCK,
  shortcuts: KEYBOARD_SHORTCUTS_MOCK,
};
