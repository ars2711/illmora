"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-white/70">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm uppercase tracking-[0.3em]">Loading</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-white/70">
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-6 py-5 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Session required
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-white/60">
            Redirecting to login. If nothing happens, use the button below.
          </p>
          <a
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
