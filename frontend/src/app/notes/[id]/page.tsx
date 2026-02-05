"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Wand2, Save } from "lucide-react";
import Link from "next/link";

export default function NoteDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState<{ title: string; content: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !id) return;
      const cacheKey = `note_cache_${id}`;

      try {
        // Network First Strategy
        const token = await user.getIdToken();
        const res = await fetch(
          `http://localhost:8000/api/v1/documents/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setNote(data);
          setContent(data.content);
          // Update Cache
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          throw new Error("API Error");
        }
      } catch (e) {
        console.warn("Network failed, checking offline cache...", e);
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
    alert("AI Structuring coming in next build phase.");
  };

  if (loading)
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  if (!note) return <div className="p-6">Note not found.</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-bold text-lg">{note.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAISummarize}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                AI Structure
              </span>
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
            >
              {isEditing ? <Save className="w-4 h-4" /> : "Edit"}
              {isEditing ? "Save" : ""}
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-6">
          {isEditing ? (
            <textarea
              className="w-full h-[80vh] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          ) : (
            <article className="prose prose-indigo max-w-none">
              <div className="whitespace-pre-wrap">{content}</div>
            </article>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
