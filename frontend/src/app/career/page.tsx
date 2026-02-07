"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import ReactMarkdown from "react-markdown"; // Assuming installed or will be
import { Target, Map, ArrowRight, Loader } from "lucide-react";

interface RoadmapResponse {
  roadmap_content: string;
  suggested_modules: string[];
  estimated_time: string;
}

export default function CareerPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [customGoal, setCustomGoal] = useState("");

  const generateRoadmap = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:8000/api/v1/career/roadmap", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            target_role: customGoal || undefined
        }),
      });
      
      if (res.ok) {
        setRoadmap(await res.json());
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10">
          <header className="border-b border-slate-200 bg-white/70 py-10 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-display">Career Intelligence</h1>
              <p className="mt-2 text-slate-600 dark:text-white/60">
                AI-driven strategy to bridge your degree with industry needs.
              </p>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            {/* Controls */}
            <div className="mb-8 rounded-3xl border border-slate-200 bg-white/70 px-5 py-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:px-6">
              <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/70">
                    Target Role (Optional override)
                  </label>
                  <div className="relative mt-1 rounded-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Target className="h-5 w-5 text-slate-400 dark:text-white/40" />
                    </div>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-slate-200 bg-white/90 py-3 pl-10 text-sm focus:border-amber-300 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      placeholder="e.g. Full Stack Developer, Data Scientist..."
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <button
                    onClick={generateRoadmap}
                    disabled={loading}
                    className="flex w-full justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {loading ? (
                      <>
                        <Loader className="-ml-1 mr-2 h-5 w-5 animate-spin" />
                        Analyzing Syllabus...
                      </>
                    ) : (
                      <>
                        <Map className="-ml-1 mr-2 h-5 w-5" />
                        Generate Roadmap
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {roadmap && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-5 dark:border-white/10 dark:bg-white/10">
                  <h3 className="text-lg font-medium">Personalized Strategy</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-0.5 text-sm font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                    Est. Time: {roadmap.estimated_time}
                  </span>
                </div>
                <div className="prose prose-slate max-w-none px-6 py-8 dark:prose-invert">
                  <ReactMarkdown>{roadmap.roadmap_content}</ReactMarkdown>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
