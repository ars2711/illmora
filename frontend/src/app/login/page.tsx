"use client";

import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, KeyRound } from "lucide-react";
import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { credentialToJSON, normalizePublicKeyOptions } from "@/lib/passkey";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const { startDemo } = useAuth();

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/chat");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (
    provider: "google" | "github" | "apple",
  ) => {
    setProviderLoading(provider);
    setError("");
    try {
      const providerMap = {
        google: new GoogleAuthProvider(),
        github: new GithubAuthProvider(),
        apple: new OAuthProvider("apple.com"),
      };
      await signInWithPopup(auth, providerMap[provider]);
      router.push("/chat");
    } catch (err: any) {
      setError(err.message ?? "Provider login failed.");
    } finally {
      setProviderLoading(null);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email) {
      setError("Enter your email to use passkeys.");
      return;
    }
    if (!window.PublicKeyCredential) {
      setError("Passkeys are not supported in this browser.");
      return;
    }
    setProviderLoading("passkey");
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
        throw new Error("Unable to start passkey login.");
      }
      const optionsData = await optionsRes.json();
      const publicKey = normalizePublicKeyOptions(optionsData.publicKey);
      const credential = await navigator.credentials.get({ publicKey });
      if (!credential) {
        throw new Error("Passkey request canceled.");
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
        throw new Error("Passkey verification failed.");
      }
      const verifyData = await verifyRes.json();
      await signInWithCustomToken(auth, verifyData.token);
      router.push("/chat");
    } catch (err: any) {
      setError(err.message ?? "Passkey login failed.");
    } finally {
      setProviderLoading(null);
    }
  };

  return (
    <div className="ilmora-ambient min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.25),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] p-6 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
          <Sparkles size={14} /> Access
        </p>
        <h2 className="text-2xl font-bold mb-2 text-center text-slate-900 dark:text-white">
          {isLogin ? "Welcome Back" : "Join Ilmora"}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-600 dark:text-white/70">
          Secure sign-in for your memory graph and studio sessions.
        </p>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/70 p-4 text-left text-sm text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
            What opens up after login
          </p>
          <p className="mt-2">
            You are about to enter a guided learning studio: a living memory
            graph, rehearsal rituals, and AI sessions that feel more like a
            performance than a dashboard. Every page after this is designed to
            remember context and keep your momentum.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1"
            >
              Email
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white/90 p-2 outline-none focus:ring-2 focus:ring-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-2 text-white transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90 flex justify-center items-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          Or continue with
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => handleProviderLogin("google")}
            disabled={!!providerLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {providerLoading === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconBadge>
                <FaGoogle className="h-4 w-4" />
              </IconBadge>
            )}
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleProviderLogin("github")}
            disabled={!!providerLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {providerLoading === "github" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconBadge>
                <FaGithub className="h-4 w-4" />
              </IconBadge>
            )}
            Continue with GitHub
          </button>
          <button
            type="button"
            onClick={() => handleProviderLogin("apple")}
            disabled={!!providerLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {providerLoading === "apple" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconBadge>
                <FaApple className="h-4 w-4" />
              </IconBadge>
            )}
            Continue with Apple
          </button>
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={!!providerLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {providerLoading === "passkey" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconBadge>
                <KeyRound className="h-4 w-4" />
              </IconBadge>
            )}
            Use a passkey
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-700 hover:underline dark:text-white/70"
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Log In"}
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
            Explore demo
          </button>
          <p className="text-xs text-slate-500 dark:text-white/60">
            No account required. Browse with sample data.
          </p>
        </div>
      </div>
    </div>
  );
}
