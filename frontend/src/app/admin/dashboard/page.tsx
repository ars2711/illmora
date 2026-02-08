"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminGet } from "@/lib/admin-api";
import {
  AlertCircle,
  FileText,
  CheckCircle,
  School,
  Users,
  Database,
  ShieldCheck,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Stats {
  total_users: number;
  total_institutions: number;
  total_interactions: number;
  active_curricula: number;
  flagged_feedback: number;
}

interface FeedbackItem {
  id: string;
  feature: string;
  sentiment: string;
  content: string;
  created_at: string;
  user_email: string;
}

export default function AdminDashboard() {
  const { user, demoMode, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminSearchTarget, setAdminSearchTarget] = useState("incidents");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminSearchCounts, setAdminSearchCounts] = useState<{
    incidents: number;
    audit: number;
    roles: number;
  } | null>(demoMode ? { incidents: 3, audit: 12, roles: 4 } : null);
  const t = useTranslations("adminDashboard");

  const databaseOverview = [
    {
      label: t("databaseOverview.primary"),
      value: t("databaseOverview.healthy"),
      tone: "text-emerald-500",
    },
    {
      label: t("databaseOverview.replicaLag"),
      value: "1.8s",
      tone: "text-amber-500",
    },
    {
      label: t("databaseOverview.storage"),
      value: "62%",
      tone: "text-slate-600",
    },
    {
      label: t("databaseOverview.latency"),
      value: "92ms",
      tone: "text-slate-600",
    },
  ];

  const databaseActivity = [
    {
      id: "db-1",
      query: "SELECT * FROM memory_nodes WHERE updated_at > ...",
      time: t("databaseActivity.times.one"),
      status: t("databaseActivity.status.ok"),
    },
    {
      id: "db-2",
      query: "INSERT INTO study_sessions (user_id, duration) VALUES ...",
      time: t("databaseActivity.times.two"),
      status: t("databaseActivity.status.ok"),
    },
    {
      id: "db-3",
      query: "VACUUM ANALYZE knowledge_edges",
      time: t("databaseActivity.times.three"),
      status: t("databaseActivity.status.running"),
    },
  ];

  const kpiCards = [
    {
      title: t("kpis.openIncidents.title"),
      value: demoMode ? 3 : 0,
      delta: t("kpis.openIncidents.delta"),
      icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
    },
    {
      title: t("kpis.auditEvents.title"),
      value: demoMode ? 128 : 0,
      delta: t("kpis.auditEvents.delta"),
      icon: <FileText className="w-6 h-6 text-slate-600" />,
    },
    {
      title: t("kpis.accessRequests.title"),
      value: demoMode ? 5 : 0,
      delta: t("kpis.accessRequests.delta"),
      icon: <Users className="w-6 h-6 text-slate-600" />,
    },
    {
      title: t("kpis.dbJobs.title"),
      value: demoMode ? 4 : 0,
      delta: t("kpis.dbJobs.delta"),
      icon: <Database className="w-6 h-6 text-slate-600" />,
    },
  ];

  const handleAdminSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = adminSearchQuery.trim();
    if (!query) return;
    const targetMap: Record<string, string> = {
      incidents: "/admin/incidents",
      audit: "/admin/audit",
      roles: "/admin/roles",
    };
    const destination = targetMap[adminSearchTarget] ?? "/admin/incidents";
    router.push(`${destination}?q=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    if (demoMode) {
      setAdminSearchCounts({ incidents: 3, audit: 12, roles: 4 });
      return;
    }
    const query = adminSearchQuery.trim();
    if (!query) {
      setAdminSearchCounts(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await adminGet<{
          incidents: number;
          audit: number;
          roles: number;
        }>(`/api/v1/admin/search/counts?q=${encodeURIComponent(query)}`, token);
        setAdminSearchCounts(data);
      } catch (error) {
        console.error(error);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [adminSearchQuery, demoMode, token]);

  // In a real app, strict RBAC check here
  // if (user?.role !== 'SYSTEM_ADMIN') router.push('/dashboard')

  useEffect(() => {
    async function loadData() {
      if (demoMode) {
        setStats({
          total_users: 1842,
          total_institutions: 12,
          total_interactions: 58214,
          active_curricula: 43,
          flagged_feedback: 3,
        });
        setFeedback([
          {
            id: "demo-1",
            feature: "Graph Recall",
            sentiment: "bug",
            content:
              "Learner nodes are not clustering after the last ingest run.",
            created_at: new Date().toISOString(),
            user_email: "mentor@atlas.edu",
          },
          {
            id: "demo-2",
            feature: "Studio Sessions",
            sentiment: "review",
            content:
              "Session pacing feels fast for novice learners. Need a slow mode.",
            created_at: new Date().toISOString(),
            user_email: "admin@northbay.edu",
          },
        ]);
        setLoading(false);
        return;
      }
      try {
        const statsData = await adminGet<Stats>("/api/v1/admin/stats", token);
        setStats(statsData);

        const feedbackData = await adminGet<FeedbackItem[]>(
          "/api/v1/admin/feedback/flagged",
          token,
        );
        setFeedback(feedbackData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [demoMode, token]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-slate-600 dark:bg-slate-950 dark:text-white/70">
        {t("loading")}
      </div>
    );

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-slate-500 dark:text-white/60">{t("subtitle")}</p>
          </header>

          <div className="mb-8 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <form
              onSubmit={handleAdminSearch}
              className="flex flex-col gap-3 lg:flex-row lg:items-center"
            >
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  {t("search.title")}
                </p>
                <input
                  value={adminSearchQuery}
                  onChange={(event) => setAdminSearchQuery(event.target.value)}
                  placeholder={t("search.placeholder")}
                  className="mt-2 w-full rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                {adminSearchCounts && (
                  <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    {t("search.counts", {
                      incidents: adminSearchCounts.incidents,
                      audit: adminSearchCounts.audit,
                      roles: adminSearchCounts.roles,
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={adminSearchTarget}
                  onChange={(event) => setAdminSearchTarget(event.target.value)}
                  aria-label={t("search.targetLabel")}
                  className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                >
                  <option value="incidents">
                    {t("search.targets.incidents")}
                  </option>
                  <option value="audit">{t("search.targets.audit")}</option>
                  <option value="roles">{t("search.targets.roles")}</option>
                </select>
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {t("search.submit")}
                </button>
              </div>
            </form>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title={t("stats.totalUsers.title")}
              value={stats?.total_users}
              icon={<Users className="w-6 h-6 text-blue-600" />}
              delta={t("stats.totalUsers.delta")}
            />
            <StatCard
              title={t("stats.institutions.title")}
              value={stats?.total_institutions}
              icon={<School className="w-6 h-6 text-purple-600" />}
              delta={t("stats.institutions.delta")}
            />
            <StatCard
              title={t("stats.interactions.title")}
              value={stats?.total_interactions}
              sub={t("stats.interactions.sub")}
              icon={<FileText className="w-6 h-6 text-green-600" />}
              delta={t("stats.interactions.delta")}
            />
            <StatCard
              title={t("stats.flagged.title")}
              value={stats?.flagged_feedback}
              sub={t("stats.flagged.sub")}
              icon={<AlertCircle className="w-6 h-6 text-red-600" />}
              delta={t("stats.flagged.delta")}
            />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                delta={card.delta}
              />
            ))}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/database"
              className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-slate-600 dark:text-white/70" />
                <div>
                  <p className="text-sm font-medium">
                    {t("quickLinks.databaseTitle")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {t("quickLinks.database")}
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/audit"
              className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-600 dark:text-white/70" />
                <div>
                  <p className="text-sm font-medium">
                    {t("quickLinks.auditTitle")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {t("quickLinks.audit")}
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/incidents"
              className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <AlertCircleIcon className="h-5 w-5 text-slate-600 dark:text-white/70" />
                <div>
                  <p className="text-sm font-medium">
                    {t("quickLinks.incidentTitle")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {t("quickLinks.incidents")}
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/roles"
              className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-600 dark:text-white/70" />
                <div>
                  <p className="text-sm font-medium">
                    {t("quickLinks.rolesTitle")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {t("quickLinks.roles")}
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/health"
              className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-white/70" />
                <div>
                  <p className="text-sm font-medium">
                    {t("quickLinks.healthTitle")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {t("quickLinks.health")}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Feed: Flagged Content */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">{t("priority.title")}</h3>
              </div>
              <ul className="divide-y divide-slate-200 dark:divide-white/10">
                {feedback.length === 0 ? (
                  <li className="p-6 text-center text-slate-500 dark:text-white/60">
                    {t("priority.empty")}
                  </li>
                ) : (
                  feedback.map((item) => (
                    <li key={item.id} className="p-6">
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 `}>
                          {item.sentiment === "bug" ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {t("priority.context")}{" "}
                            <span className="rounded bg-slate-100 px-1 font-mono dark:bg-white/10">
                              {item.feature}
                            </span>
                          </p>
                          <p className="mb-1 truncate text-sm text-slate-500 dark:text-white/60">
                            {t("priority.by", { email: item.user_email })}
                          </p>
                          <p className="rounded bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/10 dark:text-white/80">
                            {item.content}
                          </p>
                        </div>
                        <div>
                          <button className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">
                            {t("priority.resolve")}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Quick Actions / Tenants */}
            <div className="h-fit rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">{t("actions.title")}</h3>
              </div>
              <div className="p-6 flex flex-col gap-3">
                <button className="w-full rounded-md border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10">
                  {t("actions.provision")}
                </button>
                <button className="w-full rounded-md border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10">
                  {t("actions.manageCurricula")}
                </button>
                <button className="w-full rounded-md border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10">
                  {t("actions.viewLogs")}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">
                  {t("databaseActivity.title")}
                </h3>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  {t("databaseActivity.subtitle")}
                </p>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {databaseActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-6">
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-mono text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                      {item.status}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.query}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {item.time}
                      </p>
                    </div>
                    <button className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">
                      {t("databaseActivity.inspect")}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">
                  {t("databaseHealth.title")}
                </h3>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  {t("databaseHealth.subtitle")}
                </p>
              </div>
              <div className="grid gap-4 p-6">
                {databaseOverview.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                  >
                    <span className="text-slate-600 dark:text-white/70">
                      {item.label}
                    </span>
                    <span className={`font-semibold ${item.tone}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <button className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                  {t("databaseHealth.cta")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, delta }: any) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">{icon}</div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-slate-500 dark:text-white/60">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">
                  {value ?? "-"}
                </div>
                {delta && (
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    {delta}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {sub && (
        <div className="bg-white/80 px-5 py-3 dark:bg-white/10">
          <div className="text-sm">
            <span className="text-slate-500 dark:text-white/60">{sub}</span>
          </div>
        </div>
      )}
    </div>
  );
}
