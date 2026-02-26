import React, { useState, useEffect } from "react";
import { Timer, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

interface ExamSimulatorProps {
  durationMinutes: number;
  onTimeUp?: () => void;
  isActive: boolean;
}

export function ExamSimulator({
  durationMinutes,
  onTimeUp,
  isActive,
}: ExamSimulatorProps) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [stressMode, setStressMode] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }

        // Stress Simulation: Random visual glitches or pressure messages
        if (stressMode && Math.random() < 0.05) {
          // Mock stress event (could trigger a toast or shake effecT)
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp, stressMode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = (timeLeft / (durationMinutes * 60)) * 100;
  const isUrgent = timeLeft < 300; // Last 5 mins

  if (!isActive) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${isUrgent ? "bg-red-50/90 border-red-200 animate-pulse" : "bg-white/80 border-slate-200 dark:bg-slate-900/80 dark:border-white/10"}`}
    >
      <div className="flex items-center gap-4 mb-2">
        <div
          className={`p-2 rounded-lg ${isUrgent ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white"}`}
        >
          <Timer className={isUrgent ? "animate-spin" : ""} size={20} />
        </div>
        <div>
          <div
            className={`text-2xl font-mono font-bold ${isUrgent ? "text-red-600" : "text-slate-900 dark:text-white"}`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Time Remaining
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden dark:bg-white/10 mb-3">
        <div
          className={`h-full transition-all duration-1000 ${isUrgent ? "bg-red-500" : "bg-indigo-500"}`}
          // Use inline style for dynamic width
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={stressMode}
            onChange={(e) => setStressMode(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-slate-600 dark:text-slate-400">
            Stress Mode
          </span>
        </label>
        {stressMode && (
          <span className="text-[10px] text-amber-500 font-bold animate-pulse">
            ACTIVE
          </span>
        )}
      </div>
    </div>
  );
}
