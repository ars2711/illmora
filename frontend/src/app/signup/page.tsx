"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { buildApiUrl } from "@/lib/api";
import { credentialToJSON, normalizePublicKeyOptions } from "@/lib/passkey";
import { KeyRound } from "lucide-react";
import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";

const roles = [
  { id: "student", label: "Student" },
  { id: "teacher", label: "Teacher" },
  { id: "admin", label: "Admin" },
];

export default function SignupPage() {
  const router = useRouter();
  const { signInWithToken } = useAuth();
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [method, setMethod] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleRegister = async () => {
    if (!email) {
      setError("Email required.");
      return;
    }
    if (method === "email" && !password) {
      setError("Password required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/v1/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          password: method === "email" ? password : null,
          admin_code: role === "admin" ? adminCode : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Signup failed.");
      }
      const data = await res.json();
      signInWithToken(data.token);

      if (method === "passkey") {
        const optionsRes = await fetch(
          buildApiUrl("/api/v1/auth/passkeys/register/options"),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (!optionsRes.ok) {
          throw new Error("Passkey setup failed.");
        }
        const optionsData = await optionsRes.json();
        const publicKey = normalizePublicKeyOptions(optionsData.publicKey);
        const credential = await navigator.credentials.create({ publicKey });
        if (!credential) {
          throw new Error("Passkey canceled.");
        }
        const verifyRes = await fetch(
          buildApiUrl("/api/v1/auth/passkeys/register/verify"),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ credential: credentialToJSON(credential) }),
          },
        );
        if (!verifyRes.ok) {
          throw new Error("Passkey verification failed.");
        }
      }

      await redirectAfterLogin(data.token);
    } catch (err: any) {
      setError(err.message ?? "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.25),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 mx-auto max-w-md px-6 pb-16 pt-16">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
              Begin the experience
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Create your account</h1>

            {error && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {error}
              </div>
            )}

            <div className="mt-4 grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.2em] ${
                      role === r.id
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white/80 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {role === "admin" && (
                <input
                  value={adminCode}
                  onChange={(event) => setAdminCode(event.target.value)}
                  placeholder="Admin access code"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              )}
            </div>

            <div className="mt-6 grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                Signup method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.2em] ${
                    method === "email"
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white/80 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("passkey")}
                  className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.2em] ${
                    method === "passkey"
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white/80 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  Passkey
                </button>
              </div>
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
            </div>

            <div className="mt-4 grid gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              {method === "email" && (
                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {loading ? "Creating..." : "Continue"}
            </button>

            <p className="mt-4 text-xs text-slate-500 dark:text-white/60">
              Already have an account? <a href="/login">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
