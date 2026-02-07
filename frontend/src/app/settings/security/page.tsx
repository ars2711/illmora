"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { credentialToJSON, normalizePublicKeyOptions } from "@/lib/passkey";
import Link from "next/link";
import { Shield, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";
import { useState } from "react";

export default function SecuritySettingsPage() {
  const { user, demoMode, token } = useAuth();
  const { showToast } = useToast();
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const handlePasskeyCreate = async () => {
    if (!user) return;
    if (!window.PublicKeyCredential) {
      showToast("Passkeys are not supported here.", "error");
      return;
    }
    setPasskeyLoading(true);
    try {
      if (!token) {
        showToast("Session expired. Please sign in again.", "error");
        return;
      }
      const optionsRes = await fetch(
        "http://localhost:8000/api/v1/auth/passkeys/register/options",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!optionsRes.ok) {
        throw new Error("Unable to start passkey registration.");
      }
      const optionsData = await optionsRes.json();
      const publicKey = normalizePublicKeyOptions(optionsData.publicKey);
      const credential = await navigator.credentials.create({ publicKey });
      if (!credential) {
        throw new Error("Passkey request canceled.");
      }
      const verifyRes = await fetch(
        "http://localhost:8000/api/v1/auth/passkeys/register/verify",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential: credentialToJSON(credential) }),
        },
      );
      if (!verifyRes.ok) {
        throw new Error("Passkey verification failed.");
      }
      showToast("Passkey added successfully.", "success");
    } catch (error: any) {
      showToast(error?.message ?? "Passkey registration failed.", "error");
    } finally {
      setPasskeyLoading(false);
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
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    Settings
                  </p>
                  <h1 className="text-2xl font-semibold">
                    Security & Passkeys
                  </h1>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </header>

            {demoMode && (
              <div className="mb-8 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100/90">
                Demo mode: passkeys and providers are preview-only.
              </div>
            )}

            <section className="mb-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-900/5 p-3 text-slate-700 dark:bg-white/10 dark:text-white/80">
                    <KeyRound className="h-5 w-5 py-0.5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Passkeys</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                      Use a passkey for instant sign-in on this device. Passkeys
                      never leave your device and replace passwords.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePasskeyCreate}
                  disabled={passkeyLoading || demoMode || !user}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {passkeyLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Working...
                    </span>
                  ) : (
                    "Create passkey"
                  )}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">Linked providers</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                You can use these providers on the login screen when enabled in
                your identity provider.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { name: "Google", Icon: FaGoogle },
                  { name: "GitHub", Icon: FaGithub },
                  { name: "Apple", Icon: FaApple },
                ].map(({ name, Icon }) => (
                  <div
                    key={name}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white/80"
                  >
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="font-semibold">{name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                      Available on sign in
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
