"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "./api-client";
import type { CurrentUser } from "./types";

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { user } = await api<{ user: CurrentUser }>("/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    router.push("/login");
  }, [router]);

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/**
 * Wrap any protected page's content with this. Redirects to /login if
 * there's no session, and (when `role` is given) to the dashboard if the
 * logged-in user's role doesn't match — the backend enforces this too
 * (RolesGuard), this is just so the UI doesn't show a form the API will
 * reject.
 */
export function RequireAuth({ children, role }: { children: React.ReactNode; role?: "SUPER_ADMIN" }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role && user.role !== role) {
      router.replace("/dashboard");
    }
  }, [loading, user, role, router]);

  if (loading || !user || (role && user.role !== role)) {
    return (
      <div style={{ padding: "var(--sp-8)", textAlign: "center" }}>
        <p className="meta">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
