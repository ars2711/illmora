"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { credentialToJSON, normalizePublicKeyOptions } from "@/lib/passkey";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { startDemo, signInWithToken } = useAuth();

  const IconBadge = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string; // made optional
  }) => (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center ${className || ""}`}
    >
      {children}
    </span>
  );

  const handlePasskeyLogin = async () => {
    if (!email) {
      setError(t("errors.missingEmail"));
      return;
    }
    if (!window.PublicKeyCredential) {
      setError(t("errors.unsupportedPasskey"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const optionsRes = await fetch(
        "http://localhost:8000/api/v1/auth/passkeys/authenticate/options",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      if (!optionsRes.ok) {
        throw new Error(t("errors.passkeyStart"));
      }
      const optionsData = await optionsRes.json();
      const publicKey = normalizePublicKeyOptions(optionsData.publicKey);
      const credential = await navigator.credentials.get({ publicKey });
      if (!credential) {
        throw new Error(t("errors.passkeyCanceled"));
      }

      const verifyRes = await fetch(
        "http://localhost:8000/api/v1/auth/passkeys/authenticate/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            credential: credentialToJSON(credential),
          }),
        },
      );

      if (!verifyRes.ok) {
        throw new Error(t("errors.passkeyVerify"));
      }
      const verifyData = await verifyRes.json();
      signInWithToken(verifyData.token);
      router.push("/chat");
    } catch (err: any) {
      setError(err.message ?? t("errors.passkeyFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ilmora-ambient min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.25),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] p-6 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
          <Sparkles size={14} /> {t("badge")}
        </p>
        <h2 className="text-2xl font-bold mb-2 text-center text-slate-900 dark:text-white">
          {t("title.login")}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-600 dark:text-white/70">
          {t("subtitle")}
        </p>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/70 p-4 text-left text-sm text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
            {t("afterLogin.title")}
          </p>
          <p className="mt-2">{t("afterLogin.body")}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1"
            >
              {t("fields.email")}
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white/90 p-2 outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
          </div>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          {t("divider")}
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconBadge>
                <KeyRound className="h-4 w-4" />
              </IconBadge>
            )}
            {t("providers.passkey")}
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              startDemo();
              router.push("/dashboard");
            }}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-900 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {t("demo.cta")}
          </button>
          <p className="text-xs text-slate-500 dark:text-white/60">
            {t("demo.note")}
          </p>
        </div>
      </div>
    </div>
  );
}
