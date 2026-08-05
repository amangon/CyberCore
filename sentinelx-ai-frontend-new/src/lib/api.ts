import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { getToken, removeToken } from "./auth";

/**
 * Base URL of the SentinelX AI backend API.
 *
 * Production default is the Render-hosted backend. Override with the
 * NEXT_PUBLIC_API_BASE_URL environment variable (see .env.local.example).
 * For local development, create a `.env.local` with:
 *
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api
 */
/**
 * Normalize the backend API base URL so it ALWAYS ends with exactly one
 * `/api` segment. This guards against duplicate `/api` (`.../api/api/...`)
 * and missing `/api` (`.../scan/...` → 404) misconfiguration, no matter what
 * is set in the Render dashboard `NEXT_PUBLIC_API_BASE_URL` variable.
 */
function normalizeApiBaseUrl(input: string): string {
  let url = input.trim();
  // Strip any trailing slashes for consistent concatenation.
  url = url.replace(/\/+$/, "");
  // Remove a trailing "/api" if present so we can re-append exactly one.
  url = url.replace(/\/api$/i, "");
  return `${url}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://cybercore-backend-csqd.onrender.com/api",
);

/**
 * Reusable Axios instance configured for the SentinelX AI backend.
 *
 * - Base URL is set to the backend API root.
 * - A JWT bearer token is attached to every outgoing request when present.
 * - Responses are unwrapped to `response.data`.
 * - 401 responses clear the session and redirect to the login page.
 * - Network / server errors are normalized into a consistent shape.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach the JWT authorization header (if a token exists) to every request.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// - On success, unwrap the payload and return it directly.
// - On 401, clear the stored token and redirect to login (unless already there).
// - Every other error is rejected with a normalized message.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      removeToken();

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const alreadyOnLogin = currentPath.startsWith("/login");

        if (!alreadyOnLogin) {
          const redirect = encodeURIComponent(currentPath + window.location.search);
          window.location.assign(`/login?redirect=${redirect}`);
        }
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Typed request helper that unwraps `response.data` for you.
 *
 * Supports `onUploadProgress` for file upload progress tracking.
 *
 * @example
 * const alerts = await apiRequest<Alert[]>({ method: "get", url: "/alerts" });
 * const created = await apiRequest<Alert>({ method: "post", url: "/alerts", data: payload });
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<AxiosResponse>({
    ...config,
    // Pass through onUploadProgress from config
    onUploadProgress: config.onUploadProgress,
  });
  return response.data as T;
}

/**
 * Extract a human-readable error message from any thrown value.
 * Handles Axios errors, backend-provided messages, and plain errors.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { message?: string; error?: string; errors?: Record<string, string[]> }
      | undefined;

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      const firstMessage = firstKey ? data.errors[firstKey]?.[0] : undefined;
      if (firstMessage) {
        return firstMessage;
      }
    }

    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }

    if (!error.response) {
      return "Unable to reach the server. Please check your connection and try again.";
    }

    switch (status) {
      case 400:
        return "The request was invalid. Please review your input and try again.";
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource could not be found.";
      case 409:
        return "A conflict occurred. The resource may already exist.";
      case 422:
        return "The submitted data could not be processed. Please correct the highlighted fields.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "An unexpected server error occurred. Please try again later.";
      default:
        return `Request failed with status ${status ?? "unknown"}.`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

/**
 * Normalize an unknown error into a consistently typed API error object.
 * Useful for storing errors in component state or zustand stores.
 */
export function toApiError(error: unknown): {
  status: number | null;
  message: string;
  details: unknown;
} {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status ?? null,
      message: getApiErrorMessage(error),
      details: error.response?.data,
    };
  }

  return {
    status: null,
    message: getApiErrorMessage(error),
    details: error,
  };
}

