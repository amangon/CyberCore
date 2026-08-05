"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as authService from "@/services/auth.service";
import { getToken, isAuthenticated as hasToken, logout as clearSession } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import type { LoginPayload, RegisterPayload, User } from "@/types/auth";

interface UseAuthReturn {
  readonly user: User | null;
  readonly token: string | null;
  readonly loading: boolean;
  readonly initializing: boolean;
  readonly error: string | null;
  readonly login: (payload: LoginPayload) => Promise<User | null>;
  readonly register: (payload: RegisterPayload) => Promise<User | null>;
  readonly logout: () => void;
  readonly refreshProfile: () => Promise<User | null>;
  readonly isAuthenticated: () => boolean;
}

/**
 * Client-side authentication hook.
 *
 * - On mount, restores the token and fetches the current profile.
 * - Provides `login`, `register`, `logout`, and `refreshProfile`.
 * - Exposes loading / initializing / error states.
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const currentToken = getToken();
      if (!currentToken) {
        if (isMounted) setInitializing(false);
        return;
      }

      setTokenState(currentToken);

      try {
        const profile = await authService.getProfile();
        if (isMounted) setUser(profile);
      } catch (err) {
        // Token likely invalid/expired — clear it quietly.
        clearSession();
        if (isMounted) setUser(null);
        if (isMounted) setTokenState(null);
      } finally {
        if (isMounted) setInitializing(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<User | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await authService.login(payload);
        setTokenState(result.token);
        setUser(result.user);
        return result.user;
      } catch (err) {
        setError(getApiErrorMessage(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<User | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await authService.register(payload);
        setTokenState(result.token);
        setUser(result.user);
        return result.user;
      } catch (err) {
        setError(getApiErrorMessage(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    if (!hasToken()) {
      setUser(null);
      return null;
    }

    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    void authService
      .logout()
      .catch(() => {
        // Even if the server call fails, clear the local session.
      })
      .finally(() => {
        setUser(null);
        setTokenState(null);
        router.replace("/login");
      });
  }, [router]);

  return {
    user,
    token,
    loading,
    initializing,
    error,
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated: () => hasToken(),
  };
}

