"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Filter, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { adminGet, adminPost } from "@/lib/admin-api";
import useAutoRefresh from "@/hooks/use-auto-refresh";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Suspense } from "react";

type IncidentLog = {
  id: string;
  title: string;
  status: string;
  severity: string;
  owner: string;
  time: string;
  region: string;
  impact: string;
  services: string[];
};

type IncidentSummary = {
  total: number;
  investigating: number;
  monitoring: number;
  resolved: number;
};

type IncidentListResponse = {
  items: IncidentLog[];
  total: number;
  summary: IncidentSummary;
};

type IncidentTimelineEntry = {
  time: string;
  note: string;
};

type IncidentNote = {
  id: string;
  body: string;
  author: string;
  time: string;
};

const demoIncidentLog: IncidentLog[] = [
  {
    id: "inc-1",
    title: "Queue latency spikes",
    status: "Investigating",
    severity: "High",
    owner: "NOC",
    time: "Today 09:20",
    region: "EU",
    impact: "Delayed sync jobs across EU regions.",
    services: ["Realtime Sync", "Job Orchestrator"],
  },
  {
    id: "inc-2",
    title: "Auth token issuer latency",
    status: "Monitoring",
    severity: "Medium",
    owner: "Security",
    time: "Today 06:15",
    region: "US",
    impact: "Short login delays for 3 minutes.",
    services: ["Identity", "API Gateway"],
  },
  {
    id: "inc-3",
    title: "Search indexing lag",
    status: "Resolved",
    severity: "Low",
    owner: "Operations",
    time: "Yesterday 18:05",
    region: "APAC",
    impact: "Search freshness delayed by 12 minutes.",
    services: ["Search", "Graph Ingest"],
  },
];

function IncidentContent() {
  const searchParams = useSearchParams();
  const { token, demoMode } = useAuth();
  const { showToast } = useToast();
  const [incidents, setIncidents] = useState<IncidentLog[]>(demoIncidentLog);
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [totalCount, setTotalCount] = useState(demoIncidentLog.length);
  const [summary, setSummary] = useState<IncidentSummary>({
    total: demoIncidentLog.length,
    investigating: demoIncidentLog.filter(
      (incident) => incident.status === "Investigating",
    ).length,
    monitoring: demoIncidentLog.filter(
      (incident) => incident.status === "Monitoring",
    ).length,
    resolved: demoIncidentLog.filter(
      (incident) => incident.status === "Resolved",
    ).length,
  });
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
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );
  const [noteDraft, setNoteDraft] = useState("");
  const [incidentNotes, setIncidentNotes] = useState<
    Record<string, IncidentNote[]>
  >({});
  const [incidentTimeline, setIncidentTimeline] = useState<
    Record<string, IncidentTimelineEntry[]>
  >({});

  const getDemoBaseFiltered = useCallback(() => {
    const needle = search.trim().toLowerCase();
    return demoIncidentLog.filter((incident) => {
      const matchesSeverity =
        severityFilter === "All" || incident.severity === severityFilter;
      const matchesSearch = needle
        ? [
            incident.title,
            incident.owner,
            incident.region,
            incident.services.join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        : true;
      return matchesSeverity && matchesSearch;
    });
  }, [search, severityFilter]);

  const load = useCallback(async () => {
    if (demoMode) {
      const baseFiltered = getDemoBaseFiltered();
      const statusFiltered = baseFiltered.filter((incident) =>
        statusFilter === "All" ? true : incident.status === statusFilter,
      );
      setTotalCount(statusFiltered.length);
      setIncidents(
        statusFiltered.slice((page - 1) * pageSize, page * pageSize),
      );
      setSummary({
        total: baseFiltered.length,
        investigating: baseFiltered.filter(
          (incident) => incident.status === "Investigating",
        ).length,
        monitoring: baseFiltered.filter(
          (incident) => incident.status === "Monitoring",
        ).length,
        resolved: baseFiltered.filter(
          (incident) => incident.status === "Resolved",
        ).length,
      });
      setLastUpdated(new Date());
      return;
    }
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({
        skip: String((page - 1) * pageSize),
        limit: String(pageSize),
      });
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (severityFilter !== "All") params.set("severity", severityFilter);
      if (search.trim()) params.set("search", search.trim());
      const data = await adminGet<IncidentListResponse>(
        `/api/v1/admin/system/incidents?${params.toString()}`,
        token,
      );
      setIncidents(data.items);
      setTotalCount(data.total);
      setSummary(data.summary);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      showToast("Incident log is using demo data.", "warning");
    } finally {
      setIsRefreshing(false);
    }
  }, [
    demoMode,
    getDemoBaseFiltered,
    page,
    pageSize,
    search,
    severityFilter,
    showToast,
    statusFilter,
    token,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query !== null) setSearch(query);
    const statusParam = searchParams.get("status");
    if (statusParam) setStatusFilter(statusParam);
    const severityParam = searchParams.get("severity");
    if (severityParam) setSeverityFilter(severityParam);
  }, [searchParams]);

  useAutoRefresh(load, 45000, autoRefresh && !demoMode);

  useEffect(() => {
    setPage(1);
  }, [search, severityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginated = incidents;

  const selectedIncident = incidents.find(
    (incident) => incident.id === selectedIncidentId,
  );

  const getTimelineEntries = (incident: IncidentLog) => {
    const persisted = incidentTimeline[incident.id];
    if (persisted && persisted.length > 0) return persisted;
    const entries = [{ time: incident.time, note: "Incident reported" }];
    if (incident.status === "Monitoring") {
      entries.push({ time: "+12m", note: "Mitigation deployed" });
    }
    if (incident.status === "Resolved") {
      entries.push({ time: "+40m", note: "Incident resolved" });
    }
    return entries;
  };

  const loadIncidentDetails = useCallback(
    async (incidentId: string) => {
      if (demoMode) return;
      try {
        const [timelineData, notesData] = await Promise.all([
          adminGet<IncidentTimelineEntry[]>(
            `/api/v1/admin/system/incidents/${incidentId}/timeline`,
            token,
          ),
          adminGet<IncidentNote[]>(
            `/api/v1/admin/system/incidents/${incidentId}/notes`,
            token,
          ),
        ]);
        setIncidentTimeline((prev) => ({
          ...prev,
          [incidentId]: timelineData,
        }));
        setIncidentNotes((prev) => ({
          ...prev,
          [incidentId]: notesData,
        }));
      } catch (error) {
        console.error(error);
        showToast("Incident details failed to load.", "warning");
      }
    },
    [demoMode, showToast, token],
  );

  useEffect(() => {
    if (!selectedIncidentId) return;
    void loadIncidentDetails(selectedIncidentId);
  }, [loadIncidentDetails, selectedIncidentId]);

  const handleAddNote = () => {
    if (!selectedIncident || !noteDraft.trim()) return;
    if (demoMode) {
      const note: IncidentNote = {
        id: `demo-${Date.now()}`,
        body: noteDraft.trim(),
        author: "demo",
        time: new Date().toISOString(),
      };
      setIncidentNotes((prev) => ({
        ...prev,
        [selectedIncident.id]: [note, ...(prev[selectedIncident.id] ?? [])],
      }));
      setNoteDraft("");
      return;
    }
    adminPost<IncidentNote>(
      `/api/v1/admin/system/incidents/${selectedIncident.id}/notes`,
      token,
      { body: noteDraft.trim() },
    )
      .then((note) => {
        setIncidentNotes((prev) => ({
          ...prev,
          [selectedIncident.id]: [note, ...(prev[selectedIncident.id] ?? [])],
        }));
        setNoteDraft("");
      })
      .catch((error) => {
        console.error(error);
        showToast("Failed to save note.", "error");
      });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSeverityFilter("All");
  };

  const updateIncidentStatus = async (id: string, status: string) => {
    if (demoMode) {
      setIncidents((prev) =>
        prev.map((incident) =>
          incident.id === id ? { ...incident, status } : incident,
        ),
      );
      showToast("Incident updated (demo).", "success");
      return;
    }
    try {
      await adminPost(`/api/v1/admin/system/incidents/${id}/status`, token, {
        status,
      });
      await load();
      showToast("Incident updated.", "success");
    } catch (error) {
      console.error(error);
      showToast("Incident update failed.", "error");
    }
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    const csvCell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;
    let exportItems = paginated;
    if (demoMode) {
      const baseFiltered = getDemoBaseFiltered();
      exportItems = baseFiltered.filter((incident) =>
        statusFilter === "All" ? true : incident.status === statusFilter,
      );
    } else {
      const params = new URLSearchParams({
        skip: "0",
        limit: "5000",
      });
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (severityFilter !== "All") params.set("severity", severityFilter);
      if (search.trim()) params.set("search", search.trim());
      const data = await adminGet<IncidentListResponse>(
        `/api/v1/admin/system/incidents?${params.toString()}`,
        token,
      );
      exportItems = data.items;
    }

    const rows = [
      "id,title,status,severity,owner,time,region,impact,services",
      ...exportItems.map((incident) =>
        [
          csvCell(incident.id),
          csvCell(incident.title),
          csvCell(incident.status),
          csvCell(incident.severity),
          csvCell(incident.owner),
          csvCell(incident.time),
          csvCell(incident.region),
          csvCell(incident.impact),
          csvCell(incident.services.join(" | ")),
        ].join(","),
      ),
    ];
    downloadFile("incident-log.csv", rows.join("\n"), "text/csv");
    showToast("Incident log exported.", "success");
  };

  const handleExportJson = async () => {
    let exportItems = paginated;
    if (demoMode) {
      const baseFiltered = getDemoBaseFiltered();
      exportItems = baseFiltered.filter((incident) =>
        statusFilter === "All" ? true : incident.status === statusFilter,
      );
    } else {
      const params = new URLSearchParams({
        skip: "0",
        limit: "5000",
      });
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (severityFilter !== "All") params.set("severity", severityFilter);
      if (search.trim()) params.set("search", search.trim());
      const data = await adminGet<IncidentListResponse>(
        `/api/v1/admin/system/incidents?${params.toString()}`,
        token,
      );
      exportItems = data.items;
    }

    downloadFile(
      "incident-log.json",
      JSON.stringify(exportItems, null, 2),
      "application/json",
    );
    showToast("Incident log exported.", "success");
  };

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--";

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
              <AlertCircle size={14} /> Incident Log
            </p>
            <h1 className="mt-4 text-3xl font-semibold">
              Operational incidents
            </h1>
            <p className="text-slate-500 dark:text-white/60">
              Track investigations, mitigations, and resolution windows.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-white/10 dark:bg-white/10">
                Last updated {lastUpdatedLabel}
              </span>
              <button
                type="button"
                onClick={load}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                {isRefreshing ? "Refreshing" : "Refresh"}
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
                Auto refresh {autoRefresh ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                Export JSON
              </button>
            </div>
          </header>

          <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                Total
              </p>
              <p className="mt-2 text-lg font-semibold">{summary.total}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm dark:border-amber-200/40 dark:bg-amber-200/10">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-200">
                Investigating
              </p>
              <p className="mt-2 text-lg font-semibold text-amber-700 dark:text-amber-100">
                {summary.investigating}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-3 text-sm dark:border-sky-200/40 dark:bg-sky-200/10">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-600 dark:text-sky-200">
                Monitoring
              </p>
              <p className="mt-2 text-lg font-semibold text-sky-700 dark:text-sky-100">
                {summary.monitoring}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm dark:border-emerald-200/40 dark:bg-emerald-200/10">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-200">
                Resolved
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-700 dark:text-emerald-100">
                {summary.resolved}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
              <Filter size={12} /> Filters
            </span>
            {"All Investigating Monitoring Resolved"
              .split(" ")
              .map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                    statusFilter === status
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                  }`}
                >
                  {status}
                </button>
              ))}
            {"All High Medium Low".split(" ").map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSeverityFilter(level)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                  severityFilter === level
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                }`}
              >
                {level}
              </button>
            ))}
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search incidents"
              className="min-w-[200px] flex-1 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Incident feed</h3>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {paginated.length === 0 ? (
                <div className="flex flex-col items-center gap-4 p-10 text-center text-slate-500 dark:text-white/60">
                  <div className="rounded-full border border-slate-200 bg-white/80 p-3 text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      No incidents match your filters.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      Adjust the filters or create a new incident.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                    >
                      Clear filters
                    </button>
                    <Link
                      href="/admin/health"
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200 dark:hover:bg-emerald-200/20"
                    >
                      Create incident
                    </Link>
                  </div>
                </div>
              ) : (
                paginated.map((incident) => (
                  <div key={incident.id} className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {incident.title}
                        </p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-white/60">
                          {incident.time} • {incident.region} • {incident.owner}
                        </p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                          {incident.impact}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                          Services: {incident.services.join(", ")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.2em]">
                        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                          {incident.status}
                        </span>
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-600 dark:border-rose-200/40 dark:bg-rose-200/10 dark:text-rose-200">
                          {incident.severity}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedIncidentId(incident.id)}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            open: true,
                            title: "Acknowledge incident",
                            description:
                              "Record acknowledgement for this incident.",
                            onConfirm: () =>
                              updateIncidentStatus(incident.id, "Monitoring"),
                          })
                        }
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                      >
                        Acknowledge
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            open: true,
                            title: "Resolve incident",
                            description:
                              "Mark this incident as resolved and archive it.",
                            tone: "danger",
                            onConfirm: () =>
                              updateIncidentStatus(incident.id, "Resolved"),
                          })
                        }
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200 dark:hover:bg-emerald-200/20"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-xs uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:text-white/60">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page >= totalPages}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedIncident && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-6">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">
                  Incident detail
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  {selectedIncident.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                  {selectedIncident.time} • {selectedIncident.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncidentId(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Severity
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedIncident.severity}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Owner
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedIncident.owner}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Region
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedIncident.region}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              {selectedIncident.impact}
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                Timeline
              </p>
              <div className="mt-3 space-y-2">
                {getTimelineEntries(selectedIncident).map((entry) => (
                  <div
                    key={`${selectedIncident.id}-${entry.time}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="text-slate-500 dark:text-white/60">
                      {entry.time}
                    </span>
                    <span className="text-slate-700 dark:text-white/80">
                      {entry.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                Notes
              </p>
              <div className="mt-3 space-y-2">
                {(incidentNotes[selectedIncident.id] ?? []).length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    No notes yet.
                  </p>
                ) : (
                  (incidentNotes[selectedIncident.id] ?? []).map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                    >
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
                        <span>{note.author}</span>
                        <span>{note.time}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-700 dark:text-white/80">
                        {note.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Add note"
                  className="min-w-[220px] flex-1 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  Add note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IncidentLogPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading incidents...</div>}>
      <IncidentContent />
    </Suspense>
  );
}
