"use client";

export default function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tabs skeleton */}
      <div className="flex gap-3 border-b border-slate-200 dark:border-white/10">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 w-24 rounded-t-lg bg-slate-200 dark:bg-white/10"
          />
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
        <div className="space-y-4">
          <div className="h-80 rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-slate-200 dark:bg-white/10"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5">
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-slate-200 dark:bg-white/10"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
