import type {
  QuestionAttempt,
  ConceptPerformance,
  WeaknessCluster,
  ConceptTag,
  SessionSummary,
} from "@/types/analytics";

/**
 * Groups question attempts by concept tag and calculates per-concept accuracy,
 * trend, and time performance. This is Illmora's core differentiator vs Parhlai:
 * we don't just show a graph — we cluster mistakes by concept.
 */
export function aggregateByConceptTag(
  attempts: QuestionAttempt[]
): ConceptPerformance[] {
  const tagMap = new Map<
    string,
    {
      tag: ConceptTag;
      correct: number;
      total: number;
      totalTime: number;
      dates: string[];
    }
  >();

  for (const attempt of attempts) {
    for (const tag of attempt.conceptTags) {
      const existing = tagMap.get(tag.id) ?? {
        tag,
        correct: 0,
        total: 0,
        totalTime: 0,
        dates: [],
      };

      existing.total += 1;
      if (attempt.isCorrect) existing.correct += 1;
      existing.totalTime += attempt.timeTakenSeconds;
      existing.dates.push(attempt.attemptedAt);

      tagMap.set(tag.id, existing);
    }
  }

  return Array.from(tagMap.values()).map((entry) => {
    const accuracy =
      entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;

    return {
      tag: entry.tag,
      totalAttempts: entry.total,
      correctAttempts: entry.correct,
      accuracy,
      averageTimeSeconds:
        entry.total > 0 ? Math.round(entry.totalTime / entry.total) : 0,
      trend: calculateTrend(attempts, entry.tag.id),
      lastAttempted: entry.dates.sort().reverse()[0] ?? "",
    };
  });
}

/**
 * Determines if user performance on a concept is improving, declining, or stable
 * by comparing first-half vs second-half accuracy of attempts.
 */
function calculateTrend(
  attempts: QuestionAttempt[],
  tagId: string
): "improving" | "declining" | "stable" {
  const tagAttempts = attempts
    .filter((a) => a.conceptTags.some((t) => t.id === tagId))
    .sort(
      (a, b) =>
        new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime()
    );

  if (tagAttempts.length < 4) return "stable";

  const mid = Math.floor(tagAttempts.length / 2);
  const firstHalf = tagAttempts.slice(0, mid);
  const secondHalf = tagAttempts.slice(mid);

  const firstAccuracy =
    firstHalf.filter((a) => a.isCorrect).length / firstHalf.length;
  const secondAccuracy =
    secondHalf.filter((a) => a.isCorrect).length / secondHalf.length;

  const diff = secondAccuracy - firstAccuracy;
  if (diff > 0.1) return "improving";
  if (diff < -0.1) return "declining";
  return "stable";
}

/**
 * Identifies the user's weakest concepts and clusters them for targeted review.
 * This powers the "Weakness Retargeting" feature — Illmora's SRS advantage.
 */
export function identifyWeaknesses(
  attempts: QuestionAttempt[],
  recentSessionCount = 3
): WeaknessCluster[] {
  // Get the most recent N session IDs
  const sessionIds = [
    ...new Set(
      attempts
        .sort(
          (a, b) =>
            new Date(b.attemptedAt).getTime() -
            new Date(a.attemptedAt).getTime()
        )
        .map((a) => a.sessionId)
    ),
  ].slice(0, recentSessionCount);

  const recentAttempts = attempts.filter((a) =>
    sessionIds.includes(a.sessionId)
  );
  const performances = aggregateByConceptTag(recentAttempts);

  return performances
    .filter((p) => p.accuracy < 70) // Below 70% = weakness
    .map((p) => {
      const errorRate =
        p.totalAttempts > 0
          ? (p.totalAttempts - p.correctAttempts) / p.totalAttempts
          : 0;

      // Priority formula: higher error rate + declining trend = higher priority
      const trendMultiplier =
        p.trend === "declining" ? 1.5 : p.trend === "stable" ? 1.0 : 0.7;
      const priority = Math.min(1, errorRate * trendMultiplier);

      // Gather question IDs the user got wrong for this concept
      const wrongQuestionIds = recentAttempts
        .filter(
          (a) => !a.isCorrect && a.conceptTags.some((t) => t.id === p.tag.id)
        )
        .map((a) => a.questionId);

      return {
        conceptTag: p.tag,
        errorCount: p.totalAttempts - p.correctAttempts,
        recentErrorRate: Math.round(errorRate * 100),
        priority,
        suggestedQuestionIds: [...new Set(wrongQuestionIds)],
      };
    })
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Generates session-level summaries for the analytics timeline.
 */
export function buildSessionSummaries(
  attempts: QuestionAttempt[]
): SessionSummary[] {
  const sessionMap = new Map<string, QuestionAttempt[]>();

  for (const attempt of attempts) {
    const existing = sessionMap.get(attempt.sessionId) ?? [];
    existing.push(attempt);
    sessionMap.set(attempt.sessionId, existing);
  }

  return Array.from(sessionMap.entries())
    .map(([sessionId, sessionAttempts]) => {
      const correct = sessionAttempts.filter((a) => a.isCorrect).length;
      const totalTime = sessionAttempts.reduce(
        (sum, a) => sum + a.timeTakenSeconds,
        0
      );

      return {
        sessionId,
        date: sessionAttempts[0]?.attemptedAt ?? "",
        totalQuestions: sessionAttempts.length,
        correctAnswers: correct,
        incorrectAnswers: sessionAttempts.length - correct,
        averageTimeSeconds:
          sessionAttempts.length > 0
            ? Math.round(totalTime / sessionAttempts.length)
            : 0,
        conceptBreakdown: aggregateByConceptTag(sessionAttempts),
      };
    })
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}
