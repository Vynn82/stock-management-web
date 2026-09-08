"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthSession } from "@/types/auth";
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  StoredAuthData,
} from "@/lib/auth/session";

interface AuthContextType extends AuthSession {
  login: (data: StoredAuthData) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setToken(stored.accessToken || stored.token || null);
      if (stored.user) {
        setUser(stored.user as User);
      }
    }
    setLoading(false);
  }, []);

  function handleLogin(data: StoredAuthData) {
    setStoredAuth(data);
    setToken(data.accessToken || data.token || null);
    if (data.user) {
      setUser(data.user as User);
    }
  }

  function handleLogout() {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        login: handleLogin,
        logout: handleLogout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
