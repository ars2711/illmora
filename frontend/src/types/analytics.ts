export interface ConceptTag {
  id: string;
  name: string; // e.g., "Integration", "Vectors", "Organic Chemistry"
  subject: string; // e.g., "Mathematics", "Physics", "Chemistry"
  chapter?: string;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  userId: string;
  conceptTags: ConceptTag[];
  isCorrect: boolean;
  timeTakenSeconds: number;
  sessionId: string;
  attemptedAt: string; // ISO date string
  difficulty: "easy" | "medium" | "hard";
}

export interface SessionSummary {
  sessionId: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageTimeSeconds: number;
  conceptBreakdown: ConceptPerformance[];
}

export interface ConceptPerformance {
  tag: ConceptTag;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number; // 0–100
  averageTimeSeconds: number;
  trend: "improving" | "declining" | "stable";
  lastAttempted: string;
}

export interface WeaknessCluster {
  conceptTag: ConceptTag;
  errorCount: number;
  recentErrorRate: number; // Error rate in last 3 sessions
  priority: number; // 0–1, higher = more urgent
  suggestedQuestionIds: string[];
}

export interface AnalyticsSummary {
  userId: string;
  role: "pre-engineering" | "ics" | "business";
  overallAccuracy: number;
  totalProblemsSolved: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProblemsSolved: number;
  conceptPerformances: ConceptPerformance[];
  weaknessClusters: WeaknessCluster[];
  recentSessions: SessionSummary[];
  dailyActivity: { date: string; problemsSolved: number; accuracy: number }[];
}
