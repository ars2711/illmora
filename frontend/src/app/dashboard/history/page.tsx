"use client";

import { useMemo, useState } from "react";
import { Clock, Sparkles, BookOpen, Upload, Filter } from "lucide-react";
import { useTranslations } from "next-intl";

const demoHistory = [
  {
    id: "h1",
    type: "studio",
    title: "graphRecall",
    detail: "deepDive",
    time: "twoHours",
    icon: Sparkles,
  },
  {
    id: "h2",
    type: "upload",
    title: "lecture",
    detail: "nodesGenerated",
    time: "yesterday",
    icon: Upload,
  },
  {
    id: "h3",
    type: "practice",
    title: "recursion",
    detail: "prompts",
    time: "twoDays",
    icon: BookOpen,
  },
  {
    id: "h4",
    type: "studio",
    title: "socratic",
    detail: "confidence",
    time: "threeDays",
    icon: Sparkles,
  },
];

const filters = [
  { id: "all", label: "all" },
  { id: "studio", label: "studio" },
  { id: "upload", label: "upload" },
  { id: "practice", label: "practice" },
];

export default function HistoryPage() {
  const t = useTranslations("history");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredHistory = useMemo(() => {
    if (activeFilter === "all") return demoHistory;
    return demoHistory.filter((item) => item.type === activeFilter);
  }, [activeFilter]);

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 mx-auto max-w-4xl p-6">
          <header className="mb-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
              <Clock size={14} /> {t("eyebrow")}
            </p>
            <h1 className="mt-4 text-2xl font-semibold">{t("title")}</h1>
            <p className="text-slate-500 dark:text-white/60">
              {t("subtitle")}
            </p>
          </header>

          <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                {t("stats.sessions.label")}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {t("stats.sessions.value")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                {t("stats.uploads.label")}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {t("stats.uploads.value")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                {t("stats.momentum.label")}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {t("stats.momentum.value")}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
              <Filter size={12} /> {t("filters.label")}
            </div>
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                  activeFilter === filter.id
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                }`}
              >
                {t(`filters.${filter.label}`)}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
            {filteredHistory.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-5">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {t(`types.${item.type}`)}: {t(`items.${item.title}.title`)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {t(`items.${item.title}.detail`)}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-white/50">
                  {t(`times.${item.time}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
