import { apiRequest } from "@/lib/api";
import { setToken, removeToken } from "@/lib/auth";
import type {
  AuthResponse,
  LoginPayload,
  ProfileUpdatePayload,
  RegisterPayload,
  User,
} from "@/types/auth";

/**
 * Authentication service.
 *
 * Connects the frontend to the existing backend `/auth` endpoints.
 * All functions return the raw backend payload (with defensive mapping
 * for common response shapes).
 */

function extractToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  if (typeof record.token === "string") return record.token;
  if (typeof record.accessToken === "string") return record.accessToken;
  if (typeof record.access_token === "string") return record.access_token;
  return null;
}

function extractUser(data: unknown): User | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  const candidate = record.user ?? record.data ?? record.profile ?? record;
  if (!candidate || typeof candidate !== "object") return null;

  const user = candidate as Record<string, unknown>;

  return {
    id: String(user.id ?? user._id ?? ""),
    firstName: String(user.firstName ?? ""),
lastName: String(user.lastName ?? ""),
fullName: String(
  user.fullName ??
  `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
),
    email: String(user.email ?? ""),
    role: (user.role ?? "viewer") as User["role"],
    title: user.title ? String(user.title) : undefined,
    avatarUrl: user.avatarUrl ?? user.avatar ? String(user.avatarUrl ?? user.avatar) : undefined,
    organizationId: user.organizationId ?? user.organization ? String(user.organizationId ?? user.organization) : undefined,
    createdAt: user.createdAt ? String(user.createdAt) : undefined,
    updatedAt: user.updatedAt ? String(user.updatedAt) : undefined,
  };
}

/**
 * POST /auth/login
 *
 * Authenticates a user and stores the returned JWT.
 */
export async function login(payload: LoginPayload): Promise<{ token: string; user: User }> {
  const data = await apiRequest<unknown>({
    method: "post",
    url: "/auth/login",
    data: payload,
  });

  const token = extractToken(data);
  const user = extractUser(data);

  if (!token) {
    throw new Error("Authentication failed: no token returned by the server.");
  }

  setToken(token);

  return { token, user: user ?? ({ id: "", fullName: payload.email, email: payload.email } as User) };
}

/**
 * POST /auth/register
 *
 * Creates a new account and returns the session (if the backend auto-logs-in).
 */
export async function register(payload: RegisterPayload): Promise<{ token: string | null; user: User | null }> {
  console.log("REGISTER PAYLOAD:", payload);

  const data = await apiRequest<unknown>({
    method: "post",
    url: "/auth/register",
    data: payload,
  });

  const token = extractToken(data);
  const user = extractUser(data);

  if (token) {
    setToken(token);
  }

  return { token, user };
}
/**
 * GET /auth/me
 *
 * Fetches the currently authenticated user's profile.
 */
export async function getProfile(): Promise<User> {
  const data = await apiRequest<unknown>({
    method: "get",
    url: "/auth/me",
  });

  const user = extractUser(data);

  if (!user) {
    throw new Error("Unable to load profile.");
  }

  return user;
}

/**
 * PUT /auth/me
 *
 * Updates the currently authenticated user's profile.
 */
export async function updateProfile(payload: ProfileUpdatePayload): Promise<User> {
  const data = await apiRequest<unknown>({
    method: "put",
    url: "/auth/update-details",
    data: payload,
  });

  const user = extractUser(data);
  if (!user) {
    throw new Error("Unable to update profile.");
  }

  return user;
}

/**
 * POST /auth/logout
 *
 * Invalidates the session server-side and clears the local token.
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest<unknown>({
      method: "post",
      url: "/auth/logout",
    });
  } finally {
    removeToken();
  }
}

/**
 * Convenience alias to keep call sites expressive.
 */
export const authService = { login, register, getProfile, updateProfile, logout };

