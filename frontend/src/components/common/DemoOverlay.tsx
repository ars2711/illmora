"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { X } from "lucide-react";

export default function DemoOverlay() {
  const { demoMode, exitDemo } = useAuth();

  if (!demoMode) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[70]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-amber-200/60 bg-amber-50/90 px-4 py-2 text-xs uppercase tracking-[0.2em] text-amber-800 shadow-lg backdrop-blur dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100">
          <span className="font-semibold">Demo mode</span>
          <span className="hidden sm:inline text-[10px] text-amber-700/80 dark:text-amber-100/80">
            Draft-only actions. Data does not sync.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-amber-200/60 bg-white/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800 shadow-sm hover:bg-white dark:border-amber-200/20 dark:bg-white/10 dark:text-amber-100 dark:hover:bg-white/20"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={exitDemo}
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-amber-500"
            aria-label="Exit demo"
          >
            Exit demo
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
