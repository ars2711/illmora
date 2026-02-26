import type { Metadata } from "next";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import type { AnalyticsSummary } from "@/types/analytics";

export const metadata: Metadata = {
  title: "Analytics Dashboard | Illmora",
  description:
    "Track your NUST NET preparation progress with concept-level analytics and weakness retargeting.",
};

async function getAnalyticsData(userId: string): Promise<AnalyticsSummary> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(`${apiUrl}/api/v1/analytics/${userId}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  } catch {
    return getMockAnalyticsData();
  }
}

export default async function AnalyticsPage() {
  const userId = "current-user";
  const data = await getAnalyticsData(userId);

  return <AnalyticsDashboard data={data} />;
}

function getMockAnalyticsData(): AnalyticsSummary {
  return {
    userId: "mock-user",
    role: "pre-engineering",
    overallAccuracy: 72,
    totalProblemsSolved: 847,
    currentStreak: 12,
    longestStreak: 23,
    weeklyProblemsSolved: 94,
    conceptPerformances: [
      {
        tag: { id: "1", name: "Integration", subject: "Mathematics" },
        totalAttempts: 45,
        correctAttempts: 28,
        accuracy: 62,
        averageTimeSeconds: 85,
        trend: "improving",
        lastAttempted: new Date().toISOString(),
      },
      {
        tag: { id: "2", name: "Vectors", subject: "Mathematics" },
        totalAttempts: 30,
        correctAttempts: 24,
        accuracy: 80,
        averageTimeSeconds: 60,
        trend: "stable",
        lastAttempted: new Date().toISOString(),
      },
      {
        tag: { id: "3", name: "Thermodynamics", subject: "Physics" },
        totalAttempts: 38,
        correctAttempts: 18,
        accuracy: 47,
        averageTimeSeconds: 95,
        trend: "declining",
        lastAttempted: new Date().toISOString(),
      },
      {
        tag: { id: "4", name: "Organic Chemistry", subject: "Chemistry" },
        totalAttempts: 52,
        correctAttempts: 40,
        accuracy: 77,
        averageTimeSeconds: 70,
        trend: "improving",
        lastAttempted: new Date().toISOString(),
      },
      {
        tag: { id: "5", name: "Electromagnetism", subject: "Physics" },
        totalAttempts: 25,
        correctAttempts: 12,
        accuracy: 48,
        averageTimeSeconds: 110,
        trend: "declining",
        lastAttempted: new Date().toISOString(),
      },
      {
        tag: { id: "6", name: "Matrices", subject: "Mathematics" },
        totalAttempts: 20,
        correctAttempts: 17,
        accuracy: 85,
        averageTimeSeconds: 55,
        trend: "stable",
        lastAttempted: new Date().toISOString(),
      },
      {
        tag: { id: "7", name: "Kinematics", subject: "Physics" },
        totalAttempts: 35,
        correctAttempts: 28,
        accuracy: 80,
        averageTimeSeconds: 65,
        trend: "improving",
        lastAttempted: new Date().toISOString(),
      },
      {
        tag: { id: "8", name: "Stoichiometry", subject: "Chemistry" },
        totalAttempts: 28,
        correctAttempts: 20,
        accuracy: 71,
        averageTimeSeconds: 75,
        trend: "stable",
        lastAttempted: new Date().toISOString(),
      },
    ],
    weaknessClusters: [
      {
        conceptTag: { id: "3", name: "Thermodynamics", subject: "Physics" },
        errorCount: 20,
        recentErrorRate: 53,
        priority: 0.9,
        suggestedQuestionIds: ["q101", "q102", "q103", "q104"],
      },
      {
        conceptTag: {
          id: "5",
          name: "Electromagnetism",
          subject: "Physics",
        },
        errorCount: 13,
        recentErrorRate: 52,
        priority: 0.85,
        suggestedQuestionIds: ["q201", "q202", "q203"],
      },
      {
        conceptTag: {
          id: "1",
          name: "Integration",
          subject: "Mathematics",
        },
        errorCount: 17,
        recentErrorRate: 38,
        priority: 0.55,
        suggestedQuestionIds: ["q301", "q302"],
      },
    ],
    recentSessions: Array.from({ length: 8 }, (_, i) => ({
      sessionId: `s-${i}`,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      totalQuestions: 20 + Math.floor(Math.random() * 15),
      correctAnswers: 12 + Math.floor(Math.random() * 10),
      incorrectAnswers: 5 + Math.floor(Math.random() * 8),
      averageTimeSeconds: 60 + Math.floor(Math.random() * 40),
      conceptBreakdown: [],
    })),
    dailyActivity: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
      problemsSolved: 10 + Math.floor(Math.random() * 25),
      accuracy: 55 + Math.floor(Math.random() * 35),
    })),
  };
}
