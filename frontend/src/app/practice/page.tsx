"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { BrainCircuit, Send, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function PracticePage() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [step, setStep] = useState<"setup" | "question" | "result">("setup");
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());

  const generateQuestion = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          content: `Generate a conceptual practice question about "${topic}". The question should test deep understanding, not just memory. Do not provide the answer.`,
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
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          content: `My answer is: ${userAnswer}. Evaluate this answer. If wrong, explain why conceptually. If right, confirm and expand slightly.`,
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
        <header className="w-full max-w-2xl mb-8 flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl text-white">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Practice Mode</h1>
            <p className="text-sm text-gray-500">
              Test your mastery without the pressure.
            </p>
          </div>
        </header>

        <main className="w-full max-w-2xl">
          {step === "setup" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to practice?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Recursion, Thermodynamics, Organic Chemistry"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={generateQuestion}
                  disabled={loading || !topic}
                  className="px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "Thinking..." : "Start"}
                  {!loading && <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {step === "question" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-2">
                  Question
                </h3>
                <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {question}
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your explanation here..."
                  className="w-full p-4 h-32 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
                <button
                  onClick={submitAnswer}
                  disabled={loading || !userAnswer}
                  className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Grading..." : "Submit Answer"}
                </button>
              </div>
            </div>
          )}

          {step === "result" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2 text-xs">
                  Question
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">{question}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Feedback
                </h3>
                <article className="prose prose-sm max-w-none text-gray-900">
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
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Practice Another Topic
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
