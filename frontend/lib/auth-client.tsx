"use client";

/**
 * Client-side auth state for the local (self-hosted) auth flow.
 *
 * The session itself lives in an HttpOnly cookie set by the backend, so it is
 * never readable from JavaScript. This provider only mirrors the *identity* of
 * the signed-in user for the UI by calling `GET /api/v1/auth/me`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, type AuthUser } from "@/lib/api";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  refresh: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await api.auth.me();
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    let active = true;
    refresh()
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Clearing local state still signs the user out of the UI.
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, refresh, logout }),
    [user, loading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
