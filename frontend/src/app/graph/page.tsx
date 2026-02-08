"use client";

import React, { useEffect, useState } from "react";
import { KnowledgeGraph } from "@/components/features/graph/GraphVisualization";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { buildApiUrl } from "@/lib/api";
import { useTranslations } from "next-intl";

function GraphContent() {
  const t = useTranslations("graph");
  const [data, setData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(buildApiUrl("/api/v1/graph"), {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) throw new Error(t("errors.fetchFailed"));
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user && token) fetchData();
  }, [user, token]);

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="px-6 py-4 border-b border-slate-200 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="rounded-full p-2 hover:bg-slate-900/5 dark:hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-white/70" />
              </Link>
              <h1 className="text-xl font-semibold">{t("title")}</h1>
            </div>
          </header>

          <main className="flex-1 p-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-600 dark:text-white/70" />
              </div>
            ) : data ? (
              <KnowledgeGraph
                initialNodes={data.nodes}
                initialEdges={data.edges}
              />
            ) : (
              <div className="mt-20 text-center text-slate-500 dark:text-white/60">
                <p>{t("empty.title")}</p>
                <p className="text-sm">{t("empty.body")}</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function GraphPage() {
  return (
    <ProtectedRoute>
      <GraphContent />
    </ProtectedRoute>
  );
}
