"use client";

import React, { useEffect, useState } from "react";
import { KnowledgeGraph } from "@/components/features/graph/GraphVisualization";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

function GraphContent() {
  const [data, setData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch("http://localhost:8000/api/v1/graph", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch graph");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold">Knowledge Graph Explorer</h1>
        </div>
      </header>

      <main className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : data ? (
          <KnowledgeGraph initialNodes={data.nodes} initialEdges={data.edges} />
        ) : (
          <div className="text-center text-gray-500 mt-20">
            <p>Could not load knowledge graph.</p>
            <p className="text-sm">
              Make sure the backend is running at localhost:8000.
            </p>
          </div>
        )}
      </main>
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
