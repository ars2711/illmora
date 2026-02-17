"use client";

import React from "react";
import type { UserStreak } from "@/types/gamification";

interface StreakBadgeProps {
  streak: UserStreak;
  compact?: boolean;
}

export default function StreakBadge({
  streak,
  compact = false,
}: StreakBadgeProps) {
  const fireIntensity =
    streak.currentStreak >= 30
      ? "🔥🔥🔥"
      : streak.currentStreak >= 7
        ? "🔥🔥"
        : streak.currentStreak >= 1
          ? "🔥"
          : "❄️";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 rounded-full px-3 py-1 dark:bg-amber-500/10 dark:border-amber-500/30">
        <span className="text-sm">{fireIntensity}</span>
        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
          {streak.currentStreak}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-center dark:from-amber-500/10 dark:to-orange-500/10 dark:border-amber-500/30">
      <p className="text-3xl mb-1">{fireIntensity}</p>
      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
        {streak.currentStreak} Day Streak
      </p>
      <p className="text-xs text-slate-500 mt-1 dark:text-gray-500">
        Longest: {streak.longestStreak} days
      </p>
      {streak.streakFreezeAvailable && (
        <p className="text-xs text-blue-500 mt-2 dark:text-blue-400">
          🧊 Streak Freeze Available
        </p>
      )}
    </div>
  );
}
