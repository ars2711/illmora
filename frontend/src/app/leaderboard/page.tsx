import type { Metadata } from "next";
import Leaderboard from "@/components/gamification/Leaderboard";
import type { LeaderboardEntry } from "@/types/gamification";

export const metadata: Metadata = {
  title: "Weekly Leaderboard | Illmora",
  description: "See who solved the most NUST NET problems this week.",
};

// ISR: Revalidate leaderboard every 30 seconds for near-real-time updates
export const revalidate = 30;

async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(`${apiUrl}/api/v1/analytics/leaderboard/weekly`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
  } catch {
    return getMockLeaderboard();
  }
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboardData();
  const currentUserId = "current-user"; // Replace with auth session

  return <Leaderboard entries={entries} currentUserId={currentUserId} />;
}

function getMockLeaderboard(): LeaderboardEntry[] {
  const names = [
    "Ahmed Khan",
    "Fatima Ali",
    "Usman Raza",
    "Ayesha Malik",
    "Hassan Javed",
    "Maryam Noor",
    "Bilal Ahmed",
    "Sana Tariq",
    "Ali Haider",
    "Zainab Shah",
  ];

  return names.map((name, i) => ({
    rank: i + 1,
    userId: i === 2 ? "current-user" : `user-${i}`,
    displayName: name,
    problemsSolvedThisWeek:
      150 - i * 12 + Math.floor(Math.random() * 10),
    accuracy: 90 - i * 3 + Math.floor(Math.random() * 5),
    streak: 30 - i * 2,
    role: (["pre-engineering", "ics", "business"] as const)[i % 3],
  }));
}
