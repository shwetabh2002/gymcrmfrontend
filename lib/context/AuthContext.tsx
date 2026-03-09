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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  // 🔹 Rehydrate auth state on app load
  useEffect(() => {
    const accessToken = authStorage.getAccessToken();
    const storedUser = localStorage.getItem(USER_KEY);

    if (accessToken) {
      setIsAuthenticated(true);
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch {}
      }
    }
    setLoading(false);
  }, []);

  // 🔹 Login — store tokens + user info
  const login = (accessToken: string, refreshToken: string, adminUser: AdminUser) => {
    authStorage.setTokens(accessToken, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(adminUser));
    setUser(adminUser);
    setIsAuthenticated(true);
  };

  // 🔹 Logout — call the backend API first, then clear local state
  const logout = async () => {
    try {
      await adminLogout(); // ✅ Invalidate refresh token on the server
    } catch (e) {
      // Continue logout even if API call fails (e.g. token already expired)
      console.warn("Logout API call failed:", e);
    } finally {
      authStorage.clearTokens();
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

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
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}