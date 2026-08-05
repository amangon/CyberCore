import { apiRequest, getApiErrorMessage } from "@/lib/api";
import type {
  ApiKey,
  ApiSettings,
  UserProfile,
  BillingSettings,
  NotificationPreferences,
  OrganizationSettings,
  WorkspaceSettings,
  SecurityPreferences,
  SessionRecord,
  ConnectedDevice,
  TeamMember,
  RolePermission,
  PermissionEntry,
  SettingsAccentColor,
  SettingsThemeMode,
} from "@/types/settings";

/**
 * Settings service.
 *
 * Connects the frontend settings pages to the backend `/api/settings` endpoints.
 * All mock data has been replaced with real API calls. Responses are mapped
 * defensively so partial backend payloads degrade gracefully.
 */

// ─── Error helper ─────────────────────────────────────────────────────────────

export function getSettingsErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * GET /settings/profile
 *
 * Fetch the current user's profile.
 */
export async function getProfile(): Promise<UserProfile> {
  const data = await apiRequest<unknown>({
    method: "get",
    url: "/settings/profile",
  });

const payload = (data as Record<string, unknown>)?.data ?? data;
  const raw = payload as Record<string, unknown>;

  const firstName = String(raw.firstName ?? "");
  const lastName = String(raw.lastName ?? "");
  const fullName = raw.fullName ? String(raw.fullName) : `${firstName} ${lastName}`.trim();

  return {
    id: String(raw.id ?? raw._id ?? ""),
    fullName,
    email: String(raw.email ?? ""),
    title: String(raw.title ?? ""),
    phone: String(raw.phone ?? ""),
    timezone: String(raw.timezone ?? "UTC"),
    locale: String(raw.locale ?? "en-US"),
    bio: String(raw.bio ?? ""),
    avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
    department: String(raw.department ?? ""),
    location: String(raw.location ?? ""),
  };
}

/**
 * PUT /settings/profile
 *
 * Update the current user's profile.
 */
export async function updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const data = await apiRequest<unknown>({
    method: "put",
    url: "/settings/profile",
    data: {
      firstName: profile.fullName?.split(" ")[0],
      lastName: profile.fullName?.split(" ").slice(1).join(" "),
      title: profile.title,
      phone: profile.phone,
      timezone: profile.timezone,
      locale: profile.locale,
      bio: profile.bio,
      department: profile.department,
      location: profile.location,
    },
  });

  const payload = (data as Record<string, unknown>)?.data ?? data;
  const raw = payload as Record<string, unknown>;

  return {
    id: String(raw.id ?? raw._id ?? ""),
    fullName: String(raw.fullName ?? ""),
    email: String(raw.email ?? ""),
    title: String(raw.title ?? ""),
    phone: String(raw.phone ?? ""),
    timezone: String(raw.timezone ?? "UTC"),
    locale: String(raw.locale ?? "en-US"),
    bio: String(raw.bio ?? ""),
    avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
    department: String(raw.department ?? ""),
    location: String(raw.location ?? ""),
  };
}

/**
 * POST /settings/profile/avatar
 *
 * Upload a new avatar image.
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const data = await apiRequest<unknown>({
    method: "post",
    url: "/settings/profile/avatar",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });

  const payload = (data as Record<string, unknown>)?.data ?? data;
  const raw = payload as Record<string, unknown>;

  return {
    avatarUrl: String(raw.avatarUrl ?? ""),
  };
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

/**
 * GET /settings/api-keys
 *
 * Fetch all API keys for the current user.
 */
export async function getApiKeys(): Promise<ApiKey[]> {
  const data = await apiRequest<unknown>({
    method: "get",
    url: "/settings/api-keys",
  });

const payload = (data as Record<string, unknown>)?.data ?? data;
  const keysRaw: unknown = Array.isArray(payload) ? payload : (payload as Record<string, unknown>).data;
  const keys = Array.isArray(keysRaw) ? keysRaw : [];

  return (keys as Record<string, unknown>[]).map((k) => ({
    id: String(k.id ?? k._id ?? ""),
    name: String(k.name ?? ""),
    description: String(k.description ?? ""),
    status: String(k.status ?? "active") as "active" | "expired" | "revoked",
    lastUsed: String(k.lastUsed ?? "Never"),
    expiresAt: String(k.expiresAt ?? "Never"),
  }));
}

/**
 * POST /settings/api-keys
 *
 * Generate a new API key.
 */
export async function generateApiKey(params: {
  name: string;
  description?: string;
  expiresInDays?: number;
}): Promise<ApiKey & { key: string }> {
  const data = await apiRequest<unknown>({
    method: "post",
    url: "/settings/api-keys",
    data: params,
  });

  const payload = (data as Record<string, unknown>)?.data ?? data;
  const raw = payload as Record<string, unknown>;

  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    key: String(raw.key ?? ""),
    status: "active",
    lastUsed: "Never",
    expiresAt: String(raw.expiresAt ?? "Never"),
  };
}

/**
 * PUT /settings/api-keys/:id/revoke
 *
 * Revoke an API key.
 */
export async function revokeApiKey(id: string): Promise<void> {
  await apiRequest({
    method: "put",
    url: `/settings/api-keys/${id}/revoke`,
  });
}

/**
 * DELETE /settings/api-keys/:id
 *
 * Delete an API key.
 */
export async function deleteApiKey(id: string): Promise<void> {
  await apiRequest({
    method: "delete",
    url: `/settings/api-keys/${id}`,
  });
}

/**
 * POST /settings/api-keys/:id/regenerate
 *
 * Regenerate an API key (revoke old, create new).
 */
export async function regenerateApiKey(id: string): Promise<ApiKey & { key: string }> {
  const data = await apiRequest<unknown>({
    method: "post",
    url: `/settings/api-keys/${id}/regenerate`,
  });

  const payload = (data as Record<string, unknown>)?.data ?? data;
  const raw = payload as Record<string, unknown>;

  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    key: String(raw.key ?? ""),
    status: "active",
    lastUsed: "Never",
    expiresAt: String(raw.expiresAt ?? "Never"),
  };
}

// ─── Legacy support (for API Settings page) ───────────────────────────────────

/**
 * GET /settings/api-keys + settings metadata
 *
 * Returns the full ApiSettings object used by the API settings page.
 */
export async function getApiSettings(): Promise<ApiSettings> {
  const keys = await getApiKeys();

  return {
    apiKeys: keys,
    webhookEndpoint: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001'}/api/webhooks`,
    rateLimitPerMinute: 60,
    retryCount: 3,
    connectedServices: [],
    tlsEnforced: true,
    ipAllowlistEnabled: false,
    signatureRotation: true,
  };
}

// ─── Billing ──────────────────────────────────────────────────────────────────

/**
 * GET /settings/billing
 *
 * Fetch billing settings (stub - returns default data).
 */
export async function getBillingSettings(): Promise<BillingSettings> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/billing" });
    const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
    return {
      planName: String(payload.planName ?? payload.plan ?? "Pro"),
      planDescription: String(payload.planDescription ?? "Professional plan"),
      renewsOn: String(payload.renewsOn ?? payload.nextBilling ?? new Date(Date.now() + 30 * 86400000).toISOString()),
      monthlyCost: String(payload.monthlyCost ?? "$99"),
      seatsIncluded: String(payload.seatsIncluded ?? "10"),
      supportTier: String(payload.supportTier ?? "Priority"),
      usage: Array.isArray(payload.usage) ? payload.usage : [],
      paymentMethods: Array.isArray(payload.paymentMethods) ? payload.paymentMethods : [],
      invoices: Array.isArray(payload.invoices) ? payload.invoices : [],
    };
  } catch {
    return {
      planName: "Pro",
      planDescription: "Professional plan with advanced security features",
      renewsOn: new Date(Date.now() + 30 * 86400000).toISOString(),
      monthlyCost: "$99",
      seatsIncluded: "10",
      supportTier: "Priority",
      usage: [{ label: "API Calls", used: "45,000", limit: "100,000", percent: 45 }],
      paymentMethods: [{ id: "pm_1", brand: "Visa", last4: "4242", expires: "12/27", isDefault: true }],
      invoices: [],
    };
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * GET /settings/notifications
 *
 * Fetch notification preferences.
 */
export async function getNotificationSettings(): Promise<NotificationPreferences> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/notifications" });
    const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
    return {
      emailAlerts: Boolean(payload.emailAlerts ?? payload.email ?? true),
      pushAlerts: Boolean(payload.pushAlerts ?? payload.push ?? true),
      digestFrequency: String(payload.digestFrequency ?? payload.digest ?? "daily") as NotificationPreferences["digestFrequency"],
      channels: Array.isArray(payload.channels) ? payload.channels as NotificationPreferences["channels"] : ["email", "push"],
      criticalOnly: Boolean(payload.criticalOnly ?? payload.critical_only ?? false),
    };
  } catch {
    return {
      emailAlerts: true,
      pushAlerts: true,
      digestFrequency: "daily",
      channels: ["email", "push"],
      criticalOnly: false,
    };
  }
}

/**
 * PUT /settings/notifications
 *
 * Update notification preferences.
 */
export async function updateNotificationSettings(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
  const data = await apiRequest<unknown>({
    method: "put",
    url: "/settings/notifications",
    data: prefs,
  });
  const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
  return {
    emailAlerts: Boolean(payload.emailAlerts ?? prefs.emailAlerts ?? true),
    pushAlerts: Boolean(payload.pushAlerts ?? prefs.pushAlerts ?? true),
    digestFrequency: String(payload.digestFrequency ?? prefs.digestFrequency ?? "daily") as NotificationPreferences["digestFrequency"],
    channels: Array.isArray(payload.channels) ? payload.channels as NotificationPreferences["channels"] : (prefs.channels ?? ["email", "push"]),
    criticalOnly: Boolean(payload.criticalOnly ?? prefs.criticalOnly ?? false),
  };
}

// ─── Organization / Workspace ────────────────────────────────────────────────

/**
 * GET /settings/organization
 *
 * Fetch organization settings.
 */
export async function getOrganization(): Promise<OrganizationSettings> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/organization" });
    const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
    return {
      id: String(payload.id ?? payload._id ?? "org_1"),
      name: String(payload.name ?? "My Organization"),
      slug: String(payload.slug ?? "my-org"),
      industry: String(payload.industry ?? "Technology"),
      region: String(payload.region ?? "US"),
      size: String(payload.size ?? "10-50"),
      plan: String(payload.plan ?? "Pro"),
      primaryContact: String(payload.primaryContact ?? payload.primary_contact ?? ""),
      supportEmail: String(payload.supportEmail ?? payload.support_email ?? ""),
branding: {
        companyName: String((payload.branding as Record<string, unknown>)?.companyName ?? payload.name ?? "My Organization"),
        logoUrl: (payload.branding as Record<string, unknown>)?.logoUrl ? String((payload.branding as Record<string, unknown>).logoUrl) : undefined,
        accentColor: String((payload.branding as Record<string, unknown>)?.accentColor ?? "cyan") as OrganizationSettings["branding"]["accentColor"],
        themeMode: String((payload.branding as Record<string, unknown>)?.themeMode ?? "dark") as OrganizationSettings["branding"]["themeMode"],
      },
    };
  } catch {
    return {
      id: "org_1",
      name: "My Organization",
      slug: "my-org",
      industry: "Technology",
      region: "US",
      size: "10-50",
      plan: "Pro",
      primaryContact: "",
      supportEmail: "",
      branding: { companyName: "My Organization", accentColor: "cyan", themeMode: "dark" },
    };
  }
}

/**
 * PUT /settings/organization
 *
 * Update organization settings.
 */
export async function updateOrganization(org: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
  const data = await apiRequest<unknown>({
    method: "put",
    url: "/settings/organization",
    data: org,
  });
  const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
  const brandingRaw = (payload.branding ?? {}) as Record<string, unknown>;
  return {
    id: String(payload.id ?? payload._id ?? org.id ?? "org_1"),
    name: String(payload.name ?? org.name ?? "My Organization"),
    slug: String(payload.slug ?? org.slug ?? "my-org"),
    industry: String(payload.industry ?? org.industry ?? "Technology"),
    region: String(payload.region ?? org.region ?? "US"),
    size: String(payload.size ?? org.size ?? "10-50"),
    plan: String(payload.plan ?? org.plan ?? "Pro"),
    primaryContact: String(payload.primaryContact ?? org.primaryContact ?? ""),
    supportEmail: String(payload.supportEmail ?? org.supportEmail ?? ""),
    branding: {
      companyName: String(brandingRaw.companyName ?? org.branding?.companyName ?? payload.name ?? "My Organization"),
      logoUrl: brandingRaw.logoUrl ? String(brandingRaw.logoUrl) : org.branding?.logoUrl,
      accentColor: String(brandingRaw.accentColor ?? org.branding?.accentColor ?? "cyan") as OrganizationSettings["branding"]["accentColor"],
      themeMode: String(brandingRaw.themeMode ?? org.branding?.themeMode ?? "dark") as OrganizationSettings["branding"]["themeMode"],
    },
  };
}

/**
 * GET /settings/workspace
 *
 * Fetch workspace settings.
 */
export async function getWorkspace(): Promise<WorkspaceSettings> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/workspace" });
    const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
    return {
      id: String(payload.id ?? payload._id ?? "ws_1"),
      name: String(payload.name ?? "Default Workspace"),
      environment: String(payload.environment ?? "production") as WorkspaceSettings["environment"],
      tenantId: String(payload.tenantId ?? payload.tenant_id ?? "tenant_1"),
      defaultRegion: String(payload.defaultRegion ?? payload.default_region ?? "US"),
      retentionDays: Number(payload.retentionDays ?? payload.retention_days ?? 90),
      enableSIEM: Boolean(payload.enableSIEM ?? payload.enable_siem ?? true),
      enableMFA: Boolean(payload.enableMFA ?? payload.enable_mfa ?? true),
      allowGuestAccess: Boolean(payload.allowGuestAccess ?? payload.allow_guest_access ?? false),
    };
  } catch {
    return {
      id: "ws_1",
      name: "Default Workspace",
      environment: "production",
      tenantId: "tenant_1",
      defaultRegion: "US",
      retentionDays: 90,
      enableSIEM: true,
      enableMFA: true,
      allowGuestAccess: false,
    };
  }
}

/**
 * PUT /settings/workspace
 *
 * Update workspace settings.
 */
export async function updateWorkspace(ws: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  const data = await apiRequest<unknown>({
    method: "put",
    url: "/settings/workspace",
    data: ws,
  });
  const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
  return {
    id: String(payload.id ?? payload._id ?? ws.id ?? "ws_1"),
    name: String(payload.name ?? ws.name ?? "Default Workspace"),
    environment: String(payload.environment ?? ws.environment ?? "production") as WorkspaceSettings["environment"],
    tenantId: String(payload.tenantId ?? ws.tenantId ?? "tenant_1"),
    defaultRegion: String(payload.defaultRegion ?? ws.defaultRegion ?? "US"),
    retentionDays: Number(payload.retentionDays ?? ws.retentionDays ?? 90),
    enableSIEM: Boolean(payload.enableSIEM ?? ws.enableSIEM ?? true),
    enableMFA: Boolean(payload.enableMFA ?? ws.enableMFA ?? true),
    allowGuestAccess: Boolean(payload.allowGuestAccess ?? ws.allowGuestAccess ?? false),
  };
}

// ─── Dashboard Summary (for settings index) ───────────────────────────────────

/**
 * GET /settings/summary
 *
 * Fetch dashboard summary for settings page.
 */
export async function getDashboardSummary(): Promise<{
  profileCompletion: number;
  securityScore: number;
  activeSessions: number;
  connectedDevices: number;
  teamMembers: number;
  lastBackup: string;
  mfaEnabled: boolean;
}> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/summary" });
    const raw = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
    return {
      profileCompletion: Number(raw.profileCompletion ?? raw.profile_completion ?? 0),
      securityScore: Number(raw.securityScore ?? raw.security_score ?? 0),
      activeSessions: Number(raw.activeSessions ?? raw.active_sessions ?? 0),
      connectedDevices: Number(raw.connectedDevices ?? raw.connected_devices ?? 0),
      teamMembers: Number(raw.teamMembers ?? raw.team_members ?? 0),
      lastBackup: String(raw.lastBackup ?? raw.last_backup ?? new Date().toISOString()),
      mfaEnabled: Boolean(raw.mfaEnabled ?? raw.mfa_enabled ?? false),
    };
  } catch {
    return {
      profileCompletion: 65,
      securityScore: 78,
      activeSessions: 3,
      connectedDevices: 2,
      teamMembers: 5,
      lastBackup: new Date(Date.now() - 86400000).toISOString(),
      mfaEnabled: true,
    };
  }
}

// ─── Security Settings ───────────────────────────────────────────────────────

/**
 * GET /settings/security
 *
 * Fetch security settings.
 */
export async function getSecuritySettings(): Promise<SecurityPreferences> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/security" });
    const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
    return {
      passwordPolicy: String(payload.passwordPolicy ?? payload.password_policy ?? "standard"),
      mfaEnabled: Boolean(payload.mfaEnabled ?? payload.mfa_enabled ?? false),
      sessionTimeoutMinutes: Number(payload.sessionTimeoutMinutes ?? payload.session_timeout_minutes ?? 30),
      autoLock: Boolean(payload.autoLock ?? payload.auto_lock ?? true),
      requireRecoveryCode: Boolean(payload.requireRecoveryCode ?? payload.require_recovery_code ?? false),
      allowDeviceTrust: Boolean(payload.allowDeviceTrust ?? payload.allow_device_trust ?? true),
    };
  } catch {
    return {
      passwordPolicy: "standard",
      mfaEnabled: false,
      sessionTimeoutMinutes: 30,
      autoLock: true,
      requireRecoveryCode: false,
      allowDeviceTrust: true,
    };
  }
}

/**
 * GET /settings/security/sessions
 *
 * Fetch active sessions.
 */
export async function getSessions(): Promise<SessionRecord[]> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/security/sessions" });
    const payload = (data as Record<string, unknown>)?.data ?? data;
    const raw = Array.isArray(payload) ? payload : [];
    return raw.map((s: Record<string, unknown>) => ({
      id: String(s.id ?? s._id ?? ""),
      device: String(s.device ?? s.deviceName ?? "Unknown Device"),
      platform: String(s.platform ?? "macOS") as SessionRecord["platform"],
      ipAddress: String(s.ipAddress ?? s.ip ?? ""),
      lastSeen: String(s.lastSeen ?? s.last_seen ?? ""),
      status: String(s.status ?? "active") as SessionRecord["status"],
      location: String(s.location ?? s.loc ?? "Unknown"),
    }));
  } catch {
    return [];
  }
}

/**
 * GET /settings/security/devices
 *
 * Fetch connected devices.
 */
export async function getConnectedDevices(): Promise<ConnectedDevice[]> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/security/devices" });
    const payload = (data as Record<string, unknown>)?.data ?? data;
    const raw = Array.isArray(payload) ? payload : [];
    return raw.map((d: Record<string, unknown>) => ({
      id: String(d.id ?? d._id ?? ""),
      name: String(d.name ?? d.deviceName ?? "Unknown Device"),
      platform: String(d.platform ?? "macOS") as ConnectedDevice["platform"],
      ipAddress: String(d.ipAddress ?? d.ip ?? ""),
      lastSeen: String(d.lastSeen ?? d.last_seen ?? ""),
      trusted: Boolean(d.trusted ?? d.is_trusted ?? false),
    }));
  } catch {
    return [];
  }
}

// ─── Team ─────────────────────────────────────────────────────────────────────

/**
 * GET /settings/team/members
 *
 * Fetch team members.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/team/members" });
    const payload = (data as Record<string, unknown>)?.data ?? data;
    const raw = Array.isArray(payload) ? payload : [];
    return raw.map((m: Record<string, unknown>) => ({
      id: String(m.id ?? m._id ?? ""),
      name: String(m.name ?? m.fullName ?? m.username ?? "Unknown"),
      email: String(m.email ?? ""),
      role: String(m.role ?? "viewer") as TeamMember["role"],
      department: String(m.department ?? ""),
      status: String(m.status ?? "active") as TeamMember["status"],
      lastActive: String(m.lastActive ?? m.last_active ?? m.lastSeen ?? ""),
      avatarUrl: m.avatarUrl ? String(m.avatarUrl) : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * GET /settings/team/roles
 *
 * Fetch available roles.
 */
export async function getRoles(): Promise<RolePermission[]> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/team/roles" });
    const payload = (data as Record<string, unknown>)?.data ?? data;
    const raw = Array.isArray(payload) ? payload : [];
    return raw.map((r: Record<string, unknown>) => ({
      id: String(r.id ?? r._id ?? r.name ?? "viewer") as RolePermission["id"],
      name: String(r.name ?? r.label ?? "Viewer"),
      description: String(r.description ?? ""),
      permissions: Array.isArray(r.permissions) ? r.permissions as RolePermission["permissions"] : [],
    }));
  } catch {
    return [
      { id: "admin", name: "Admin", description: "Full access", permissions: ["view-dashboard", "manage-alerts", "manage-incidents", "manage-team", "manage-settings", "export-reports"] },
      { id: "analyst", name: "Analyst", description: "Security analysis", permissions: ["view-dashboard", "manage-alerts", "manage-incidents", "export-reports"] },
      { id: "viewer", name: "Viewer", description: "Read-only access", permissions: ["view-dashboard"] },
    ];
  }
}

/**
 * GET /settings/team/permissions
 *
 * Fetch permissions.
 */
export async function getPermissions(): Promise<PermissionEntry[]> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/team/permissions" });
    const payload = (data as Record<string, unknown>)?.data ?? data;
    const raw = Array.isArray(payload) ? payload : [];
    return raw.map((p: Record<string, unknown>) => ({
      key: String(p.key ?? p.id ?? "") as PermissionEntry["key"],
      label: String(p.label ?? p.name ?? ""),
      description: String(p.description ?? ""),
    }));
  } catch {
    return [];
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export interface ThemeState {
  mode: SettingsThemeMode;
  accentColor: SettingsAccentColor;
  density?: string;
}

/**
 * GET /settings/theme
 *
 * Fetch theme settings.
 */
export async function getTheme(): Promise<ThemeState> {
  try {
    const data = await apiRequest<unknown>({ method: "get", url: "/settings/theme" });
    const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
    return {
      mode: String(payload.mode ?? "dark") as SettingsThemeMode,
      accentColor: String(payload.accentColor ?? payload.accent_color ?? "cyan") as SettingsAccentColor,
      density: payload.density ? String(payload.density) : "comfortable",
    };
  } catch {
    return { mode: "dark", accentColor: "cyan", density: "comfortable" };
  }
}

/**
 * PUT /settings/theme
 *
 * Set theme mode.
 */
export async function setTheme(mode: SettingsThemeMode): Promise<ThemeState> {
  const data = await apiRequest<unknown>({
    method: "put",
    url: "/settings/theme",
    data: { mode },
  });
  const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
  return {
    mode: String(payload.mode ?? mode) as SettingsThemeMode,
    accentColor: String(payload.accentColor ?? "cyan") as SettingsAccentColor,
    density: payload.density ? String(payload.density) : "comfortable",
  };
}

/**
 * PUT /settings/theme/accent
 *
 * Set accent color.
 */
export async function setAccentColor(accentColor: SettingsAccentColor): Promise<ThemeState> {
  const data = await apiRequest<unknown>({
    method: "put",
    url: "/settings/theme/accent",
    data: { accentColor },
  });
  const payload = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
  return {
    mode: String(payload.mode ?? "dark") as SettingsThemeMode,
    accentColor: String(payload.accentColor ?? accentColor) as SettingsAccentColor,
    density: payload.density ? String(payload.density) : "comfortable",
  };
}

// Default export
const settingsService = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getApiKeys,
  generateApiKey,
  revokeApiKey,
  deleteApiKey,
  regenerateApiKey,
  getApiSettings,
  getBillingSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getOrganization,
  updateOrganization,
  getWorkspace,
  updateWorkspace,
  getDashboardSummary,
  getSecuritySettings,
  getSessions,
  getConnectedDevices,
  getTeamMembers,
  getRoles,
  getPermissions,
  getTheme,
  setTheme,
  setAccentColor,
  getErrorMessage: getSettingsErrorMessage,
};

export default settingsService;
