"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authStorage } from "@/services/storage/authStorage";

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Check auth on app load
  useEffect(() => {
    const accessToken = authStorage.getAccessToken();
    setIsAuthenticated(!!accessToken);
    setLoading(false);
  }, []);

  // 🔹 Login (store both tokens)
  const login = (accessToken: string, refreshToken: string) => {
    authStorage.setTokens(accessToken, refreshToken);
    setIsAuthenticated(true);
  };

  // 🔹 Logout (clear both)
  const logout = () => {
    authStorage.clearTokens();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, loading, login, logout }}
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