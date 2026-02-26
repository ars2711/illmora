import type { QuestionAttempt, WeaknessCluster } from "@/types/analytics";
import { identifyWeaknesses } from "@/lib/analyticsEngine";

export interface DailyMixConfig {
  totalQuestions: number; // Default: 20
  weaknessRatio: number; // 0–1, portion from weak concepts. Default: 0.6
  recentSessionCount: number; // How many sessions to look back. Default: 3
  spacedRepetitionDays: number[]; // Days after error to resurface. Default: [1, 3, 7]
}

export interface DailyMixQuestion {
  questionId: string;
  conceptTag: string;
  reason: "weakness_retarget" | "spaced_repetition" | "reinforcement" | "new";
  priority: number;
}

const DEFAULT_CONFIG: DailyMixConfig = {
  totalQuestions: 20,
  weaknessRatio: 0.6,
  recentSessionCount: 3,
  spacedRepetitionDays: [1, 3, 7],
};

/**
 * Generates a personalized "Daily Mix" of questions that prioritizes:
 * 1. Questions the user answered incorrectly in the last 3 sessions (weighted highest)
 * 2. Questions due for spaced repetition review (1, 3, 7 day intervals)
 * 3. Reinforcement of improving concepts
 * 4. New questions from untouched areas
 *
 * This is Illmora's core advantage over Parhlai — we don't just show analytics,
 * we _force_ the student to fix their weaknesses.
 */
export function generateDailyMix(
  attempts: QuestionAttempt[],
  allQuestionIds: string[],
  config: Partial<DailyMixConfig> = {},
): DailyMixQuestion[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const mix: DailyMixQuestion[] = [];
  const usedIds = new Set<string>();

  // ---------- Phase 1: Weakness Retargeting (highest priority) ----------
  const weaknesses = identifyWeaknesses(attempts, cfg.recentSessionCount);
  const weaknessSlots = Math.floor(cfg.totalQuestions * cfg.weaknessRatio);

  const weaknessQuestions = selectFromWeaknesses(
    weaknesses,
    weaknessSlots,
    usedIds,
  );
  mix.push(...weaknessQuestions);

  // ---------- Phase 2: Spaced Repetition ----------
  const srSlots = Math.floor((cfg.totalQuestions - mix.length) * 0.5);
  const srQuestions = selectSpacedRepetition(
    attempts,
    cfg.spacedRepetitionDays,
    srSlots,
    usedIds,
  );
  mix.push(...srQuestions);

  // ---------- Phase 3: Reinforcement (questions they got right but should review) ----------
  const reinforcementSlots = Math.floor(
    (cfg.totalQuestions - mix.length) * 0.5,
  );
  const reinforcementQuestions = selectReinforcement(
    attempts,
    reinforcementSlots,
    usedIds,
  );
  mix.push(...reinforcementQuestions);

  // ---------- Phase 4: Fill remaining with new questions ----------
  const remainingSlots = cfg.totalQuestions - mix.length;
  const newQuestions = selectNewQuestions(
    allQuestionIds,
    attempts,
    remainingSlots,
    usedIds,
  );
  mix.push(...newQuestions);

  return mix.slice(0, cfg.totalQuestions);
}

function selectFromWeaknesses(
  weaknesses: WeaknessCluster[],
  maxCount: number,
  usedIds: Set<string>,
): DailyMixQuestion[] {
  const result: DailyMixQuestion[] = [];

  for (const weakness of weaknesses) {
    if (result.length >= maxCount) break;

    for (const qId of weakness.suggestedQuestionIds) {
      if (result.length >= maxCount) break;
      if (usedIds.has(qId)) continue;

      usedIds.add(qId);
      result.push({
        questionId: qId,
        conceptTag: weakness.conceptTag.name,
        reason: "weakness_retarget",
        priority: weakness.priority,
      });
    }
  }

  return result;
}

function selectSpacedRepetition(
  attempts: QuestionAttempt[],
  intervals: number[],
  maxCount: number,
  usedIds: Set<string>,
): DailyMixQuestion[] {
  const result: DailyMixQuestion[] = [];
  const now = new Date();

  // Find incorrect attempts that fall on an SRS interval day
  const incorrectAttempts = attempts
    .filter((a) => !a.isCorrect)
    .sort(
      (a, b) =>
        new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime(),
    );

  for (const attempt of incorrectAttempts) {
    if (result.length >= maxCount) break;
    if (usedIds.has(attempt.questionId)) continue;

    const daysSinceAttempt = Math.floor(
      (now.getTime() - new Date(attempt.attemptedAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // If the attempt falls on any SRS interval, include it
    if (intervals.includes(daysSinceAttempt)) {
      usedIds.add(attempt.questionId);
      result.push({
        questionId: attempt.questionId,
        conceptTag: attempt.conceptTags[0]?.name ?? "General",
        reason: "spaced_repetition",
        priority: 0.8,
      });
    }
  }

  return result;
}

function selectReinforcement(
  attempts: QuestionAttempt[],
  maxCount: number,
  usedIds: Set<string>,
): DailyMixQuestion[] {
  const result: DailyMixQuestion[] = [];

  // Find questions answered correctly only once (need reinforcement)
  const correctOnce = new Map<string, number>();
  for (const a of attempts) {
    if (a.isCorrect) {
      correctOnce.set(a.questionId, (correctOnce.get(a.questionId) ?? 0) + 1);
    }
  }

  const candidates = [...correctOnce.entries()]
    .filter(([, count]) => count === 1)
    .map(([id]) => id);

  for (const qId of candidates) {
    if (result.length >= maxCount) break;
    if (usedIds.has(qId)) continue;

    const attempt = attempts.find((a) => a.questionId === qId);
    usedIds.add(qId);
    result.push({
      questionId: qId,
      conceptTag: attempt?.conceptTags[0]?.name ?? "General",
      reason: "reinforcement",
      priority: 0.4,
    });
  }

  return result;
}

function selectNewQuestions(
  allQuestionIds: string[],
  attempts: QuestionAttempt[],
  maxCount: number,
  usedIds: Set<string>,
): DailyMixQuestion[] {
  const attemptedIds = new Set(attempts.map((a) => a.questionId));
  const result: DailyMixQuestion[] = [];

  for (const qId of allQuestionIds) {
    if (result.length >= maxCount) break;
    if (usedIds.has(qId) || attemptedIds.has(qId)) continue;

    usedIds.add(qId);
    result.push({
      questionId: qId,
      conceptTag: "New",
      reason: "new",
      priority: 0.2,
    });
  }

  return result;
}
