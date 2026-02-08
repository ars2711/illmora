"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, KeyRound } from "lucide-react";
import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { credentialToJSON, normalizePublicKeyOptions } from "@/lib/passkey";
import { useTranslations } from "next-intl";
import { buildApiUrl } from "@/lib/api";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMethods, setMfaMethods] = useState<string[]>([]);
  const [mfaMethod, setMfaMethod] = useState("totp");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStatus, setMfaStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpChannel, setOtpChannel] = useState("email");
  const [otpStatus, setOtpStatus] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState("");
  const [resetChannel, setResetChannel] = useState("email");
  const [resetSent, setResetSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { startDemo, signInWithToken } = useAuth();
  const otpChannels = ["email"];
  const resetChannels = ["email"];

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

  const redirectAfterLogin = async (authToken: string) => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/users/me"), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.profile_completed) {
          router.push("/onboarding");
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
    router.push("/dashboard");
  };

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
        buildApiUrl("/api/v1/auth/passkeys/authenticate/options"),
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
        buildApiUrl("/api/v1/auth/passkeys/authenticate/verify"),
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
      await redirectAfterLogin(verifyData.token);
    } catch (err: any) {
      setError(err.message ?? t("errors.passkeyFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setPasswordLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/password/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.detail?.code === "mfa_required") {
          setMfaRequired(true);
          setMfaMethods(data.detail.methods || []);
          setMfaMethod(data.detail.methods?.[0] || "totp");
          setMfaStatus("Choose a method to verify your login.");
          return;
        }
        throw new Error(data.detail ?? "Login failed.");
      }
      const data = await res.json();
      signInWithToken(data.token);
      await redirectAfterLogin(data.token);
    } catch (err: any) {
      setError(err.message ?? "Login failed.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleMfaRequest = async () => {
    if (!email) return;
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/mfa/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, method: mfaMethod }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "MFA request failed.");
      }
      const data = await res.json();
      setMfaStatus(
        data.destination ? `Code sent to ${data.destination}.` : "Code ready.",
      );
    } catch (err: any) {
      setError(err.message ?? "MFA request failed.");
    }
  };

  const handleMfaVerify = async () => {
    if (!email || !mfaCode.trim()) return;
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/mfa/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          method: mfaMethod,
          code: mfaCode.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "MFA verification failed.");
      }
      const data = await res.json();
      signInWithToken(data.token);
      await redirectAfterLogin(data.token);
    } catch (err: any) {
      setError(err.message ?? "MFA verification failed.");
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      setError(t("errors.missingEmail"));
      return;
    }
    setError("");
    setOtpLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/otp/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          channel: otpChannel,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Failed to send code.");
      }
      const data = await res.json();
      setOtpStatus(
        data.destination ? `Code sent to ${data.destination}.` : "Code sent.",
      );
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to send code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError("Enter the code sent to your email.");
      return;
    }
    setError("");
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/otp/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          channel: otpChannel,
          code: otpCode.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Invalid code.");
      }
      const data = await res.json();
      if (data.token) {
        signInWithToken(data.token);
        await redirectAfterLogin(data.token);
      }
      setOtpStatus("Verified. Redirecting...");
    } catch (err: any) {
      setError(err.message ?? "Invalid code.");
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError(t("errors.missingEmail"));
      return;
    }
    setError("");
    setResetLoading(true);
    try {
      const res = await fetch(
        buildApiUrl("/api/v1/auth/password/reset/request"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            channel: resetChannel,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Failed to send reset code.");
      }
      const data = await res.json();
      setResetStatus(
        data.destination
          ? `Reset code sent to ${data.destination}.`
          : "Reset code sent.",
      );
      setResetSent(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to send reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetVerify = async () => {
    if (!resetCode.trim()) {
      setError("Enter the reset code.");
      return;
    }
    if (!resetNewPassword || resetNewPassword !== resetConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    try {
      const res = await fetch(
        buildApiUrl("/api/v1/auth/password/reset/verify"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            channel: resetChannel,
            code: resetCode.trim(),
            new_password: resetNewPassword,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Invalid reset code.");
      }
      const data = await res.json();
      if (data.token) {
        signInWithToken(data.token);
        await redirectAfterLogin(data.token);
      }
      setResetStatus("Verified. Redirecting...");
    } catch (err: any) {
      setError(err.message ?? "Invalid reset code.");
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
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white/90 p-2 outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <button
              type="button"
              onClick={handlePasswordLogin}
              disabled={passwordLoading}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {passwordLoading ? "Signing in..." : "Sign in with password"}
            </button>
            {mfaRequired && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                <p className="text-[10px] uppercase tracking-[0.2em]">
                  Two-factor verification
                </p>
                <div className="mt-2 grid gap-2">
                  <select
                    value={mfaMethod}
                    onChange={(event) => setMfaMethod(event.target.value)}
                    aria-label="MFA method"
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs outline-none"
                  >
                    {mfaMethods.map((method) => (
                      <option key={method} value={method}>
                        {method.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {mfaMethod !== "totp" && (
                      <button
                        type="button"
                        onClick={handleMfaRequest}
                        className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
                      >
                        Send code
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleMfaVerify}
                      className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
                    >
                      Verify
                    </button>
                  </div>
                  <input
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value)}
                    placeholder="Enter code"
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs outline-none"
                  />
                  {mfaStatus && <p className="text-[11px]">{mfaStatus}</p>}
                </div>
              </div>
            )}
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
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: "Google", Icon: FaGoogle },
              { label: "GitHub", Icon: FaGithub },
              { label: "Apple", Icon: FaApple },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 py-2 text-xs uppercase tracking-[0.2em] text-slate-500 opacity-70 dark:border-white/10 dark:bg-white/10 dark:text-white/60"
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-left text-xs text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
              OTP access
            </p>
            <div className="mb-3">
              <label
                htmlFor="otp-channel"
                className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/50"
              >
                Delivery channel
              </label>
              <select
                id="otp-channel"
                value={otpChannel}
                onChange={(event) => setOtpChannel(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                {otpChannels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                {otpLoading ? "Sending..." : "Send code"}
              </button>
              {otpSent && (
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-700"
                >
                  Verify code
                </button>
              )}
            </div>
            {otpStatus && (
              <p className="mt-3 text-[11px] text-amber-700">{otpStatus}</p>
            )}
            {otpSent && (
              <div className="mt-3">
                <input
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-lg border border-slate-200 bg-white/90 p-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-left text-xs text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
                Forgot password
              </p>
              <button
                type="button"
                onClick={() => setShowReset((prev) => !prev)}
                className="text-[10px] uppercase tracking-[0.2em] text-amber-700"
              >
                {showReset ? "Hide" : "Reset"}
              </button>
            </div>
            {showReset && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-slate-500 dark:text-white/60">
                  We will send a reset code to your chosen channel.
                </p>
                <select
                  value={resetChannel}
                  onChange={(event) => setResetChannel(event.target.value)}
                  aria-label="Reset delivery channel"
                  className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {resetChannels.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetLoading}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {resetLoading ? "Sending..." : "Send reset link"}
                </button>
                {resetStatus && (
                  <p className="text-[11px] text-amber-700">{resetStatus}</p>
                )}
                {resetSent && (
                  <div className="space-y-2">
                    <input
                      value={resetCode}
                      onChange={(event) => setResetCode(event.target.value)}
                      placeholder="Enter reset code"
                      className="w-full rounded-lg border border-slate-200 bg-white/90 p-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    />
                    <input
                      value={resetNewPassword}
                      onChange={(event) =>
                        setResetNewPassword(event.target.value)
                      }
                      placeholder="New password"
                      type="password"
                      className="w-full rounded-lg border border-slate-200 bg-white/90 p-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    />
                    <input
                      value={resetConfirmPassword}
                      onChange={(event) =>
                        setResetConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm new password"
                      type="password"
                      className="w-full rounded-lg border border-slate-200 bg-white/90 p-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleResetVerify}
                      className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-700"
                    >
                      Set new password
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <Link
            href="/signup"
            className="text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white"
          >
            Create an account
          </Link>
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
