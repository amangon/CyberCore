export type SettingsSection =
  | "profile"
  | "security"
  | "team"
  | "organization"
  | "notifications"
  | "theme"
  | "api";

export type SettingsThemeMode = "dark" | "light" | "system";
export type SettingsAccentColor = "violet" | "cyan" | "emerald" | "rose";
export type NotificationChannel = "email" | "push" | "slack" | "teams";
export type PasswordStrength = "weak" | "fair" | "strong" | "excellent";
export type SessionStatus = "active" | "idle" | "revoked";
export type DevicePlatform = "macOS" | "Windows" | "Linux" | "iOS" | "Android";
export type RoleLevel = "owner" | "admin" | "analyst" | "viewer";
export type PermissionKey =
  | "view-dashboard"
  | "manage-alerts"
  | "manage-incidents"
  | "manage-integrations"
  | "manage-team"
  | "manage-settings"
  | "export-reports";

export interface UserProfile {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly title: string;
  readonly phone: string;
  readonly timezone: string;
  readonly locale: string;
  readonly bio: string;
  readonly avatarUrl?: string;
  readonly department: string;
  readonly location: string;
}

export interface OrganizationSettings {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly industry: string;
  readonly region: string;
  readonly size: string;
  readonly plan: string;
  readonly primaryContact: string;
  readonly supportEmail: string;
  readonly branding: {
    readonly companyName: string;
    readonly logoUrl?: string;
    readonly accentColor: SettingsAccentColor;
    readonly themeMode: SettingsThemeMode;
  };
}

export interface WorkspaceSettings {
  readonly id: string;
  readonly name: string;
  readonly environment: "production" | "staging" | "development";
  readonly tenantId: string;
  readonly defaultRegion: string;
  readonly retentionDays: number;
  readonly enableSIEM: boolean;
  readonly enableMFA: boolean;
  readonly allowGuestAccess: boolean;
}

export interface NotificationPreferences {
  readonly emailAlerts: boolean;
  readonly pushAlerts: boolean;
  readonly digestFrequency: "real-time" | "hourly" | "daily" | "weekly";
  readonly channels: readonly NotificationChannel[];
  readonly criticalOnly: boolean;
}

export interface SecurityPreferences {
  readonly passwordPolicy: string;
  readonly mfaEnabled: boolean;
  readonly sessionTimeoutMinutes: number;
  readonly autoLock: boolean;
  readonly requireRecoveryCode: boolean;
  readonly allowDeviceTrust: boolean;
}

export interface SessionRecord {
  readonly id: string;
  readonly device: string;
  readonly platform: DevicePlatform;
  readonly ipAddress: string;
  readonly lastSeen: string;
  readonly status: SessionStatus;
  readonly location: string;
}

export interface ConnectedDevice {
  readonly id: string;
  readonly name: string;
  readonly platform: DevicePlatform;
  readonly ipAddress: string;
  readonly lastSeen: string;
  readonly trusted: boolean;
}

export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: RoleLevel;
  readonly department: string;
  readonly status: "active" | "pending" | "inactive";
  readonly lastActive: string;
  readonly avatarUrl?: string;
}

export interface PermissionEntry {
  readonly key: PermissionKey;
  readonly label: string;
  readonly description: string;
}

export interface RolePermission {
  readonly id: RoleLevel;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly PermissionKey[];
}

export interface ApiKeyRecord {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly scopes: readonly string[];
  readonly lastUsedAt?: string;
  readonly enabled: boolean;
}

export interface BillingUsageItem {
  readonly label: string;
  readonly used: string;
  readonly limit: string;
  readonly percent: number;
}

export interface PaymentMethod {
  readonly id: string;
  readonly brand: string;
  readonly last4: string;
  readonly expires: string;
  readonly isDefault: boolean;
}

export interface InvoiceRecord {
  readonly id: string;
  readonly reference: string;
  readonly date: string;
  readonly amount: string;
}

export interface BillingSettings {
  readonly planName: string;
  readonly planDescription: string;
  readonly renewsOn: string;
  readonly monthlyCost: string;
  readonly seatsIncluded: string;
  readonly supportTier: string;
  readonly usage: readonly BillingUsageItem[];
  readonly paymentMethods: readonly PaymentMethod[];
  readonly invoices: readonly InvoiceRecord[];
}

export interface ApiKey {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: "active" | "expired" | "revoked";
  readonly lastUsed: string;
  readonly expiresAt: string;
}

export interface ConnectedService {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: "healthy" | "warning" | "down";
  readonly lastSync: string;
}

export interface ApiSettings {
  readonly apiKeys: readonly ApiKey[];
  readonly webhookEndpoint: string;
  readonly rateLimitPerMinute: number;
  readonly retryCount: number;
  readonly connectedServices: readonly ConnectedService[];
  readonly tlsEnforced: boolean;
  readonly ipAllowlistEnabled: boolean;
  readonly signatureRotation: boolean;
}

export interface AuditEntry {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly target: string;
  readonly timestamp: string;
  readonly severity: "info" | "warning" | "critical";
}

export interface KeyboardShortcut {
  readonly id: string;
  readonly action: string;
  readonly keys: string;
}

export interface SettingsState {
  readonly profile: UserProfile;
  readonly organization: OrganizationSettings;
  readonly workspace: WorkspaceSettings;
  readonly notifications: NotificationPreferences;
  readonly security: SecurityPreferences;
  readonly sessions: readonly SessionRecord[];
  readonly devices: readonly ConnectedDevice[];
  readonly teamMembers: readonly TeamMember[];
  readonly roles: readonly RolePermission[];
  readonly apiKeys: readonly ApiKeyRecord[];
  readonly auditLogs: readonly AuditEntry[];
  readonly shortcuts: readonly KeyboardShortcut[];
}
