"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Wand2, Save } from "lucide-react";
import Link from "next/link";
import { buildApiUrl } from "@/lib/api";
import { useTranslations } from "next-intl";

export default function NoteDetailPage() {
  const t = useTranslations("noteDetail");
  const { id } = useParams();
  const { user, token } = useAuth();
  const [note, setNote] = useState<{ title: string; content: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !id || !token) return;
      const cacheKey = `note_cache_${id}`;

      try {
        // Network First Strategy
        const res = await fetch(buildApiUrl(`/api/v1/documents/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNote(data);
          setContent(data.content);
          // Update Cache
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          throw new Error(t("errors.fetchFailed"));
        }
      } catch (e) {
        console.warn(t("errors.networkCache"), e);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          setNote(data);
          setContent(data.content);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [user, id]);

  const handleAISummarize = async () => {
    // Future Phase: Call AI to restructure 'content' locally or via API
    alert(t("aiComingSoon"));
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-white/70">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!note)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-white/70">
        {t("empty")}
      </div>
    );

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
        <div className="ilmora-noise relative">
          <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
          <div className="relative z-10">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto flex max-w-3xl items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="rounded-full p-2 hover:bg-slate-900/5 dark:hover:bg-white/10"
                  >
                    <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-white/70" />
                  </Link>
                  <h1 className="text-lg font-semibold">{note.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAISummarize}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                  >
                    <Wand2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("actions.ai")}</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {isEditing ? <Save className="h-4 w-4" /> : t("actions.edit")}
                    {isEditing ? t("actions.save") : ""}
                  </button>
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-3xl p-6">
              {isEditing ? (
                <textarea
                  aria-label="Note content"
                  className="h-[80vh] w-full rounded-2xl border border-slate-200 bg-white/80 p-4 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              ) : (
                <article className="prose prose-slate max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{content}</div>
                </article>
              )}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
