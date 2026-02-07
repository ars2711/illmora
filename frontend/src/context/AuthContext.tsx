"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearStoredAuthToken,
  decodeJwtPayload,
  getStoredAuthToken,
  setStoredAuthToken,
} from "@/lib/auth";

interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  token: string | null;
  demoMode: boolean;
  logOut: () => Promise<void>;
  startDemo: () => void;
  exitDemo: () => void;
  signInWithToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  demoMode: false,
  logOut: async () => {},
  startDemo: () => {},
  exitDemo: () => {},
  signInWithToken: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const router = useRouter();

  const buildUserFromToken = (value: string) => {
    const payload = decodeJwtPayload(value);
    if (!payload?.sub) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.name ?? payload.email?.split("@")[0],
    } as AuthUser;
  };

  useEffect(() => {
    // Persist demo mode across refreshes
    if (typeof window !== "undefined") {
      const savedDemo = localStorage.getItem("ilmora-demo");
      if (savedDemo === "true") {
        setDemoMode(true);
      }
    }
  }, []);

  const logOut = async () => {
    try {
      clearStoredAuthToken();
      setUser(null);
      setToken(null);
      exitDemo();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const startDemo = () => {
    setDemoMode(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("ilmora-demo", "true");
    }
  };

  const exitDemo = () => {
    setDemoMode(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("ilmora-demo");
      sessionStorage.removeItem("ilmora-demo");
      // Force refresh/home redirect as requested
      if (window.location.pathname !== "/") {
        router.push("/");
      } else {
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    const stored = getStoredAuthToken();
    if (!stored) {
      setLoading(false);
      return;
    }
    const nextUser = buildUserFromToken(stored);
    if (nextUser) {
      setUser(nextUser);
      setToken(stored);
    } else {
      clearStoredAuthToken();
    }
    setLoading(false);
  }, []);

  const signInWithToken = (value: string) => {
    const nextUser = buildUserFromToken(value);
    if (!nextUser) {
      clearStoredAuthToken();
      return;
    }
    setStoredAuthToken(value);
    setUser(nextUser);
    setToken(value);
    exitDemo();
    setLoading(false);
  };

  // Removed conflicting useEffect that was clearing localStorage
  // The persistence logic is now handled solely in the first useEffect and startDemo/exitDemo

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        demoMode,
        logOut,
        startDemo,
        exitDemo,
        signInWithToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
