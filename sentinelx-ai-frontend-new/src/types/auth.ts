/**
 * Authentication-related types shared across the SentinelX AI frontend.
 */

export type UserRole = "owner" | "admin" | "analyst" | "viewer";

export interface User {
  readonly id: string;
  readonly firstName: string;
readonly lastName: string;
readonly fullName?: string;
  readonly email: string;
  readonly role: UserRole;
  readonly title?: string;
  readonly avatarUrl?: string;
  readonly organizationId?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

export interface RegisterPayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly organization: string;
  readonly email: string;
  readonly password: string;
}

export interface AuthResponse {
  readonly token: string;
  readonly user: User;
  readonly expiresIn?: number;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken?: string;
}

export interface AuthState {
  readonly user: User | null;
  readonly token: string | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export interface PasswordChangePayload {
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface ProfileUpdatePayload {
  readonly fullName?: string;
  readonly title?: string;
  readonly avatarUrl?: string;
  readonly phone?: string;
  readonly timezone?: string;
  readonly locale?: string;
  readonly bio?: string;
  readonly department?: string;
  readonly location?: string;
}

