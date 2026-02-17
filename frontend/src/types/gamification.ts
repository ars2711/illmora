export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  streakFreezeAvailable: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  problemsSolvedThisWeek: number;
  accuracy: number;
  streak: number;
  role: "pre-engineering" | "ics" | "business";
}

export interface PeerChallengeResult {
  challengeId: string;
  challengerScore: number;
  opponentScore: number;
  topic: string;
  streakPointsBet: number;
  winnerId: string;
}
