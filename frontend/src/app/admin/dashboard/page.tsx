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

  if (loading) return <div className="p-8">Loading System Admin...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Ilmora Global Command Center
        </h1>
        <p className="text-gray-500">System Status & Multitenant Oversight</p>
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
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Priority Review Queue
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {feedback.length === 0 ? (
              <li className="p-6 text-center text-gray-500">
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
                      <p className="text-sm font-medium text-gray-900">
                        Context:{" "}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          {item.feature}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 truncate mb-1">
                        by {item.user_email}
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {item.content}
                      </p>
                    </div>
                    <div>
                      <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
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
        <div className="bg-white rounded-lg shadow h-fit">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              System Actions
            </h3>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300">
              + Provision New Institution
            </button>
            <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300">
              Manage Curricula
            </button>
            <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300">
              View Server Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: any) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">{icon}</div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">
                  {value ?? "-"}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {sub && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className="text-gray-500">{sub}</span>
          </div>
        </div>
      )}
    </div>
  );
}
