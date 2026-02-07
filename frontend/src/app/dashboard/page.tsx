"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Book, Clock, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

interface ProfileData {
  full_name: string;
  profile_completed: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("http://localhost:8000/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.profile_completed) {
            router.push("/onboarding");
            return;
          }
          setProfile(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, [user, router]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-600 dark:bg-slate-950 dark:text-white/70">
        Loading Ilmora...
      </div>
    );

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 mx-auto max-w-4xl p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Scholar"}.
            </h1>
            <p className="text-slate-500 dark:text-white/60">
              Ready to master your concepts today?
            </p>
          </header>

      {/* Weak Areas Summary */}
          <section className="mb-8">
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 backdrop-blur dark:border-amber-200/20 dark:bg-amber-200/10">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Focus Area Detected
                </h3>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/80">
                  You seem to be struggling with{" "}
                  <span className="font-bold">Recursion</span> based on your last
                  chat. Recommended: 15 min review.
                </p>
                <button className="mt-3 text-sm font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-100/80 dark:hover:text-amber-100">
                  Start Review Session
                </button>
              </div>
            </div>
          </section>

      {/* Subjects Grid */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Subjects</h2>
              <Link
                href="/onboarding"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
              >
                Edit
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Example Cards - Phase 1 MVP Mock */}
              {["Data Structures", "Linear Algebra", "Psychology"].map(
                (subj, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-xl bg-slate-900/5 p-2 text-slate-700 dark:bg-white/10 dark:text-white/80">
                        <Book className="h-5 w-5" />
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {subj}
                      </h3>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-white/60">
                        3 notes • 85% mastery
                      </span>
                    </div>
                  </div>
                ),
              )}

              <Link
                href="/upload"
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-4 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 dark:border-white/10 dark:text-white/50 dark:hover:border-white/30 dark:hover:text-white/70"
              >
                <Plus className="mb-2 h-6 w-6" />
                <span className="text-sm font-medium">Add Material</span>
              </Link>
            </div>
          </section>

      {/* Recent Activity */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white/70 shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3 p-4">
                <Clock className="h-4 w-4 text-slate-400 dark:text-white/50" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Chat Session: Linked Lists
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <Clock className="h-4 w-4 text-slate-400 dark:text-white/50" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Uploaded "Lecture_05.pdf"
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Yesterday
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
