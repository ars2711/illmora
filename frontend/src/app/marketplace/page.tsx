"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Lock, Star, BookOpen, ShoppingBag } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

interface StudyPack {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  author_name: string;
}

export default function MarketplacePage() {
  const { user, token } = useAuth();
  const [packs, setPacks] = useState<StudyPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPacks() {
      try {
        const res = await fetch(
          buildApiUrl("/api/v1/marketplace/packs?scope=institution"),
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          setPacks(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user && token) loadPacks();
  }, [user, token]);

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10">
          <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
              <div>
                <h1 className="text-3xl font-display">Marketplace</h1>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  Premium notes and study packs from top students.
                </p>
              </div>
              <button className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-white/90">
                Create Study Pack
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {loading ? (
              <div className="py-20 text-center text-slate-500 dark:text-white/60">
                Loading Marketplace...
              </div>
            ) : packs.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white/70 px-8 py-20 text-center backdrop-blur dark:border-white/10 dark:bg-white/5">
                <ShoppingBag className="mx-auto h-12 w-12 text-slate-400 dark:text-white/40" />
                <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                  No packs available yet
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                  Be the first to publish your notes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((pack) => (
                  <div
                    key={pack.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 rounded-2xl bg-slate-900/5 p-3 dark:bg-white/10">
                          <BookOpen className="h-6 w-6 text-slate-700 dark:text-white/70" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="truncate text-sm font-medium text-slate-500 dark:text-white/60">
                              {pack.author_name}
                            </dt>
                            <dd>
                              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                                {pack.title}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/70 px-5 py-4 dark:bg-white/5">
                      <p className="mb-4 line-clamp-2 h-10 text-sm text-slate-600 dark:text-white/60">
                        {pack.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="ml-1 text-sm font-medium text-slate-600 dark:text-white/60">
                            {pack.rating > 0 ? pack.rating : "New"}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {pack.price > 0 ? `PKR ${pack.price}` : "Free"}
                        </div>
                      </div>
                      <button className="mt-4 w-full rounded-full border border-slate-200 bg-slate-900 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-slate-800 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-white/90">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
