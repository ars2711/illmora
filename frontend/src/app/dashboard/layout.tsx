"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
        <Sidebar />
        <main className="lg:pl-64">
          {children}
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
