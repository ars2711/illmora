"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { BrainCircuit, Send, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { buildApiUrl } from "@/lib/api";
import { useTranslations } from "next-intl";

export default function PracticePage() {
  const t = useTranslations("practice");
  const { user, demoMode, token } = useAuth();
  const [topic, setTopic] = useState("");
  const [step, setStep] = useState<"setup" | "question" | "result">("setup");
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
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
          content: t("prompts.generate", { topic }),
          mode: "socratic",
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
    if (!userAnswer) return;
    setLoading(true);
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
          content: t("prompts.submit", { answer: userAnswer }),
          mode: "socratic",
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
              {step === "setup" && (
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
                      {loading ? t("setup.loading") : t("setup.cta")}
                      {!loading && <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {step === "question" && (
                <div className="ilmora-scroll-accent rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/60">
                      {t("question.title")}
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
                      placeholder={t("answer.placeholder")}
                      className="h-32 w-full resize-none rounded-lg border border-slate-200 bg-white/90 p-4 outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    />
                    <button
                      onClick={submitAnswer}
                      disabled={loading || !userAnswer}
                      className="mt-4 w-full rounded-lg bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      {loading ? t("answer.loading") : t("answer.cta")}
                    </button>
                  </div>
                </div>
              )}

              {step === "result" && (
                <div className="ilmora-scroll-accent rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="mb-6 border-b border-slate-200 pb-6 dark:border-white/10">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/50">
                      {t("result.question")}
                    </h3>
                    <p className="line-clamp-2 text-sm text-slate-600 dark:text-white/60">
                      {question}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                      <Check className="w-4 h-4" /> {t("result.feedback")}
                    </h3>
                    <article className="prose prose-sm max-w-none text-slate-900 dark:prose-invert">
                      <div className="whitespace-pre-wrap">{feedback}</div>
                    </article>
                  </div>

                  <button
                    onClick={() => {
                      setStep("setup");
                      setTopic("");
                      setUserAnswer("");
                      setQuestion("");
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 py-3 font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
                  >
                    {t("result.cta")}
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
