"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/onboarding",
  "/teacher/join",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, demoMode } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route);
  const showShell = !isPublic && (user || demoMode || pathname === "/chat");

  useEffect(() => {
    setIsTransitioning(true);
    const handle = window.setTimeout(() => setIsTransitioning(false), 200);
    return () => window.clearTimeout(handle);
  }, [pathname]);

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/chat");
    router.prefetch("/graph");
    router.prefetch("/settings/profile");
    router.prefetch("/teacher");
  }, [router]);

  return (
    <div className="relative">
      {showShell && <Sidebar />}
      <div
        className={`${showShell ? "lg:pl-64 pb-20 lg:pb-0" : ""} transition-opacity duration-300 ${
          isTransitioning ? "opacity-70" : "opacity-100"
        }`}
      >
        {children}
      </div>
      {showShell && <BottomNav />}
    </div>
  );
}
