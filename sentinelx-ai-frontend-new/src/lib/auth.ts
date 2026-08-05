/**
 * Client-side authentication token management.
 *
 * Tokens are stored in `localStorage` (falling back to a module-scoped
 * variable when `localStorage` is unavailable, e.g. during SSR).
 */

const TOKEN_KEY = "sentinelx_token";

// In-memory fallback for non-browser environments.
let memoryToken: string | null = null;

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Persist the JWT access token.
 */
export function setToken(token: string | null | undefined): void {
  const value = token?.trim();
  memoryToken = value || null;

  if (hasLocalStorage()) {
    if (value) {
      window.localStorage.setItem(TOKEN_KEY, value);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }
}

/**
 * Retrieve the current JWT access token, if any.
 */
export function getToken(): string | null {
  if (hasLocalStorage()) {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  }
  return memoryToken;
}

/**
 * Remove the stored JWT access token.
 */
export function removeToken(): void {
  memoryToken = null;
  if (hasLocalStorage()) {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Returns `true` when a token is present.
 *
 * NOTE: this only checks for the existence of a token — it does not
 * validate expiry. Use `authService.getProfile()` for authoritative checks.
 */
export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

/**
 * Clear the local session and redirect to the login page.
 * Optional `redirectTo` preserves the intended destination after login.
 */
export function logout(redirectTo = "/login"): void {
  removeToken();

  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    const target =
      redirectTo && currentPath !== redirectTo
        ? `${redirectTo}?redirect=${encodeURIComponent(currentPath + window.location.search)}`
        : redirectTo;
    window.location.assign(target);
  }
}

