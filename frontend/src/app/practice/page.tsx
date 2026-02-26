"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  BrainCircuit,
  Send,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Clock,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { buildApiUrl } from "@/lib/api";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import { ExamSimulator } from "@/components/features/exam/ExamSimulator";

interface RevisionCard {
  id: string;
  concept: string;
  front: string;
  back: string;
  type: string;
  next_review_at: string;
}

export default function PracticePage() {
  const t = useTranslations("practice");
  const { user, demoMode, token } = useAuth();

  // Quiz State
  const [topic, setTopic] = useState("");
  const [step, setStep] = useState<"setup" | "question" | "result">("setup");
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  // SRS State
  const [dueCards, setDueCards] = useState<RevisionCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Exam State
  const [examDuration, setExamDuration] = useState(15);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(null);

  // Concept Trap State
  const [trapContent, setTrapContent] = useState<string>("");

  // View Mode
  const [viewMode, setViewMode] = useState<
    "quiz" | "revision" | "exam_setup" | "exam_active" | "concept_trap"
  >("revision");

  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());

  const generateTrap = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      if (!token && !demoMode) return;

      if (demoMode) {
        setTimeout(() => {
          setTrapContent(`**Question:** Is it better to use \`var\` or \`let\` in JavaScript for loop counters?

**Common Misconception:** Use \`var\` because it's function-scoped and faster.

**The Reality:** Use \`let\`. \`var\` in loops is hoisted to the function scope, meaning the loop variable is shared across all iterations. This causes bugs with async closures inside loops. \`let\` is block-scoped, creating a new binding per iteration.`);
          setLoading(false);
        }, 1000);
        return;
      }

      const res = await fetch(buildApiUrl("/api/v1/revision/concept-trap"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ concept: topic }),
      });
      const data = await res.json();
      setTrapContent(data.content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Due Cards on Load
  useEffect(() => {
    if (token && !demoMode) {
      fetch(buildApiUrl("/api/v1/revision/due"), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setDueCards(data);
            setViewMode("revision");
          } else {
            setViewMode("quiz");
          }
        })
        .catch((err) => console.error("Failed to load cards", err));
    } else {
      setViewMode("quiz");
    }
  }, [token, demoMode]);

  const handleCardReview = async (quality: number) => {
    const card = dueCards[currentCardIndex];
    if (!card) return;

    // Optimistically update
    const newCards = [...dueCards];
    newCards.splice(currentCardIndex, 1);
    setDueCards(newCards);
    setIsRevealed(false);

    // Process backend
    if (!demoMode && token) {
      await fetch(buildApiUrl("/api/v1/revision/review"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ card_id: card.id, quality }),
      });
    }

    // If finished
    if (newCards.length === 0) {
      setViewMode("quiz");
    }
  };

  // ... (Existing Quiz Logic) ...
  const demoQuestions = [
    t("demoQuestions.one"),
    t("demoQuestions.two"),
    t("demoQuestions.three"),
  ];

  const demoFeedback = [
    t("demoFeedback.one"),
    t("demoFeedback.two"),
    t("demoFeedback.three"),
  ];

  const generateQuestion = async () => {
    if (!topic) return;
    setLoading(true);

    // Determine AI Mode
    const aiMode = viewMode === "exam_active" ? "exam" : "socratic";

    if (demoMode) {
      setTimeout(() => {
        const pick =
          demoQuestions[Math.floor(Math.random() * demoQuestions.length)];
        setQuestion(pick);
        setStep("question");
        setLoading(false);
      }, 500);
      return;
    }
    try {
      if (!token) {
        return;
      }
      const res = await fetch(buildApiUrl("/api/v1/chat"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          content:
            viewMode === "exam_active"
              ? `Generate a difficult exam question about: ${topic}. Format it as a formal examination question.`
              : t("prompts.generate", { topic }),
          mode: aiMode,
        }),
      });
      const data = await res.json();
      setQuestion(data.response);
      setStep("question");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer && !isTimeUp) return; // Allow empty submit if time up? Maybe not.
    setLoading(true);

    const aiMode = viewMode === "exam_active" ? "exam" : "socratic";

    if (demoMode) {
      setTimeout(() => {
        const pick =
          demoFeedback[Math.floor(Math.random() * demoFeedback.length)];
        setFeedback(pick);
        setStep("result");
        setLoading(false);
      }, 550);
      return;
    }
    try {
      if (!token) {
        return;
      }
      const res = await fetch(buildApiUrl("/api/v1/chat"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          content:
            viewMode === "exam_active"
              ? `Student Answer: "${userAnswer}". Grade this STRICTLY based on the rubric. Provide a percentage score and list errors.`
              : t("prompts.submit", { answer: userAnswer }),
          mode: aiMode,
        }),
      });
      const data = await res.json();
      setFeedback(data.response);
      setStep("result");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
        <div className="ilmora-noise relative">
          <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
          <div className="relative z-10 flex min-h-screen flex-col items-center p-6">
            <header className="mb-8 flex w-full max-w-2xl items-center gap-3">
              <div className="rounded-xl bg-slate-900/5 p-3 text-slate-700 dark:bg-white/10 dark:text-white/80">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{t("title")}</h1>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  {t("subtitle")}
                </p>
              </div>
            </header>

            <main className="w-full max-w-2xl">
              {/* Mode Selector */}
              <div className="flex p-1 bg-slate-100/50 rounded-xl mb-8 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/5">
                <button
                  onClick={() => setViewMode("quiz")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === "quiz" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-white/50"}`}
                >
                  <BrainCircuit size={16} />
                  Quick Quiz
                </button>
                <button
                  onClick={() => setViewMode("revision")}
                  className={`relative flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === "revision" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-white/50"}`}
                >
                  <RotateCcw size={16} />
                  Daily Review
                  {dueCards.length > 0 && (
                    <span className="absolute top-2 right-3 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                <button
                  onClick={() => setViewMode("exam_setup")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode.startsWith("exam") ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-white/50"}`}
                >
                  <Clock size={16} />
                  Exam Simulator
                </button>
                <button
                  onClick={() => setViewMode("concept_trap")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === "concept_trap" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-white/50"}`}
                >
                  <Zap size={16} />
                  Concept Trap
                </button>
              </div>

              {/* Exam Active Overlay */}
              <ExamSimulator
                durationMinutes={examDuration}
                isActive={viewMode === "exam_active"}
                onTimeUp={() => {
                  setIsTimeUp(true);
                  // Optionally force submit or lock inputs here
                }}
              />

              {/* VIEW: REVISION */}
              {viewMode === "revision" ? (
                dueCards.length > 0 ? (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-indigo-500" />
                        Session Active
                      </h2>
                      <div className="text-xs font-mono text-slate-400">
                        {currentCardIndex + 1} / {dueCards.length}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-300"
                          // Use inline style for dynamic width percentage
                          style={{
                            width: `${Math.min(100, (currentCardIndex / dueCards.length) * 100)}%`,
                          }}
                        />
                      </div>

                      {/* Card */}
                      <div className="min-h-[300px] rounded-2xl border-2 border-indigo-100 bg-white p-8 shadow-xl dark:border-indigo-900/40 dark:bg-slate-900 flex flex-col items-center text-center justify-center transition-all bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)]">
                        <span className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-bold mb-4 bg-indigo-50 px-2 py-1 rounded-md dark:bg-indigo-900/30">
                          {dueCards[currentCardIndex].type.replace("_", " ")}
                        </span>

                        <div className="prose prose-lg dark:prose-invert mb-8">
                          <ReactMarkdown>
                            {dueCards[currentCardIndex].front}
                          </ReactMarkdown>
                        </div>

                        {isRevealed ? (
                          <div className="w-full pt-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2 fade-in">
                            <div className="prose prose-sm dark:prose-invert mb-6 text-left mx-auto bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                              <ReactMarkdown>
                                {dueCards[currentCardIndex].back}
                              </ReactMarkdown>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <button
                                onClick={() => handleCardReview(1)}
                                className="flex flex-col items-center justify-center p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300 transition-colors"
                              >
                                <span className="text-xs font-bold uppercase tracking-wider mb-1">
                                  Hard
                                </span>
                                <span className="text-[10px] opacity-70">
                                  1 day
                                </span>
                              </button>
                              <button
                                onClick={() => handleCardReview(3)}
                                className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-300 transition-colors"
                              >
                                <span className="text-xs font-bold uppercase tracking-wider mb-1">
                                  Good
                                </span>
                                <span className="text-[10px] opacity-70">
                                  3 days
                                </span>
                              </button>
                              <button
                                onClick={() => handleCardReview(5)}
                                className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-300 transition-colors"
                              >
                                <span className="text-xs font-bold uppercase tracking-wider mb-1">
                                  Easy
                                </span>
                                <span className="text-[10px] opacity-70">
                                  7 days
                                </span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsRevealed(true)}
                            className="px-8 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                          >
                            <BookOpen size={18} />
                            Reveal Answer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mb-4 opacity-80" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                      All Caught Up!
                    </h3>
                    <p className="text-slate-500 dark:text-white/60 max-w-sm mb-6">
                      You have reviewed all your pending cards for today. Great
                      job maintaining your memory streak.
                    </p>
                    <button
                      onClick={() => setViewMode("quiz")}
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-white dark:text-slate-900 font-medium"
                    >
                      Try a Quiz Instead
                    </button>
                  </div>
                )
              ) : null}

              {/* VIEW: EXAM SETUP */}
              {viewMode === "exam_setup" && (
                <div className="ilmora-scroll-accent rounded-2xl border border-slate-200 bg-white/70 p-8 backdrop-blur dark:border-white/10 dark:bg-white/5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-100 rounded-xl text-red-600 dark:bg-red-500/20 dark:text-red-400">
                      <AlertOctagon size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Exam Simulator
                      </h2>
                      <p className="text-slate-500 dark:text-white/60 text-sm">
                        Strict grading. Timed conditions. No help.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                        Subject / Topic
                      </label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Advanced Calculus, organic chemistry..."
                        className="w-full rounded-xl border border-slate-200 bg-white/90 p-4 outline-none focus:ring-2 focus:ring-red-500/50 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                        Duration (Minutes)
                      </label>
                      <div className="flex gap-2">
                        {[10, 20, 30, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            onClick={() => setExamDuration(mins)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${examDuration === mins ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-white/80"}`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-xs border border-amber-100 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-900/30 flex gap-2">
                      <AlertTriangle className="shrink-0" size={16} />
                      <p>
                        This mode is designed to be stressful. The AI will not
                        be helpful; it will act as a strict examiner. Your
                        "Thinking Process" is hidden in this mode to simulate a
                        real exam.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setViewMode("exam_active");
                        generateQuestion();
                      }}
                      disabled={!topic || loading}
                      className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                      {loading
                        ? "Preparing Exam Paper..."
                        : "Begin Examination"}
                      {!loading && <Send size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW: CONCEPT TRAP */}
              {viewMode === "concept_trap" && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-4 dark:bg-amber-900/30 dark:text-amber-400">
                      <Zap size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Concept Traps
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                      Challenge your intuition. Find out what you <em>think</em>{" "}
                      you know, but actually don't.
                    </p>
                  </div>

                  {!trapContent ? (
                    <div className="ilmora-scroll-accent rounded-2xl border border-amber-200 bg-amber-50/50 p-6 backdrop-blur dark:border-amber-900/30 dark:bg-amber-900/10 shadow-lg shadow-amber-500/5">
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-white/70">
                        What topic do you want to challenge?
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g. Quantum Entanglement, JavaScript Closures..."
                          className="flex-1 rounded-lg border border-slate-200 bg-white/90 p-3 outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white transition-all shadow-sm"
                          onKeyDown={(e) => e.key === "Enter" && generateTrap()}
                        />
                        <button
                          onClick={generateTrap}
                          disabled={loading || !topic}
                          className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                        >
                          {loading ? "Generating..." : "Trap Me!"}
                          {!loading && <Zap className="w-4 h-4 fill-current" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ilmora-scroll-accent rounded-2xl border border-amber-200 bg-white p-8 backdrop-blur dark:border-amber-900/30 dark:bg-slate-900 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>

                      <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-6 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Concept Trap Analysis
                      </h3>

                      <div className="prose prose-lg dark:prose-invert max-w-none">
                        <ReactMarkdown>{trapContent}</ReactMarkdown>
                      </div>

                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={() => {
                            setTrapContent("");
                            setTopic("");
                          }}
                          className="rounded-lg bg-slate-100 px-6 py-2 font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          Try Another Topic
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: QUICK QUIZ OR EXAM ACTIVE (Shared Question UI) */}
              {(viewMode === "quiz" || viewMode === "exam_active") && (
                <>
                  {step === "setup" && viewMode === "quiz" && (
                    <div className="ilmora-scroll-accent rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-white/70">
                        {t("setup.label")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder={t("setup.placeholder")}
                          className="flex-1 rounded-lg border border-slate-200 bg-white/90 p-3 outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        />
                        <button
                          onClick={generateQuestion}
                          disabled={loading || !topic}
                          className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                          {loading ? t("setup.loading") : "Generate Quiz"}
                          {!loading && <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === "question" && (
                    <div
                      className={`ilmora-scroll-accent rounded-2xl border bg-white/70 p-6 backdrop-blur dark:bg-white/5 ${viewMode === "exam_active" ? "border-red-200 dark:border-red-900/30 shadow-red-500/5" : "border-slate-200 dark:border-white/10"}`}
                    >
                      {viewMode === "exam_active" && (
                        <div className="mb-4 inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50">
                          EXAMINATION IN PROGRESS
                        </div>
                      )}

                      <div className="mb-6">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/60">
                          {viewMode === "exam_active"
                            ? "Question 1 of 1"
                            : t("question.title")}
                        </h3>
                        <p className="whitespace-pre-wrap text-lg leading-relaxed text-slate-900 dark:text-white">
                          {question}
                        </p>
                      </div>

                      <div className="mt-6">
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-white/70">
                          {t("answer.label")}
                        </label>
                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder={
                            viewMode === "exam_active"
                              ? "Type your answer clearly. Show working if applicable..."
                              : t("answer.placeholder")
                          }
                          className={`h-32 w-full resize-none rounded-lg border bg-white/90 p-4 outline-none focus:ring-2 dark:bg-white/10 dark:text-white ${viewMode === "exam_active" ? "focus:ring-red-500/50 border-slate-200" : "focus:ring-amber-300 border-slate-200 dark:border-white/10"}`}
                          disabled={isTimeUp}
                        />
                        <button
                          onClick={submitAnswer}
                          disabled={loading || !userAnswer || isTimeUp}
                          className={`mt-4 w-full rounded-lg py-3 font-medium text-white disabled:opacity-50 ${viewMode === "exam_active" ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"}`}
                        >
                          {loading
                            ? viewMode === "exam_active"
                              ? "Grading..."
                              : t("answer.loading")
                            : viewMode === "exam_active"
                              ? "Submit for Grading"
                              : t("answer.cta")}
                        </button>
                        {isTimeUp && (
                          <p className="text-center text-red-500 font-bold mt-2">
                            Time is up! Please submit what you have.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === "result" && (
                    <div
                      className={`ilmora-scroll-accent rounded-2xl border bg-white/70 p-6 backdrop-blur dark:bg-white/5 ${viewMode === "exam_active" ? "border-red-200 dark:border-red-900/30" : "border-slate-200 dark:border-white/10"}`}
                    >
                      <div className="mb-6 border-b border-slate-200 pb-6 dark:border-white/10">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/50">
                          {t("result.question")}
                        </h3>
                        <p className="line-clamp-2 text-sm text-slate-600 dark:text-white/60">
                          {question}
                        </p>
                      </div>

                      <div className="mb-6">
                        <h3
                          className={`mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${viewMode === "exam_active" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-300"}`}
                        >
                          {viewMode === "exam_active" ? (
                            <AlertOctagon className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          {viewMode === "exam_active"
                            ? "Examiner Report"
                            : t("result.feedback")}
                        </h3>
                        <article className="prose prose-sm max-w-none text-slate-900 dark:prose-invert">
                          <div className="whitespace-pre-wrap">{feedback}</div>
                        </article>
                      </div>

                      <button
                        onClick={() => {
                          setStep("setup");
                          setTopic("");
                          setQuestion("");
                          setUserAnswer("");
                          setFeedback("");
                          setIsTimeUp(false);
                          if (viewMode === "exam_active")
                            setViewMode("exam_setup");
                        }}
                        className="w-full rounded-lg bg-slate-200 py-3 font-medium text-slate-900 hover:bg-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                      >
                        {viewMode === "exam_active"
                          ? "Return to Exam Menu"
                          : t("result.new")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
