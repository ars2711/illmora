"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api";
import {
  ArrowLeft,
  User,
  Music2,
  Terminal,
  PenTool,
  Beaker,
  BookOpen,
  Check,
} from "lucide-react";

const archetypes = [
  { id: "musician", label: "Musician", icon: Music2 },
  { id: "developer", label: "Developer", icon: Terminal },
  { id: "designer", label: "Designer", icon: PenTool },
  { id: "scientist", label: "Scientist", icon: Beaker },
  { id: "writer", label: "Writer", icon: BookOpen },
];

export default function ProfileSettingsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [archetype, setArchetype] = useState("musician");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(buildApiUrl("/api/v1/users/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.archetype) setArchetype(data.archetype);
        if (data.phone_number) setPhoneNumber(data.phone_number);
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, [token]);

  const handleSave = async () => {
    if (!token) {
      showToast("Session expired. Please sign in again.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/users/me/profile"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          archetype,
          phone_number: phoneNumber,
          whatsapp_number: whatsappNumber,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      localStorage.setItem("ilmora-archetype", archetype);
      showToast("Profile updated.", "success");
    } catch (err: any) {
      showToast(err.message ?? "Profile update failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
        <div className="ilmora-noise relative">
          <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
          <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-6">
            <header className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-900/5 p-3 text-slate-700 dark:bg-white/10 dark:text-white/80">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    Settings
                  </p>
                  <h1 className="text-2xl font-semibold">Profile & Access</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/settings/security"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  Security
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </div>
            </header>

            <section className="mb-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">Archetype</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                This changes your interface labels and iconography.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {archetypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = archetype === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setArchetype(type.id)}
                      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-400/50 dark:bg-amber-900/20 dark:text-amber-300"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <Icon size={22} />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        {type.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 rounded-full bg-amber-400 p-0.5 text-white">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">Recovery channels</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Add numbers so OTP and reset codes can be delivered by SMS or
                WhatsApp.
              </p>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/70">
                    Phone number (SMS)
                  </label>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="+1 555 010 1010"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/70">
                    WhatsApp number
                  </label>
                  <input
                    value={whatsappNumber}
                    onChange={(event) => setWhatsappNumber(event.target.value)}
                    placeholder="+1 555 010 2020"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </div>
              </div>
            </section>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
