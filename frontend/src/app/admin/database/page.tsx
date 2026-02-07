"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Database,
  HardDrive,
  Activity,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Sparkline from "@/components/common/Sparkline";
import MiniBarChart from "@/components/common/MiniBarChart";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LineChart from "@/components/common/LineChart";
import { adminGet, adminPost } from "@/lib/admin-api";
import useAutoRefresh from "@/hooks/use-auto-refresh";

const demoClusters = [
  {
    id: "primary",
    name: "Primary Cluster",
    status: "Healthy",
    latency: "92ms",
    storage: "62%",
  },
  {
    id: "replica",
    name: "Read Replica",
    status: "Lag 1.8s",
    latency: "118ms",
    storage: "54%",
  },
];

const demoSlowQueries = [
  {
    id: "q1",
    query: "SELECT * FROM memory_nodes WHERE updated_at > ...",
    time: "1.2s",
    impact: "High",
  },
  {
    id: "q2",
    query: "JOIN knowledge_edges ON memory_nodes.id = ...",
    time: "890ms",
    impact: "Medium",
  },
];

const demoJobs = [
  { id: "j1", name: "VACUUM ANALYZE knowledge_edges", status: "Running" },
  { id: "j2", name: "Backup snapshot", status: "Queued" },
  { id: "j3", name: "Reindex memory_nodes", status: "Scheduled" },
];

const demoTrends = {
  latency: [86, 92, 88, 94, 90, 92, 89],
  storage: [54, 56, 58, 59, 60, 62, 62],
  replicaLag: [1.4, 1.8, 1.2, 1.6, 1.7, 1.5, 1.8],
  errorRate: [0.2, 0.18, 0.24, 0.16, 0.19, 0.2, 0.21],
  latencyHistogram: [
    { label: "<50", value: 18 },
    { label: "50-90", value: 32 },
    { label: "90-140", value: 21 },
    { label: "140-220", value: 9 },
  ],
};

const demoRestorePoints = [
  { id: "rp1", label: "Today 04:00", age: "2h", region: "us-east" },
  { id: "rp2", label: "Yesterday 23:00", age: "7h", region: "us-east" },
  { id: "rp3", label: "Yesterday 18:00", age: "12h", region: "eu-west" },
];

const demoRollbackHistory = [
  {
    id: "rb1",
    label: "Migration 2024.12.08",
    time: "Today 06:12",
    status: "Completed",
  },
  {
    id: "rb2",
    label: "Migration 2024.12.02",
    time: "Yesterday 21:40",
    status: "Completed",
  },
];

const demoRunbookSteps = [
  { id: "step-1", label: "Confirm restore point", status: "Ready" },
  { id: "step-2", label: "Notify stakeholders", status: "Pending" },
  { id: "step-3", label: "Lock write traffic", status: "Pending" },
  { id: "step-4", label: "Run restore workflow", status: "Pending" },
  { id: "step-5", label: "Validate data integrity", status: "Pending" },
];

type RunbookStep = {
  id: string;
  label: string;
  status: string;
};

export default function DatabaseConsolePage() {
  const { token, demoMode } = useAuth();
  const { showToast } = useToast();
  const [clusters, setClusters] = useState(demoClusters);
  const [slowQueries, setSlowQueries] = useState(demoSlowQueries);
  const [jobs, setJobs] = useState(demoJobs);
  const [trends, setTrends] = useState(demoTrends);
  const [restorePoints, setRestorePoints] = useState(demoRestorePoints);
  const [rollbackHistory, setRollbackHistory] = useState(demoRollbackHistory);
  const [runbookSteps, setRunbookSteps] =
    useState<RunbookStep[]>(demoRunbookSteps);
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

  const toSeries = (values: number[]) =>
    values.map((value, index) => ({ label: `T${index + 1}`, value }));

  const load = useCallback(async () => {
    if (demoMode) {
      setLastUpdated(new Date());
      return;
    }
    setIsRefreshing(true);
    try {
      const [clusterData, queryData, jobData, trendData] = await Promise.all([
        adminGet<typeof demoClusters>("/api/v1/admin/database/overview", token),
        adminGet<typeof demoSlowQueries>(
          "/api/v1/admin/database/slow-queries",
          token,
        ),
        adminGet<typeof demoJobs>("/api/v1/admin/database/jobs", token),
        adminGet<typeof demoTrends>("/api/v1/admin/database/trends", token),
      ]);
      setClusters(clusterData);
      setSlowQueries(queryData);
      setJobs(jobData);
      setTrends(trendData);
      const [restoreResult, rollbackResult, runbookResult] =
        await Promise.allSettled([
          adminGet<typeof demoRestorePoints>(
            "/api/v1/admin/database/restore-points",
            token,
          ),
          adminGet<typeof demoRollbackHistory>(
            "/api/v1/admin/database/rollback-history",
            token,
          ),
          adminGet<RunbookStep[]>("/api/v1/admin/database/runbook", token),
        ]);
      if (restoreResult.status === "fulfilled") {
        setRestorePoints(restoreResult.value);
      }
      if (rollbackResult.status === "fulfilled") {
        setRollbackHistory(rollbackResult.value);
      }
      if (runbookResult.status === "fulfilled") {
        setRunbookSteps(runbookResult.value);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      showToast("Database console is using demo data.", "warning");
    } finally {
      setIsRefreshing(false);
    }
  }, [demoMode, token, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useAutoRefresh(load, 30000, autoRefresh && !demoMode);

  const handleBackup = async () => {
    if (demoMode) {
      showToast("Backup snapshot queued (demo).", "success");
      return;
    }
    try {
      await adminPost("/api/v1/admin/database/backup", token);
      showToast("Backup snapshot queued.", "success");
    } catch (error) {
      console.error(error);
      showToast("Backup request failed.", "error");
    }
  };

  const handleJobRun = async (jobId: string) => {
    if (demoMode) {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: "Running" } : job,
        ),
      );
      showToast("Job started (demo).", "success");
      return;
    }
    try {
      await adminPost(`/api/v1/admin/database/jobs/${jobId}/run`, token);
      showToast("Job started.", "success");
      void load();
    } catch (error) {
      console.error(error);
      showToast("Job start failed.", "error");
    }
  };

  const handleQueryTerminate = async (queryId: string) => {
    if (demoMode) {
      showToast("Query terminated (demo).", "success");
      return;
    }
    try {
      await adminPost(
        `/api/v1/admin/database/queries/${queryId}/terminate`,
        token,
      );
      showToast("Query terminated.", "success");
    } catch (error) {
      console.error(error);
      showToast("Query termination failed.", "error");
    }
  };

  const handleReplicaAction = async (clusterId: string, action: string) => {
    if (demoMode) {
      showToast(`${action} executed (demo).`, "success");
      return;
    }
    try {
      const endpoint =
        action === "Promote"
          ? `/api/v1/admin/database/replicas/${clusterId}/promote`
          : "/api/v1/admin/database/failover/drill";
      await adminPost(endpoint, token);
      showToast(`${action} executed.`, "success");
    } catch (error) {
      console.error(error);
      showToast(`${action} failed.`, "error");
    }
  };

  const handleRollback = async () => {
    if (demoMode) {
      showToast("Rollback queued (demo).", "success");
      return;
    }
    try {
      await adminPost("/api/v1/admin/database/rollback", token);
      showToast("Rollback queued.", "success");
    } catch (error) {
      console.error(error);
      showToast("Rollback failed.", "error");
    }
  };

  const handlePointInTimeRestore = async () => {
    if (demoMode) {
      showToast("PITR initiated (demo).", "success");
      return;
    }
    try {
      await adminPost("/api/v1/admin/database/restore", token);
      showToast("PITR initiated.", "success");
    } catch (error) {
      console.error(error);
      showToast("PITR failed.", "error");
    }
  };

  const handleRunbookComplete = async (stepId: string) => {
    if (demoMode) {
      setRunbookSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, status: "Done" } : step,
        ),
      );
      showToast("Runbook step completed (demo).", "success");
      return;
    }
    try {
      await adminPost(
        `/api/v1/admin/database/runbook/${stepId}/complete`,
        token,
      );
      setRunbookSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, status: "Done" } : step,
        ),
      );
      showToast("Runbook step completed.", "success");
    } catch (error) {
      console.error(error);
      showToast("Runbook update failed.", "error");
    }
  };

  const handleRunbookReset = async () => {
    if (demoMode) {
      setRunbookSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === 0 ? "Ready" : "Pending",
        })),
      );
      showToast("Runbook reset (demo).", "success");
      return;
    }
    try {
      await adminPost("/api/v1/admin/database/runbook/reset", token);
      void load();
      showToast("Runbook reset.", "success");
    } catch (error) {
      console.error(error);
      showToast("Runbook reset failed.", "error");
    }
  };

  const handleRestorePoint = async (restoreId: string) => {
    if (demoMode) {
      showToast("Restore queued (demo).", "success");
      return;
    }
    try {
      await adminPost(
        `/api/v1/admin/database/restore-points/${restoreId}/restore`,
        token,
      );
      showToast("Restore queued.", "success");
    } catch (error) {
      console.error(error);
      showToast("Restore failed.", "error");
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
              <Database size={14} /> Database Console
            </p>
            <h1 className="mt-4 text-3xl font-semibold">Data control center</h1>
            <p className="text-slate-500 dark:text-white/60">
              Monitor replication, query health, and maintenance operations.
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                      {cluster.name}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      {cluster.status}
                    </h2>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200">
                    Live
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {cluster.id === "replica" ? (
                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: "Promote replica",
                          description:
                            "This will promote the replica to primary. Continue?",
                          tone: "danger",
                          onConfirm: () =>
                            handleReplicaAction(cluster.id, "Promote"),
                        })
                      }
                      className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                    >
                      Promote replica
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: "Run failover drill",
                          description:
                            "This runs a failover simulation. Confirm to proceed.",
                          onConfirm: () =>
                            handleReplicaAction(cluster.id, "Failover drill"),
                        })
                      }
                      className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                    >
                      Run failover drill
                    </button>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Latency trend
                  </div>
                  <Sparkline points={trends.latency} stroke="#0f172a" />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/10">
                    <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                      Latency
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {cluster.latency}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/10">
                    <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                      Storage
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {cluster.storage}
                    </p>
                    <div className="mt-2">
                      <Sparkline points={trends.storage} stroke="#0f172a" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/10">
                    <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                      Backups
                    </p>
                    <p className="mt-2 text-sm font-semibold">4 hr ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">Slow queries</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {slowQueries.map((query) => (
                  <div key={query.id} className="p-6">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {query.query}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                      <span>Time {query.time}</span>
                      <span>Impact {query.impact}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          showToast("Query inspection opened.", "info")
                        }
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openConfirm({
                            title: "Terminate query",
                            description:
                              "This will terminate a live query immediately.",
                            tone: "danger",
                            onConfirm: () => handleQueryTerminate(query.id),
                          })
                        }
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-100 dark:border-rose-200/40 dark:bg-rose-200/10 dark:text-rose-200 dark:hover:bg-rose-200/20"
                      >
                        Terminate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">Maintenance queue</h3>
              </div>
              <div className="space-y-3 p-6">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                  >
                    <span className="text-slate-700 dark:text-white/80">
                      {job.name}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                      {job.status}
                    </span>
                    {job.status !== "Running" && (
                      <button
                        type="button"
                        onClick={() =>
                          openConfirm({
                            title: "Run maintenance job",
                            description:
                              "This will start the maintenance job now.",
                            onConfirm: () => handleJobRun(job.id),
                          })
                        }
                        className="rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                      >
                        Run now
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() =>
                    openConfirm({
                      title: "Run backup snapshot",
                      description:
                        "Trigger a snapshot backup for the primary cluster.",
                      onConfirm: handleBackup,
                    })
                  }
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <HardDrive className="h-4 w-4" /> Run backup snapshot
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-medium">Latency histogram</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Distribution of query latency over the last hour.
              </p>
              <div className="mt-4 text-slate-700 dark:text-white/70">
                <MiniBarChart data={trends.latencyHistogram} />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-medium">Replica lag trend</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Lag in seconds (last 7 samples).
              </p>
              <div className="mt-4">
                <LineChart data={toSeries(trends.replicaLag)} unit="s" />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-medium">Error rate trend</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                API error rate (%) across services.
              </p>
              <div className="mt-4">
                <LineChart data={toSeries(trends.errorRate)} unit="%" />
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">Restore points</h3>
              </div>
              <div className="space-y-3 p-6">
                {restorePoints.map((point) => (
                  <div
                    key={point.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {point.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        Age {point.age} • {point.region}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: "Restore from point",
                          description:
                            "This will restore the database to this snapshot.",
                          tone: "danger",
                          onConfirm: () => handleRestorePoint(point.id),
                        })
                      }
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-100 dark:border-rose-200/40 dark:bg-rose-200/10 dark:text-rose-200 dark:hover:bg-rose-200/20"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">Rollback history</h3>
              </div>
              <div className="space-y-3 p-6">
                {rollbackHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      {item.time} • {item.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Restore runbook</h3>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  Guided steps for safe restore execution.
                </p>
              </div>
              <ClipboardCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="mt-4 space-y-3">
              {runbookSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                >
                  <span className="text-slate-700 dark:text-white/80">
                    {step.label}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => showToast("Runbook opened.", "info")}
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Open runbook
              </button>
              <button
                type="button"
                onClick={() =>
                  runbookSteps[0]
                    ? handleRunbookComplete(runbookSteps[0].id)
                    : showToast("No runbook steps available.", "info")
                }
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200 dark:hover:bg-emerald-200/20"
              >
                Complete next step
              </button>
              <button
                type="button"
                onClick={handleRunbookReset}
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Reset runbook
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-medium">Replication guardrails</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-white/70">
                Auto-failover armed. Replica lag triggers alerts at 2.5s.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-medium">Security posture</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-white/70">
                Encrypted at rest. Row-level access enforced on sensitive
                tables.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-medium">Performance budget</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-white/70">
                P95 latency target 120ms. Current error rate 0.2%.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Database protections</h3>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  Verify backups, audits, and emergency access paths.
                </p>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/10">
                <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Backups
                </p>
                <p className="mt-2 text-sm font-semibold">Verified</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/10">
                <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Access Keys
                </p>
                <p className="mt-2 text-sm font-semibold">Rotated 5d</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/10">
                <p className="uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Audit Trail
                </p>
                <p className="mt-2 text-sm font-semibold">Enabled</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Initiate point-in-time restore",
                    description:
                      "This will restore the database to a previous snapshot.",
                    tone: "danger",
                    onConfirm: handlePointInTimeRestore,
                  })
                }
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-100 dark:border-rose-200/40 dark:bg-rose-200/10 dark:text-rose-200 dark:hover:bg-rose-200/20"
              >
                Point-in-time restore
              </button>
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Rollback last migration",
                    description:
                      "This will rollback the most recent migration step.",
                    tone: "danger",
                    onConfirm: handleRollback,
                  })
                }
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Rollback migration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
