"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  FileText,
  CheckCircle,
  School,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, strict RBAC check here
  // if (user?.role !== 'SYSTEM_ADMIN') router.push('/dashboard')

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch Stats
        const statsRes = await fetch(
          "http://localhost:8000/api/v1/admin/stats",
        );
        setStats(await statsRes.json());

        // Fetch Feedback
        const fbRes = await fetch(
          "http://localhost:8000/api/v1/admin/feedback/flagged",
        );
        setFeedback(await fbRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-slate-600 dark:bg-slate-950 dark:text-white/70">
        Loading System Admin...
      </div>
    );

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 p-6">
          <header className="mb-8">
        <h1 className="text-3xl font-semibold">
          Ilmora Global Command Center
        </h1>
        <p className="text-slate-500 dark:text-white/60">
          System Status & Multitenant Oversight
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.total_users}
          icon={<Users className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="Institutions"
          value={stats?.total_institutions}
          icon={<School className="w-6 h-6 text-purple-600" />}
        />
        <StatCard
          title="Total Interactions"
          value={stats?.total_interactions}
          sub="AI messages processed"
          icon={<FileText className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          title="Flagged Issues"
          value={stats?.flagged_feedback}
          sub="Requires attention"
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
        />
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed: Flagged Content */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
            <h3 className="text-lg font-medium">
              Priority Review Queue
            </h3>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {feedback.length === 0 ? (
              <li className="p-6 text-center text-slate-500 dark:text-white/60">
                No pending issues. System healthy.
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
                        Context:{" "}
                        <span className="rounded bg-slate-100 px-1 font-mono dark:bg-white/10">
                          {item.feature}
                        </span>
                      </p>
                      <p className="mb-1 truncate text-sm text-slate-500 dark:text-white/60">
                        by {item.user_email}
                      </p>
                      <p className="rounded bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/10 dark:text-white/80">
                        {item.content}
                      </p>
                    </div>
                    <div>
                      <button className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">
                        Resolve
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
            <h3 className="text-lg font-medium">
              System Actions
            </h3>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <button className="w-full rounded-md border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10">
              + Provision New Institution
            </button>
            <button className="w-full rounded-md border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10">
              Manage Curricula
            </button>
            <button className="w-full rounded-md border border-slate-200 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10">
              View Server Logs
            </button>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: any) {
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
