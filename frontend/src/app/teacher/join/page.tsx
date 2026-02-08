"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api";

export default function JoinClassPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (params.get("code")) setCode(params.get("code") as string);
  }, [params]);

  const handleJoin = async () => {
    if (!token || !code.trim()) return;
    const res = await fetch(buildApiUrl("/api/v1/teacher/classes/join"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: code.trim() }),
    });
    if (res.ok) {
      setStatus("Joined! Redirecting...");
      window.setTimeout(() => router.push("/dashboard"), 800);
    } else {
      setStatus("Invalid code. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 mx-auto max-w-md px-6 pb-16 pt-16">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
              Join class
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Enter class code</h1>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="ABC12345"
              className="mt-4 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <button
              type="button"
              onClick={handleJoin}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Join
            </button>
            {status && <p className="mt-3 text-xs text-amber-700">{status}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
