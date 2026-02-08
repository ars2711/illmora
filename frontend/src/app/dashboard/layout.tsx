"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9))] pb-20 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85))] dark:text-white lg:pb-0">
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
