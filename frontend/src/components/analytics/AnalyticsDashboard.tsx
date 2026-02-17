"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LineChart,
  Line,
  Cell,
} from "recharts";
import type {
  AnalyticsSummary,
  ConceptPerformance,
  WeaknessCluster,
} from "@/types/analytics";

interface AnalyticsDashboardProps {
  data: AnalyticsSummary;
}

type TabKey = "overview" | "concepts" | "weaknesses" | "timeline";

const COLORS = {
  primary: "#6366f1", // Indigo
  success: "#22c55e", // Green
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Red
  muted: "#94a3b8", // Slate
  improving: "#22c55e",
  declining: "#ef4444",
  stable: "#f59e0b",
};

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return COLORS.success;
  if (accuracy >= 60) return COLORS.warning;
  return COLORS.danger;
}

function getTrendIcon(trend: "improving" | "declining" | "stable"): string {
  switch (trend) {
    case "improving":
      return "↑";
    case "declining":
      return "↓";
    case "stable":
      return "→";
  }
}

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const subjects = useMemo(() => {
    const uniqueSubjects = [
      ...new Set(data.conceptPerformances.map((cp) => cp.tag.subject)),
    ];
    return ["all", ...uniqueSubjects];
  }, [data.conceptPerformances]);

  const filteredPerformances = useMemo(() => {
    if (selectedSubject === "all") return data.conceptPerformances;
    return data.conceptPerformances.filter(
      (cp) => cp.tag.subject === selectedSubject
    );
  }, [data.conceptPerformances, selectedSubject]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 dark:bg-gray-950 dark:text-white">
      {/* Header Stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Analytics Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-gray-500">
          Track your preparation progress with concept-level insights
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Overall Accuracy"
          value={`${data.overallAccuracy}%`}
          color={getAccuracyColor(data.overallAccuracy)}
        />
        <StatCard
          label="Problems Solved"
          value={data.totalProblemsSolved.toLocaleString()}
          color={COLORS.primary}
        />
        <StatCard
          label="Current Streak"
          value={`${data.currentStreak} 🔥`}
          color={COLORS.warning}
        />
        <StatCard
          label="This Week"
          value={data.weeklyProblemsSolved.toString()}
          color={COLORS.success}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(
          [
            { key: "overview", label: "📊 Overview" },
            { key: "concepts", label: "🧠 Concept Tags" },
            { key: "weaknesses", label: "🎯 Weaknesses" },
            { key: "timeline", label: "📈 Timeline" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subject Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => setSelectedSubject(subject)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedSubject === subject
                ? "bg-indigo-500/20 text-indigo-600 border border-indigo-500 dark:bg-indigo-500/30 dark:text-indigo-300"
                : "bg-white text-slate-500 hover:text-slate-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            {subject === "all" ? "All Subjects" : subject}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab data={data} performances={filteredPerformances} />
      )}
      {activeTab === "concepts" && (
        <ConceptTagsTab performances={filteredPerformances} />
      )}
      {activeTab === "weaknesses" && (
        <WeaknessesTab weaknesses={data.weaknessClusters} />
      )}
      {activeTab === "timeline" && <TimelineTab data={data} />}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 dark:bg-gray-900 dark:border-gray-800">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 dark:text-gray-500">
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({
  data,
  performances,
}: {
  data: AnalyticsSummary;
  performances: ConceptPerformance[];
}) {
  const radarData = performances
    .sort((a, b) => b.totalAttempts - a.totalAttempts)
    .slice(0, 8)
    .map((p) => ({
      concept: p.tag.name,
      accuracy: p.accuracy,
      fullMark: 100,
    }));

  const activityData = data.dailyActivity.slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    }),
    problems: d.problemsSolved,
    accuracy: d.accuracy,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radar: Concept Mastery */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-gray-200">
          🧠 Concept Mastery Radar
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="concept"
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <Radar
              name="Accuracy %"
              dataKey="accuracy"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.3}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Line: Daily Activity */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-gray-200">
          📈 14-Day Activity
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                color: "#334155",
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="problems"
              stroke={COLORS.primary}
              strokeWidth={2}
              dot={{ fill: COLORS.primary, r: 3 }}
              name="Problems"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="accuracy"
              stroke={COLORS.success}
              strokeWidth={2}
              dot={{ fill: COLORS.success, r: 3 }}
              name="Accuracy %"
            />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Concept Tags Tab ───────────────────────────────────────────────────────

function ConceptTagsTab({
  performances,
}: {
  performances: ConceptPerformance[];
}) {
  const chartData = performances
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((p) => ({
      name: p.tag.name,
      accuracy: p.accuracy,
      attempts: p.totalAttempts,
      avgTime: p.averageTimeSeconds,
      trend: p.trend,
    }));

  return (
    <div className="space-y-6">
      {/* Horizontal Bar Chart: Accuracy by Concept */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-gray-200">
          📊 Accuracy by Concept Tag
        </h3>
        <ResponsiveContainer
          width="100%"
          height={Math.max(300, chartData.length * 40)}
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#334155", fontSize: 12 }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                color: "#334155",
              }}
              formatter={(value: any, name?: string) => {
                if (name === "accuracy") return [`${value ?? 0}%`, "Accuracy"];
                return [value ?? 0, name ?? ""];
              }}
            />
            <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getAccuracyColor(entry.accuracy)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-800">
              <th className="text-left p-4 text-slate-500 font-medium dark:text-gray-400">
                Concept
              </th>
              <th className="text-center p-4 text-slate-500 font-medium dark:text-gray-400">
                Accuracy
              </th>
              <th className="text-center p-4 text-slate-500 font-medium dark:text-gray-400">
                Attempts
              </th>
              <th className="text-center p-4 text-slate-500 font-medium dark:text-gray-400">
                Avg Time
              </th>
              <th className="text-center p-4 text-slate-500 font-medium dark:text-gray-400">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {performances
              .sort((a, b) => a.accuracy - b.accuracy)
              .map((p) => (
                <tr
                  key={p.tag.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors dark:border-gray-800/50 dark:hover:bg-gray-800/30"
                >
                  <td className="p-4">
                    <span className="font-medium text-slate-800 dark:text-gray-200">
                      {p.tag.name}
                    </span>
                    <span className="block text-xs text-slate-400 dark:text-gray-500">
                      {p.tag.subject}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className="font-bold"
                      style={{ color: getAccuracyColor(p.accuracy) }}
                    >
                      {p.accuracy}%
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-600 dark:text-gray-300">
                    {p.totalAttempts}
                  </td>
                  <td className="p-4 text-center text-slate-600 dark:text-gray-300">
                    {p.averageTimeSeconds}s
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className="inline-flex items-center gap-1 text-sm font-medium"
                      style={{ color: COLORS[p.trend] }}
                    >
                      {getTrendIcon(p.trend)} {p.trend}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Weaknesses Tab ─────────────────────────────────────────────────────────

function WeaknessesTab({ weaknesses }: { weaknesses: WeaknessCluster[] }) {
  if (weaknesses.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center dark:bg-gray-900 dark:border-gray-800">
        <p className="text-4xl mb-4">🎉</p>
        <p className="text-xl font-semibold text-slate-800 dark:text-gray-200">
          No major weaknesses detected!
        </p>
        <p className="text-slate-500 mt-2 dark:text-gray-500">
          Keep practicing to maintain your performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 dark:bg-yellow-500/10 dark:border-yellow-500/30">
        <p className="text-yellow-800 text-sm dark:text-yellow-300">
          🎯 <strong>Weakness Retargeting Active:</strong> These concepts will
          be prioritized in your Daily Mix. Illmora uses Spaced Repetition to
          resurface these questions at optimal intervals (1, 3, 7 days).
        </p>
      </div>

      {weaknesses.map((w, index) => (
        <div
          key={w.conceptTag.id}
          className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 dark:bg-gray-900 dark:border-gray-800"
        >
          {/* Priority Badge */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{
              backgroundColor:
                w.priority > 0.7
                  ? "rgba(239, 68, 68, 0.1)"
                  : w.priority > 0.4
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(34, 197, 94, 0.1)",
              color:
                w.priority > 0.7
                  ? COLORS.danger
                  : w.priority > 0.4
                    ? COLORS.warning
                    : COLORS.success,
            }}
          >
            #{index + 1}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 dark:text-gray-200">
              {w.conceptTag.name}
            </h4>
            <p className="text-xs text-slate-400 dark:text-gray-500">
              {w.conceptTag.subject}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center flex-shrink-0">
            <div>
              <p className="text-lg font-bold text-red-500 dark:text-red-400">
                {w.errorCount}
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-500">
                Errors
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-500 dark:text-amber-400">
                {w.recentErrorRate}%
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-500">
                Error Rate
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-indigo-500 dark:text-indigo-400">
                {w.suggestedQuestionIds.length}
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-500">
                To Review
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline Tab ───────────────────────────────────────────────────────────

function TimelineTab({ data }: { data: AnalyticsSummary }) {
  const sessionData = data.recentSessions.slice(0, 10).map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    }),
    correct: s.correctAnswers,
    incorrect: s.incorrectAnswers,
    avgTime: s.averageTimeSeconds,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-gray-200">
        📅 Session History
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={sessionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              color: "#334155",
            }}
          />
          <Bar
            dataKey="correct"
            stackId="a"
            fill={COLORS.success}
            name="Correct"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="incorrect"
            stackId="a"
            fill={COLORS.danger}
            name="Incorrect"
            radius={[4, 4, 0, 0]}
          />
          <Legend />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
