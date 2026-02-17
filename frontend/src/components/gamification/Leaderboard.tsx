"use client";

import React, { useState } from "react";
import type { LeaderboardEntry } from "@/types/gamification";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

type RoleFilter = "all" | "pre-engineering" | "ics" | "business";

export default function Leaderboard({
  entries,
  currentUserId,
}: LeaderboardProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filtered = entries.filter(
    (e) => roleFilter === "all" || e.role === roleFilter
  );

  const getRankBadge = (rank: number): string => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 dark:bg-gray-950 dark:text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🏆 Weekly Leaderboard</h1>
        <p className="text-slate-500 mb-6 dark:text-gray-500">
          Ranked by problems solved this week. Resets every Monday.
        </p>

        {/* Role Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(
            [
              { key: "all", label: "All" },
              { key: "pre-engineering", label: "Pre-Engineering" },
              { key: "ics", label: "ICS" },
              { key: "business", label: "Business" },
            ] as const
          ).map((role) => (
            <button
              key={role.key}
              onClick={() => setRoleFilter(role.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === role.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {filtered.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;

            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  isCurrentUser
                    ? "bg-indigo-50 border-2 border-indigo-300 dark:bg-indigo-600/10 dark:border-indigo-500/50"
                    : "bg-white border border-slate-200 hover:bg-slate-50 dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800/50"
                }`}
              >
                {/* Rank */}
                <div className="w-12 text-center text-lg font-bold flex-shrink-0">
                  {getRankBadge(entry.rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden dark:bg-gray-700">
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-500 dark:text-gray-400">
                      {entry.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate dark:text-gray-200">
                    {entry.displayName}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-400">
                        (You)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">
                    🔥 {entry.streak} day streak
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-center flex-shrink-0">
                  <div>
                    <p className="text-lg font-bold text-indigo-500 dark:text-indigo-400">
                      {entry.problemsSolvedThisWeek}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase dark:text-gray-500">
                      Solved
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-lg font-bold"
                      style={{
                        color:
                          entry.accuracy >= 80
                            ? "#22c55e"
                            : entry.accuracy >= 60
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    >
                      {entry.accuracy}%
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase dark:text-gray-500">
                      Accuracy
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
