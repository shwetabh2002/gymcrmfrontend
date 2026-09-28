"use client";

import React, {
  createContext,
  useCallback,
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  // Session is alive if either token exists — interceptor refreshes access.
  useEffect(() => {
    const accessToken = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();
    const storedUser = localStorage.getItem(USER_KEY);

    if (accessToken || refreshToken) {
      setIsAuthenticated(true);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          /* ignore corrupt user blob */
        }
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken: string, adminUser: AdminUser) => {
      authStorage.setTokens(accessToken, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(adminUser));
      setUser(adminUser);
      setIsAuthenticated(true);
    },
    [],
  );

  const logout = useCallback(async () => {
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
  }, []);

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
    <AuthContext.Provider
      value={{ isAuthenticated, loading, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
