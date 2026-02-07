"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="h-screen w-full flex flex-col items-center justify-center bg-red-50 text-red-900 dark:bg-[#1a0505] dark:text-red-100">
        <div className="text-center px-4 max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 backdrop-blur-xl">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2 tracking-tight">
            System Malfunction
          </h2>
          <p className="mb-8 text-red-700/80 dark:text-red-200/60">
            A critical error interrupted the simulation. The state has been
            captured.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-transform hover:scale-105 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
          >
            <RefreshCcw className="w-4 h-4" />
            Reboot Interface
          </button>
        </div>
      </body>
    </html>
  );
}
