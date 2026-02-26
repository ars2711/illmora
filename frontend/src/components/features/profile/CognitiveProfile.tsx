import React from "react";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";

interface CognitiveProfileProps {
  data?: {
    patterns: string[];
    logicStrength: number;
    abstractionCapability: number;
    computationalAccuracy: number;
    confidenceBias: "overconfident" | "underconfident" | "balanced";
    disciplineScore: number;
  };
}

// Mock data if none provided (for demo/prototype)
const defaultData = {
  patterns: [
    "Skipping intermediate algebraic steps",
    "Rushed reading of problem statements",
  ],
  logicStrength: 0.72,
  abstractionCapability: 0.85,
  computationalAccuracy: 0.64,
  confidenceBias: "overconfident" as const,
  disciplineScore: 68,
};

export function CognitiveProfile({
  data = defaultData,
}: CognitiveProfileProps) {
  const getBiasColor = (bias: string) => {
    switch (bias) {
      case "overconfident":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "underconfident":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "balanced":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Main Score Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Cognitive Profile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI-analyzed thinking patterns
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.disciplineScore}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Discipline Score
            </div>
          </div>
        </div>

        {/* Radar / Bars */}
        <div className="space-y-4 pt-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-300">
                Logic Strength
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.round(data.logicStrength * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, data.logicStrength * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-300">
                Abstraction Capability
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.round(data.abstractionCapability * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-pink-500 transition-all duration-500"
                style={{ width: `${Math.min(100, data.abstractionCapability * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-300">
                Computational Accuracy
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.round(data.computationalAccuracy * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, data.computationalAccuracy * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Patterns & Alerts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-amber-500" size={18} />
          <h4 className="font-semibold text-slate-900 dark:text-white">
            Recurring Patterns
          </h4>
        </div>
        <ul className="space-y-3 flex-1">
          {data.patterns.map((pattern, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-100 dark:border-white/5"
            >
              <span className="mt-0.5">•</span>
              <span>{pattern}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Insights */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-yellow-500" size={18} />
          <h4 className="font-semibold text-slate-900 dark:text-white">
            Cognitive Bias
          </h4>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div
            className={`px-4 py-2 rounded-full border text-sm font-semibold uppercase tracking-wider mb-2 ${getBiasColor(data.confidenceBias)}`}
          >
            {data.confidenceBias}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {data.confidenceBias === "overconfident" &&
              "You tend to answer quickly but miss subtle details. Slow down."}
            {data.confidenceBias === "underconfident" &&
              "Your reasoning is sound, but you hesitate. Trust your logic."}
            {data.confidenceBias === "balanced" &&
              "Great balance between speed and verification."}
          </p>
        </div>
      </div>
    </div>
  );
}
