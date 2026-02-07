"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-700 dark:bg-slate-950 dark:text-white/70">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white/70 p-6 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/50">
          Something went wrong
        </p>
        <h1 className="mt-3 font-display text-2xl text-slate-900 dark:text-white">
          Ilmora hit a snag
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-white/60">
          Try reloading, or head back to the studio.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
          >
            Go home
          </Link>
        </div>
        {error?.digest && (
          <p className="mt-4 text-xs text-slate-400">Code: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
