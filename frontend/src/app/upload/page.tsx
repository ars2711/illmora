"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

function UploadContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:8000/api/v1/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      setStatus("success");
      showToast("Document processed successfully!", "success");
      setFile(null);

      // Allow user to choose next action instead of forced redirect
    } catch (error) {
      setStatus("error");
      console.error(error);
      showToast("Upload failed. Please check the file and try again.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Add Material</h1>

      <div className="ilmora-scroll-accent rounded-3xl border border-slate-200 bg-white/70 p-8 text-center backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-slate-900/5 p-4 text-slate-700 dark:bg-white/10 dark:text-white/80">
            {status === "uploading" ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
        </div>

        <h3 className="mb-2 text-lg font-semibold">Upload Lectures or Notes</h3>
        <p className="mb-6 text-sm text-slate-500 dark:text-white/60">
          Supported formats: PDF, TXT (Max 10MB)
        </p>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          disabled={status === "uploading"}
        />

        {!file ? (
          <label
            htmlFor="file-upload"
            className="inline-block cursor-pointer rounded-full bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            Select Document
          </label>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/10">
              <FileText className="h-5 w-5 text-slate-500 dark:text-white/60" />
              <span className="text-sm font-medium">{file.name}</span>
              <button
                onClick={() => setFile(null)}
                className="ml-2 text-xs text-rose-500 hover:text-rose-600"
              >
                Remove
              </button>
            </div>

            {status !== "success" && (
              <button
                onClick={handleUpload}
                disabled={status === "uploading"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                {status === "uploading" ? "Analyzing..." : "Start Extraction"}
              </button>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Document processed!</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/notes")}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
              >
                View Notes
              </button>
              <button
                onClick={() => router.push("/practice")}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Start Quiz
              </button>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="mt-2 text-center text-xs text-slate-500 underline hover:text-slate-700 dark:text-white/60 dark:hover:text-white"
            >
              Upload another file
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-rose-50 p-3 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertCircle className="h-5 w-5" />
            {message}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="mb-4 font-semibold">Why upload?</h3>
        <ul className="space-y-3 text-sm text-slate-600 dark:text-white/60">
          <li className="flex gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
            Generate revision notes instantly.
          </li>
          <li className="flex gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
            Chat with your documents (RAG).
          </li>
          <li className="flex gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
            Create practice quizzes automatically.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
        <div className="ilmora-noise relative">
          <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
          <div className="relative z-10 pb-20">
            <UploadContent />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
