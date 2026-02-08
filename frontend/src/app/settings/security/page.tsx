"use client";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { credentialToJSON, normalizePublicKeyOptions } from "@/lib/passkey";
import Link from "next/link";
import { Shield, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import QRCode from "qrcode.react";
import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";
import { useState } from "react";
import { buildApiUrl } from "@/lib/api";
import { useTranslations } from "next-intl";

export default function SecuritySettingsPage() {
  const t = useTranslations("security");
  const { user, demoMode, token } = useAuth();
  const { showToast } = useToast();
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [totpUrl, setTotpUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaChannels, setMfaChannels] = useState<string[]>(["email"]);
  const [mfaLoading, setMfaLoading] = useState(false);

  const handlePasskeyCreate = async () => {
    if (!user) return;
    if (!window.PublicKeyCredential) {
      showToast(t("errors.unsupported"), "error");
      return;
    }
    setPasskeyLoading(true);
    try {
      if (!token) {
        showToast(t("errors.sessionExpired"), "error");
        return;
      }
      const optionsRes = await fetch(
        buildApiUrl("/api/v1/auth/passkeys/register/options"),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!optionsRes.ok) {
        throw new Error(t("errors.startFailed"));
      }
      const optionsData = await optionsRes.json();
      const publicKey = normalizePublicKeyOptions(optionsData.publicKey);
      const credential = await navigator.credentials.create({ publicKey });
      if (!credential) {
        throw new Error(t("errors.canceled"));
      }
      const verifyRes = await fetch(
        buildApiUrl("/api/v1/auth/passkeys/register/verify"),
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
        throw new Error(t("errors.verifyFailed"));
      }
      showToast(t("toast.success"), "success");
    } catch (error: any) {
      showToast(error?.message ?? t("errors.failed"), "error");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handlePasswordSet = async () => {
    if (!token) {
      showToast(t("errors.sessionExpired"), "error");
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/password/set"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword || null,
          new_password: newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Password update failed.");
      }
      showToast("Password updated.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      showToast(error?.message ?? "Password update failed.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTotpSetup = async () => {
    if (!token) {
      showToast(t("errors.sessionExpired"), "error");
      return;
    }
    setMfaLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/mfa/totp/setup"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to setup TOTP");
      const data = await res.json();
      setTotpSecret(data.secret);
      setTotpUrl(data.otpauth_url);
    } catch (err: any) {
      showToast(err.message ?? "Failed to setup TOTP", "error");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleTotpEnable = async () => {
    if (!token || !totpCode) return;
    setMfaLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/mfa/totp/enable"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: totpCode }),
      });
      if (!res.ok) throw new Error("Invalid code");
      showToast("Authenticator enabled.", "success");
      setTotpCode("");
    } catch (err: any) {
      showToast(err.message ?? "Failed to enable TOTP", "error");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaChannels = async () => {
    if (!token) return;
    setMfaLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/mfa/channels"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channels: mfaChannels }),
      });
      if (!res.ok) throw new Error("Failed to update MFA channels");
      showToast("MFA preferences saved.", "success");
    } catch (err: any) {
      showToast(err.message ?? "Failed to update MFA", "error");
    } finally {
      setMfaLoading(false);
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
                    {t("eyebrow")}
                  </p>
                  <h1 className="text-2xl font-semibold">{t("title")}</h1>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("actions.back")}
              </Link>
            </header>

            {demoMode && (
              <div className="mb-8 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100/90">
                {t("demoNotice")}
              </div>
            )}

            <section className="mb-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-900/5 p-3 text-slate-700 dark:bg-white/10 dark:text-white/80">
                    <KeyRound className="h-5 w-5 py-0.5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {t("passkeys.title")}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                      {t("passkeys.body")}
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
                      {t("actions.working")}
                    </span>
                  ) : (
                    t("actions.createPasskey")
                  )}
                </button>
              </div>
            </section>

            <section className="mb-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">
                Two-factor authentication
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Enable extra verification with email, SMS, WhatsApp, voice, or
                authenticator apps.
              </p>

              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-white/70">
                  {["email", "sms", "whatsapp", "voice", "totp"].map(
                    (channel) => (
                      <label
                        key={channel}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={mfaChannels.includes(channel)}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...mfaChannels, channel]
                              : mfaChannels.filter((c) => c !== channel);
                            setMfaChannels(next);
                          }}
                        />
                        {channel}
                      </label>
                    ),
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleMfaChannels}
                  disabled={mfaLoading}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-700 hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {mfaLoading ? "Saving..." : "Save MFA preferences"}
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                  Authenticator app
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {totpUrl && (
                    <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/5">
                      <QRCode value={totpUrl} size={96} />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={handleTotpSetup}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                      Generate authenticator code
                    </button>
                    {totpSecret && (
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        Secret: {totpSecret}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={totpCode}
                        onChange={(event) => setTotpCode(event.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-40 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleTotpEnable}
                        className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-amber-700"
                      >
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">Password access</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Set or change your password to enable email + password login.
              </p>
              <div className="mt-4 grid gap-3">
                <input
                  type="password"
                  placeholder="Current password (if set)"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={handlePasswordSet}
                disabled={passwordLoading || demoMode}
                className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                {passwordLoading ? "Saving..." : "Update password"}
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">{t("providers.title")}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                {t("providers.body")}
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
                      {t("providers.available")}
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
