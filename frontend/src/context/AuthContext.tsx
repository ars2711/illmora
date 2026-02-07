"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  demoMode: boolean;
  logOut: () => Promise<void>;
  startDemo: () => void;
  exitDemo: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  demoMode: false,
  logOut: async () => {},
  startDemo: () => {},
  exitDemo: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const router = useRouter();

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
      await signOut(auth);
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const t = await user.getIdToken();
        setToken(t);
        exitDemo();
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Removed conflicting useEffect that was clearing localStorage
  // The persistence logic is now handled solely in the first useEffect and startDemo/exitDemo

  return (
    <AuthContext.Provider
      value={{ user, loading, token, demoMode, logOut, startDemo, exitDemo }}
    >
      {children}
    </AuthContext.Provider>
  );
}
