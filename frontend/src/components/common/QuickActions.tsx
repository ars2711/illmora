"use client";

import { ArrowUp, RotateCcw, Undo2 } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white"
        aria-label="Go back"
      >
        <Undo2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white"
        aria-label="Refresh page"
      >
        <RotateCcw size={16} />
      </button>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white"
        aria-label="Scroll to top"
      >
        <ArrowUp size={16} />
      </button>
    </div>
  );
}
