"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Filter, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { adminGet, adminPost } from "@/lib/admin-api";
import useAutoRefresh from "@/hooks/use-auto-refresh";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

const demoAuditEvents = [
  {
    id: "a1",
    action: "Role updated",
    actor: "admin@atlas.edu",
    target: "Mentor • Access: Write",
    time: "12 min ago",
    severity: "Medium",
  },
  {
    id: "a2",
    action: "Data export requested",
    actor: "security@ilmora.ai",
    target: "Institution: Northbay",
    time: "2 hours ago",
    severity: "High",
  },
  {
    id: "a3",
    action: "Schema migration",
    actor: "ops@ilmora.ai",
    target: "migration_2026_02_07",
    time: "Yesterday",
    severity: "Low",
  },
];

function AuditContent() {
  const searchParams = useSearchParams();
  const { token, demoMode } = useAuth();
  const { showToast } = useToast();
  const t = useTranslations("adminAudit");
  const [auditEvents, setAuditEvents] = useState(demoAuditEvents);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    description: string;
    tone?: "default" | "danger";
    onConfirm: () => void;
  } | null>(null);

  const load = useCallback(async () => {
    if (demoMode) {
      setLastUpdated(new Date());
      return;
    }
    setIsRefreshing(true);
    try {
      const data = await adminGet<typeof demoAuditEvents>(
        "/api/v1/admin/audit",
        token,
      );
      setAuditEvents(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      showToast(t("toast.demoFallback"), "warning");
    } finally {
      setIsRefreshing(false);
    }
  }, [demoMode, token, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query !== null) setSearch(query);
  }, [searchParams]);

  useAutoRefresh(load, 45000, autoRefresh && !demoMode);

  const filteredEvents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return auditEvents.filter((event) => {
      const matchesFilter =
        activeFilter === "All" || event.severity === activeFilter;
      const matchesSearch = needle
        ? [event.action, event.actor, event.target]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, auditEvents, search]);

  const summary = useMemo(() => {
    const total = auditEvents.length;
    const high = auditEvents.filter(
      (event) => event.severity === "High",
    ).length;
    const medium = auditEvents.filter(
      (event) => event.severity === "Medium",
    ).length;
    const low = auditEvents.filter((event) => event.severity === "Low").length;
    return { total, high, medium, low };
  }, [auditEvents]);

  const handleExport = async () => {
    if (demoMode) {
      showToast(t("toast.exportQueuedDemo"), "success");
      return;
    }
    try {
      await adminPost("/api/v1/admin/audit/export", token);
      showToast(t("toast.exportQueued"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("toast.exportFailed"), "error");
    }
  };

  const handleAcknowledge = async () => {
    if (demoMode) {
      setAuditEvents([]);
      showToast(t("toast.ackDemo"), "success");
      return;
    }
    try {
      await adminPost("/api/v1/admin/audit/ack", token);
      setAuditEvents([]);
      showToast(t("toast.ack"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("toast.ackFailed"), "error");
    }
  };

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--";

  const handleClearFilters = () => {
    setActiveFilter("All");
    setSearch("");
  };

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <ConfirmDialog
        open={!!confirm?.open}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        tone={confirm?.tone ?? "default"}
        confirmLabel="Proceed"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.onConfirm();
          setConfirm(null);
        }}
      />
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 p-6">
          <header className="mb-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
              <FileText size={14} /> {t("eyebrow")}
            </p>
            <h1 className="mt-4 text-3xl font-semibold">{t("title")}</h1>
            <p className="text-slate-500 dark:text-white/60">
              {t("subtitle")}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-white/10 dark:bg-white/10">
                {t("lastUpdated", { time: lastUpdatedLabel })}
              </span>
              <button
                type="button"
                onClick={load}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                {isRefreshing ? t("refreshing") : t("refresh")}
              </button>
              <button
                type="button"
                onClick={() => setAutoRefresh((prev) => !prev)}
                className={`rounded-full border px-3 py-1 ${
                  autoRefresh
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-slate-200 bg-white/80 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                }`}
              >
                {t("autoRefresh", { state: autoRefresh ? t("on") : t("off") })}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                {t("exportCsv")}
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirm({
                    open: true,
                    title: t("ackConfirm.title"),
                    description: t("ackConfirm.body"),
                    tone: "danger",
                    onConfirm: handleAcknowledge,
                  })
                }
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200 dark:hover:bg-emerald-200/20"
              >
                {t("ackAll")}
              </button>
            </div>
          </header>

          <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                {t("summary.total")}
              </p>
              <p className="mt-2 text-lg font-semibold">{summary.total}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-sm dark:border-rose-200/40 dark:bg-rose-200/10">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-600 dark:text-rose-200">
                {t("summary.high")}
              </p>
              <p className="mt-2 text-lg font-semibold text-rose-700 dark:text-rose-100">
                {summary.high}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm dark:border-amber-200/40 dark:bg-amber-200/10">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-200">
                {t("summary.medium")}
              </p>
              <p className="mt-2 text-lg font-semibold text-amber-700 dark:text-amber-100">
                {summary.medium}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                {t("summary.low")}
              </p>
              <p className="mt-2 text-lg font-semibold">{summary.low}</p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
              <Filter size={12} /> {t("filters.title")}
            </span>
            {["All", "High", "Medium", "Low"].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setActiveFilter(level)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                  activeFilter === level
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                }`}
              >
                {t(`filters.levels.${level.toLowerCase()}`)}
              </button>
            ))}
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("filters.search")}
              className="ml-auto min-w-[200px] rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <h3 className="text-lg font-medium">{t("events.title")}</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {event.action}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      {event.actor} • {event.target}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    <span>{event.time}</span>
                    <span>{event.severity}</span>
                  </div>
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="flex flex-col items-center gap-4 p-10 text-center text-slate-500 dark:text-white/60">
                  <div className="rounded-full border border-slate-200 bg-white/80 p-3 text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {t("events.emptyTitle")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      {t("events.emptyBody")}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                    >
                      {t("events.clearFilters")}
                    </button>
                    <Link
                      href="/admin/incidents"
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200 dark:hover:bg-emerald-200/20"
                    >
                      {t("events.viewIncidents")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-slate-600 dark:text-white/70">
                {t("retention")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const t = useTranslations("adminAudit");
  return (
    <Suspense fallback={<div className="p-6">{t("loading")}</div>}>
      <AuditContent />
    </Suspense>
  );
}
