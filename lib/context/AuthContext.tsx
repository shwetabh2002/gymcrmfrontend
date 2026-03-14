"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authStorage } from "@/services/storage/authStorage";
import { adminLogout, AdminUser } from "@/services/admin/admin.api";

const USER_KEY = "adminUser";

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  user: AdminUser | null;
  login: (accessToken: string, refreshToken: string, user: AdminUser) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [user, setUser]                       = useState<AdminUser | null>(null);

  // ─── BUG FIX ──────────────────────────────────────────────────────────────
  // Previously rehydration only checked for `accessToken`. When you cleared
  // the access token manually (or it expired and was deleted), this ran:
  //
  //   if (accessToken) { setIsAuthenticated(true) }   // false → not set
  //   setLoading(false)                               // loading done
  //
  // Then AppLayout's useEffect fires: !loading && !isAuthenticated → redirect
  // to /login. This happened BEFORE any API call could trigger the interceptor
  // to silently refresh. The user was booted instantly.
  //
  // FIX: Consider the session valid if EITHER token exists. The interceptor
  // will handle getting a new access token on the first API call. Only boot
  // the user when BOTH tokens are absent (genuinely logged out).
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const accessToken  = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();
    const storedUser   = localStorage.getItem(USER_KEY);

    // Session is alive if we have either token
    if (accessToken || refreshToken) {
      setIsAuthenticated(true);
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch {}
      }
    }

    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, adminUser: AdminUser) => {
    authStorage.setTokens(accessToken, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(adminUser));
    setUser(adminUser);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await adminLogout();
    } catch (e) {
      console.warn("Logout API call failed:", e);
    } finally {
      authStorage.clearTokens();
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Sync isAuthenticated when the interceptor clears tokens after a failed refresh
  // (e.g. refresh token also expired). Listen for the storage event so that all
  // open tabs log out simultaneously.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "accessToken" || e.key === "refreshToken") {
        const stillHasSession =
          !!authStorage.getAccessToken() || !!authStorage.getRefreshToken();
        if (!stillHasSession) {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}