"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Book, Clock, AlertTriangle, Plus, BarChart2, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buildApiUrl } from "@/lib/api";
import { CognitiveProfile } from "@/components/features/profile/CognitiveProfile";
import StreakBadge from "@/components/gamification/StreakBadge";

interface ProfileData {
  full_name: string;
  profile_completed: boolean;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { user, demoMode, token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (demoMode) {
        setProfile({ full_name: t("demo.name"), profile_completed: true });
        setLoading(false);
        return;
      }
      if (!user) {
        // Not logged in and not in demo mode -> redirect to login
        router.push("/login");
        return;
      }
      try {
        if (!token) {
          router.push("/login");
          return;
        }
        const res = await fetch(buildApiUrl("/api/v1/users/me"), {
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
  }, [user, token, router, demoMode, t]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-600 dark:bg-slate-950 dark:text-white/70">
        {t("loading")}
      </div>
    );

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 mx-auto max-w-4xl p-6">
          <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">
                {t("welcome", {
                  name: profile?.full_name?.split(" ")[0] || t("fallbackName"),
                })}
              </h1>
              <p className="text-slate-500 dark:text-white/60">
                {t("subtitle")}
              </p>
            </div>
            <StreakBadge
              streak={{
                currentStreak: 3,
                longestStreak: 5,
                streakFreezeAvailable: true,
                lastActivityDate: new Date().toISOString(),
              }}
              compact
            />
          </header>

          {demoMode && (
            <section className="mb-8 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100/90">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700/80 dark:text-amber-100/80">
                    {t("demo.title")}
                  </p>
                  <p className="mt-2">{t("demo.body")}</p>
                </div>
                <Link
                  href="/login"
                  className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm hover:bg-amber-500"
                >
                  {t("demo.cta")}
                </Link>
              </div>
            </section>
          )}

          {!demoMode && user && (
            <section className="mb-8 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
                    {t("security.title")}
                  </p>
                  <p className="mt-2">{t("security.body")}</p>
                </div>
                <Link
                  href="/settings/security"
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {t("security.cta")}
                </Link>
              </div>
            </section>
          )}

          {/* Weak Areas Summary */}
          <section className="mb-8">
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 backdrop-blur dark:border-amber-200/20 dark:bg-amber-200/10">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  {t("focus.title")}
                </h3>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/80">
                  {t.rich("focus.body", {
                    topic: (chunks) => (
                      <span className="font-bold">{chunks}</span>
                    ),
                  })}
                </p>
                <button className="mt-3 text-sm font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-100/80 dark:hover:text-amber-100">
                  {t("focus.cta")}
                </button>
              </div>
            </div>
          </section>

          {/* Subjects Grid */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("subjects.title")}</h2>
              <Link
                href="/onboarding"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
              >
                {t("subjects.edit")}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Example Cards - Phase 1 MVP Mock */}
              {[
                t("subjects.items.dataStructures"),
                t("subjects.items.linearAlgebra"),
                t("subjects.items.psychology"),
              ].map((subj, i) => (
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
                      {t("subjects.stats")}
                    </span>
                  </div>
                </div>
              ))}

              <Link
                href="/upload"
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-4 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 dark:border-white/10 dark:text-white/50 dark:hover:border-white/30 dark:hover:text-white/70"
              >
                <Plus className="mb-2 h-6 w-6" />
                <span className="text-sm font-medium">{t("subjects.add")}</span>
              </Link>
            </div>
          </section>

          {/* Cognitive Profile Dashboard (Turbo Feature) */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-500" />
                Long-Term Growth & Cognitive Profile
              </h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase font-bold tracking-wider dark:bg-indigo-900/30 dark:text-indigo-300">
                Beta
              </span>
            </div>
            <CognitiveProfile />
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              {t("activity.title")}
            </h2>
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white/70 shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3 p-4">
                <Clock className="h-4 w-4 text-slate-400 dark:text-white/50" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {t("activity.items.chat.title")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {t("activity.items.chat.time")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <Clock className="h-4 w-4 text-slate-400 dark:text-white/50" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {t("activity.items.upload.title")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {t("activity.items.upload.time")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {demoMode && (
            <section className="mt-8">
              <h2 className="mb-4 text-lg font-semibold">
                {t("demoStudio.title")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: t("demoStudio.items.drafts.title"),
                    detail: t("demoStudio.items.drafts.detail"),
                  },
                  {
                    title: t("demoStudio.items.graph.title"),
                    detail: t("demoStudio.items.graph.detail"),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-2">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
