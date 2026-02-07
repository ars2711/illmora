"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Activity, AlertCircle, Server } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { adminGet, adminPost } from "@/lib/admin-api";
import MiniBarChart from "@/components/common/MiniBarChart";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import useAutoRefresh from "@/hooks/use-auto-refresh";
import LineChart from "@/components/common/LineChart";

const demoServices = [
  { id: "s1", name: "API Gateway", status: "Operational", uptime: "99.98%" },
  { id: "s2", name: "Realtime Sync", status: "Operational", uptime: "99.91%" },
  { id: "s3", name: "AI Orchestrator", status: "Degraded", uptime: "98.2%" },
];

type IncidentTimelineEntry = {
  time: string;
  note: string;
};

type Incident = {
  id: string;
  title: string;
  time: string;
  status: string;
  severity?: string;
  owner?: string;
  impact?: string;
  services?: string[];
  timeline?: IncidentTimelineEntry[];
};

const demoIncidents: Incident[] = [
  {
    id: "i1",
    title: "Queue latency spikes",
    time: "Today 09:20",
    status: "Investigating",
    severity: "High",
    owner: "NOC",
    impact: "Delayed sync jobs across EU regions.",
    services: ["Realtime Sync", "Job Orchestrator"],
    timeline: [
      { time: "09:20", note: "Alert fired for queue depth > 600." },
      { time: "09:28", note: "Replica promoted to absorb traffic." },
      { time: "09:34", note: "Backfill queue draining steadily." },
    ],
  },
  {
    id: "i2",
    title: "Minor auth outage",
    time: "Yesterday 18:05",
    status: "Resolved",
    severity: "Medium",
    owner: "Security",
    impact: "Short login failures for 4 minutes.",
    services: ["Identity", "API Gateway"],
    timeline: [
      { time: "18:05", note: "Token issuer latency reported." },
      { time: "18:08", note: "Rolled back traffic split." },
      { time: "18:12", note: "All auth checks green." },
    ],
  },
];

const demoUptimeTrend = [99.9, 99.8, 99.95, 99.92, 99.96, 99.94, 99.98];
const demoErrorRateTrend = [0.18, 0.22, 0.2, 0.19, 0.25, 0.21, 0.2];
const demoQueueHistogram = [
  { label: "<100", value: 28 },
  { label: "100-300", value: 41 },
  { label: "300-600", value: 17 },
  { label: ">600", value: 6 },
];

export default function SystemHealthPage() {
  const { token, demoMode } = useAuth();
  const { showToast } = useToast();
  const [services, setServices] = useState(demoServices);
  const [incidents, setIncidents] = useState<Incident[]>(demoIncidents);
  const [uptimeTrend, setUptimeTrend] = useState(demoUptimeTrend);
  const [errorRateTrend, setErrorRateTrend] = useState(demoErrorRateTrend);
  const [queueHistogram, setQueueHistogram] = useState(demoQueueHistogram);
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
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentStatus, setIncidentStatus] = useState("Investigating");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );

  const toSeries = (values: number[]) =>
    values.map((value, index) => ({ label: `T${index + 1}`, value }));

  const load = useCallback(async () => {
    if (demoMode) {
      setLastUpdated(new Date());
      return;
    }
    setIsRefreshing(true);
    try {
      const data = await adminGet<{
        services: typeof demoServices;
        incidents: Incident[];
        uptimeTrend: number[];
        errorRateTrend?: number[];
        queueHistogram?: { label: string; value: number }[];
      }>("/api/v1/admin/system/health", token);
      setServices(data.services);
      setIncidents(data.incidents);
      setUptimeTrend(data.uptimeTrend);
      if (data.errorRateTrend) setErrorRateTrend(data.errorRateTrend);
      if (data.queueHistogram) setQueueHistogram(data.queueHistogram);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      showToast("System health is using demo data.", "warning");
    } finally {
      setIsRefreshing(false);
    }
  }, [demoMode, token, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useAutoRefresh(load, 45000, autoRefresh && !demoMode);

  const handleIncidentCreate = async () => {
    if (!incidentTitle.trim()) {
      showToast("Enter an incident title.", "info");
      return;
    }
    if (demoMode) {
      setIncidents((prev) => [
        {
          id: `demo-${Date.now()}`,
          title: incidentTitle,
          time: "Just now",
          status: incidentStatus,
        },
        ...prev,
      ]);
      setIncidentTitle("");
      showToast("Incident created (demo).", "success");
      return;
    }
    try {
      const created = await adminPost<(typeof demoIncidents)[number]>(
        "/api/v1/admin/system/incidents",
        token,
        { title: incidentTitle, status: incidentStatus },
      );
      setIncidents((prev) => [created, ...prev]);
      setIncidentTitle("");
      showToast("Incident created.", "success");
    } catch (error) {
      console.error(error);
      showToast("Incident creation failed.", "error");
    }
  };

  const handleIncidentResolve = async (incidentId: string) => {
    if (demoMode) {
      setIncidents((prev) =>
        prev.map((incident) =>
          incident.id === incidentId
            ? { ...incident, status: "Resolved" }
            : incident,
        ),
      );
      showToast("Incident resolved (demo).", "success");
      return;
    }
    try {
      await adminPost(
        `/api/v1/admin/system/incidents/${incidentId}/resolve`,
        token,
      );
      setIncidents((prev) =>
        prev.map((incident) =>
          incident.id === incidentId
            ? { ...incident, status: "Resolved" }
            : incident,
        ),
      );
      showToast("Incident resolved.", "success");
    } catch (error) {
      console.error(error);
      showToast("Incident resolve failed.", "error");
    }
  };

  const openConfirm = (config: {
    title: string;
    description: string;
    tone?: "default" | "danger";
    onConfirm: () => void;
  }) => {
    setConfirm({ open: true, ...config });
  };

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--";

  const selectedIncident = incidents.find(
    (incident) => incident.id === selectedIncidentId,
  );

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
              <ShieldCheck size={14} /> System Health
            </p>
            <h1 className="mt-4 text-3xl font-semibold">
              Uptime and resilience
            </h1>
            <p className="text-slate-500 dark:text-white/60">
              Track service status, incidents, and operational readiness.
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
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <Activity className="h-5 w-5 text-emerald-500" />
              <h2 className="mt-4 text-lg font-semibold">Global uptime</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                99.95% across regions this month.
              </p>
              <div className="mt-4">
                <LineChart data={toSeries(uptimeTrend)} unit="%" />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <Server className="h-5 w-5 text-slate-600 dark:text-white/70" />
              <h2 className="mt-4 text-lg font-semibold">Queue health</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                3 workers online • avg delay 320ms.
              </p>
              <div className="mt-4 text-slate-700 dark:text-white/70">
                <MiniBarChart data={queueHistogram} />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h2 className="mt-4 text-lg font-semibold">Active alerts</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                2 warnings • 0 critical.
              </p>
              <div className="mt-4">
                <LineChart data={toSeries(errorRateTrend)} unit="%" />
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <h3 className="text-lg font-medium">Create incident</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1.6fr_0.8fr_auto]">
              <input
                value={incidentTitle}
                onChange={(event) => setIncidentTitle(event.target.value)}
                placeholder="Incident summary"
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <select
                value={incidentStatus}
                onChange={(event) => setIncidentStatus(event.target.value)}
                aria-label="Incident status"
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <option>Investigating</option>
                <option>Identified</option>
                <option>Monitoring</option>
              </select>
              <button
                type="button"
                onClick={handleIncidentCreate}
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Create
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">Service status</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-6"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {service.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        Uptime {service.uptime}
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                      {service.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">Incident timeline</h3>
              </div>
              <div className="space-y-4 p-6">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {incident.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      {incident.time} • {incident.status}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openConfirm({
                            title: "Resolve incident",
                            description:
                              "Mark this incident as resolved and archive it.",
                            onConfirm: () => handleIncidentResolve(incident.id),
                          })
                        }
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200 dark:hover:bg-emerald-200/20"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedIncidentId(incident.id)}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                ))}
                <Link
                  href="/admin/incidents"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  View full incident log
                </Link>
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
                  {selectedIncident.severity ?? "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Owner
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedIncident.owner ?? "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Services
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedIncident.services?.join(", ") ?? "--"}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              {selectedIncident.impact ?? "Impact details pending."}
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                Timeline
              </p>
              <div className="mt-3 space-y-2">
                {(selectedIncident.timeline ?? []).map((entry) => (
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
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Acknowledge incident",
                    description: "Record an acknowledgement for this incident.",
                    onConfirm: () =>
                      showToast("Incident acknowledged.", "success"),
                  })
                }
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                Acknowledge
              </button>
              <button
                type="button"
                onClick={() => showToast("Follow-up task created.", "success")}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200 dark:hover:bg-emerald-200/20"
              >
                Create follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
