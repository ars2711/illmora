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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Material</h1>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
            {status === "uploading" ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
        </div>

        <h3 className="text-lg font-medium mb-2">Upload Lectures or Notes</h3>
        <p className="text-gray-500 text-sm mb-6">
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
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg cursor-pointer hover:bg-indigo-700 transition"
          >
            Select Document
          </label>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">{file.name}</span>
              <button
                onClick={() => setFile(null)}
                className="text-xs text-red-500 hover:text-red-700 ml-2"
              >
                Remove
              </button>
            </div>

            {status !== "success" && (
              <button
                onClick={handleUpload}
                disabled={status === "uploading"}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "uploading" ? "Analyzing..." : "Start Extraction"}
              </button>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Document processed!</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/notes")}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                View Notes
              </button>
              <button
                onClick={() => router.push("/practice")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                Start Quiz
              </button>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-center text-gray-500 hover:text-indigo-600 mt-2 underline"
            >
              Upload another file
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {message}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="font-semibold mb-4">Why upload?</h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Generate revision notes instantly.
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            Chat with your documents (RAG).
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
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
      <div className="min-h-screen bg-gray-50 pb-20">
        <UploadContent />
        {/* Can add BottomNav here if we wrap with DashboardLayout, but let's assume it's standalone or wrapped */}
      </div>
    </ProtectedRoute>
  );
}
