"use client";

import Link from "next/link";
import { ArrowLeft, Home, FileWarning } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-800 dark:bg-black dark:text-white">
      <div className="ilmora-ambient absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.3),_transparent_60%)] pointer-events-none" />

      <div className="z-10 text-center px-4">
        <div className="mb-6 flex justify-center">
          <div className="p-4 rounded-full bg-slate-200/50 dark:bg-white/10 backdrop-blur-xl">
            <FileWarning className="w-10 h-10 text-slate-500 dark:text-white/60" />
          </div>
        </div>
        <h1 className="text-4xl font-display tracking-tight sm:text-6xl mb-2">
          404
        </h1>
        <p className="text-lg text-slate-500 dark:text-white/60 mb-8 max-w-sm mx-auto">
          The concept you're looking for seems to be missing from the graph.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-105 dark:bg-white dark:text-black"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
