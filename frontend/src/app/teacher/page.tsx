"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, Upload, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api";
import QRCode from "qrcode.react";

export default function TeacherBoardPage() {
  const { user, token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    if (!token) return;
    const res = await fetch(buildApiUrl("/api/v1/teacher/classes"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setClasses(data);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [token]);

  const handleCreateClass = async () => {
    if (!token || !name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/teacher/classes"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        setName("");
        setDescription("");
        await fetchClasses();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
        <div className="ilmora-noise relative">
          <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-6">
            <header className="mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                Educator Studio
              </p>
              <h1 className="text-3xl font-semibold">Teacher Board</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Assign classes, upload learning packs, and deliver notes for
                your students. We process the content into their knowledge
                graphs.
              </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-slate-900/5 p-3 text-slate-700 dark:bg-white/10 dark:text-white/80">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Assigned classes</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      Create cohorts and invite students.
                    </p>
                  </div>
                </div>
                <div className="mb-4 grid gap-2">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Class name"
                    className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                  <input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Short description"
                    className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateClass}
                  disabled={loading}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {loading ? "Creating..." : "Create class"}
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-slate-900/5 p-3 text-slate-700 dark:bg-white/10 dark:text-white/80">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Upload content</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      PDFs, slides, and notes for ingestion.
                    </p>
                  </div>
                </div>
                <Link
                  href="/upload"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  Upload pack
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-slate-900/5 p-3 text-slate-700 dark:bg-white/10 dark:text-white/80">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Assignments</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      Schedule tasks and weekly practice.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  Add assignment
                </button>
              </div>
            </div>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">Active classes</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {classes.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    No classes yet. Create your first class above.
                  </p>
                )}
                {classes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {item.description || "No description"}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
                          Join code: {item.join_code}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/5">
                        <QRCode value={item.join_url} size={88} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-900/5 p-3 text-slate-700 dark:bg-white/10 dark:text-white/80">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Instructor notes</p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Drop class notes and annotate key concepts for ingestion.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <textarea
                  placeholder="Paste notes or prompts for the class"
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Submit notes
              </button>
            </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
