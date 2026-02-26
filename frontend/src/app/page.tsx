"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import AmbientOrbs from "@/components/common/AmbientOrbs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Cpu,
  Download,
  Globe,
  Layers,
  Move3d,
  Music2,
  Terminal,
  PenTool,
  Beaker,
  BookOpen,
  Palette,
  Keyboard,
  Compass,
  Sparkles,
  Stars,
  ShieldCheck,
} from "lucide-react";
import ThemeToggle from "@/components/common/ThemeToggle";
import PwaInstallPrompt from "@/components/common/PwaInstallPrompt";

// Lazy-load heavy components
const FeatureShowcase = dynamic(
  () => import("@/components/features/FeatureShowcase"),
  {
    loading: () => (
      <div className="mx-auto max-w-6xl px-6 pb-16 h-32 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
    ),
    ssr: true,
  },
);

export default function Home() {
  const t = useTranslations("home");
  const { user, logOut, startDemo, demoMode } = useAuth();
  const router = useRouter();
  const [archetype, setArchetype] = useState("musician");

  useEffect(() => {
    const saved = localStorage.getItem("ilmora-archetype");
    if (saved) setArchetype(saved);
  }, []);

  const getArchetypeData = () => {
    switch (archetype) {
      case "developer":
        return { text: "Enter Console", icon: <Terminal size={16} /> };
      case "designer":
        return { text: "Enter Atelier", icon: <PenTool size={16} /> };
      case "scientist":
        return { text: "Enter Lab", icon: <Beaker size={16} /> };
      case "writer":
        return { text: "Enter Study", icon: <BookOpen size={16} /> };
      default:
        return {
          text: t("public.hero.ctaSecondary"),
          icon: <Music2 size={16} />,
        };
    }
  };

  const { text: enterText, icon: enterIcon } = getArchetypeData();

  const handleLogout = async () => {
    try {
      await logOut();
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleParallax = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
    event.currentTarget.style.setProperty("--parallax-x", `${offsetX}`);
    event.currentTarget.style.setProperty("--parallax-y", `${offsetY}`);
  };

  if (user || demoMode) {
    return (
      <main
        onMouseMove={handleParallax}
        className="ilmora-ambient min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.25),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white"
      >
        <div className="ilmora-noise">
          <AmbientOrbs />
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-900 shadow-lg dark:bg-white/10 dark:text-white">
                <span className="font-display text-lg tracking-[0.2em]">I</span>
              </div>
              <div>
                <p className="font-display text-lg tracking-[0.4em]">ILMORA</p>
                <p className="text-xs uppercase text-slate-500 dark:text-white/60">
                  {t("session.brandTag")}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <PwaInstallPrompt />
              {user && (
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-wide text-slate-900 hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {t("session.signOut")}
                </button>
              )}
            </div>
          </header>

          <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 pt-2 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                <Sparkles size={14} /> {t("session.badge")}
              </p>
              <h1 className="font-display text-4xl leading-tight sm:text-5xl">
                {t("session.titlePrefix")}
                <span className="text-transparent bg-clip-text bg-[linear-gradient(120deg,_#fbbf24,_#38bdf8,_#f8fafc)]">
                  {" "}
                  {t("session.titleHighlight")}{" "}
                </span>
                {t("session.titleSuffix")}
              </h1>
              <p className="text-lg text-slate-600 dark:text-white/70">
                {t("session.lede")}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/dashboard"
                  className="ilmora-glow inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
                >
                  {t("session.ctaPrimary")} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard/history"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm text-slate-700 hover:bg-slate-200/50 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
                >
                  {t("session.ctaSecondary")} <Clock size={16} />
                </Link>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="ilmora-grid absolute inset-0 rounded-[32px] opacity-30" />
              <div className="ilmora-scroll-accent relative w-full rounded-[32px] border border-slate-200 bg-white/70 p-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                  <div className="ilmora-constellation h-full w-full" />
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-[32px] ilmora-sheen" />
                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                      {t("session.pulses.title")}
                    </p>
                    <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-white/70">
                      {t("session.pulses.live")}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10">
                      <p className="text-sm font-medium">
                        {t("session.cards.focus.title")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {t("session.cards.focus.detail")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10">
                      <p className="text-sm font-medium">
                        {t("session.cards.ritual.title")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {t("session.cards.ritual.detail")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/10">
                      <p className="text-sm font-medium">
                        {t("session.cards.momentum.title")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {t("session.cards.momentum.detail")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">
                {t("session.quickActions.title")}
              </h2>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/chat"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {t("session.quickActions.items.chat")}{" "}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/graph"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {t("session.quickActions.items.graph")} <Move3d size={16} />
                </Link>
                <Link
                  href="/upload"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {t("session.quickActions.items.upload")}{" "}
                  <Download size={16} />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">
                {t("session.today.title")}
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-white/70">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/10">
                  {t("session.today.items.one")}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/10">
                  {t("session.today.items.two")}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/10">
                  {t("session.today.items.three")}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">
                {t("session.history.title")}
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-white/70">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/10">
                  {t("session.history.items.one")}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/10">
                  {t("session.history.items.two")}
                </div>
                <Link
                  href="/dashboard/history"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white"
                >
                  {t("session.history.cta")} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      onMouseMove={handleParallax}
      className="ilmora-ambient min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.25),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white"
    >
      {/* Internal phase milestones live in implementation docs only. */}
      <div className="ilmora-noise">
        <AmbientOrbs />
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-900 shadow-lg dark:bg-white/10 dark:text-white">
              <span className="font-display text-lg tracking-[0.2em]">I</span>
            </div>
            <div>
              <p className="font-display text-lg tracking-[0.4em]">ILMORA</p>
              <p className="text-xs uppercase text-slate-500 dark:text-white/60">
                {t("public.brandTag")}
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 dark:text-white/70 md:flex">
            <Link
              href="/chat"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              {t("public.nav.studio")}
            </Link>
            <Link
              href="/graph"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              {t("public.nav.graph")}
            </Link>
            <Link
              href="/practice"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              {t("public.nav.practice")}
            </Link>
            <Link
              href="/marketplace"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              {t("public.nav.marketplace")}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-wide text-slate-900 hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                {t("public.signOut")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    startDemo();
                    router.push("/dashboard");
                  }}
                  className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-wide text-slate-900 hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {t("public.demo")}
                </button>
                <Link
                  href="/login"
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs uppercase tracking-wide text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {t("public.signIn")}
                </Link>
              </div>
            )}
          </div>
        </header>

        <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="space-y-6"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
              <Sparkles size={14} />
              {t("public.hero.badge")}
            </p>
            <h1 className="font-display text-5xl leading-tight sm:text-6xl">
              {t("public.hero.titlePrefix")}
              <span className="text-transparent bg-clip-text bg-[linear-gradient(120deg,_#fbbf24,_#38bdf8,_#f8fafc)]">
                {" "}
                {t("public.hero.titleHighlight")}{" "}
              </span>
              {t("public.hero.titleSuffix")}
            </h1>
            <p className="text-lg text-slate-600 dark:text-white/70">
              {t("public.hero.lede")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="ilmora-glow inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
              >
                {t("public.hero.ctaPrimary")} <ArrowRight size={16} />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm text-slate-700 hover:bg-slate-200/50 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
              >
                {enterText} {enterIcon}
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/50">
              <span>{t("public.hero.tagline.one")}</span>
              <span>{t("public.hero.tagline.two")}</span>
              <span>{t("public.hero.tagline.three")}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative flex items-center justify-center"
          >
            <div className="ilmora-grid absolute inset-0 rounded-[36px] opacity-30" />
            <div className="ilmora-scroll-accent relative h-[400px] w-full max-w-[440px] rounded-[36px] border border-slate-200 bg-white/70 p-6 backdrop-blur ilmora-noise transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5 animate-[floaty_6s_ease-in-out_infinite]">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]">
                <div className="ilmora-constellation h-full w-full" />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-[36px] ilmora-sheen" />
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-b from-white/40 via-transparent to-white/30 dark:from-black/20 dark:via-transparent dark:to-black/50" />
              <div className="absolute right-6 top-6 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-white/70">
                {t("public.heroCard.badge")}
              </div>
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-xs uppercase text-slate-500 dark:text-white/50">
                    {t("public.heroCard.nowPlaying")}
                  </p>
                  <h2 className="font-display text-3xl">
                    {t("public.heroCard.title")}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-white/70">
                    {t("public.heroCard.body")}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-600 dark:text-white/60">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-4 dark:border-white/10 dark:bg-white/5">
                    <Move3d className="mx-auto mb-2" size={18} />
                    {t("public.heroCard.stats.one")}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-4 dark:border-white/10 dark:bg-white/5">
                    <Palette className="mx-auto mb-2" size={18} />
                    {t("public.heroCard.stats.two")}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-4 dark:border-white/10 dark:bg-white/5">
                    <Stars className="mx-auto mb-2" size={18} />
                    {t("public.heroCard.stats.three")}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">
              The Origin Story
            </p>
            <h3 className="mt-4 font-display text-3xl">
              A study engine born from late nights and live sessions.
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-white/70">
              Ilmora began as a private studio for deep work: a place where
              memory, ritual, and curiosity were treated like instruments. The
              idea was simple: build a system that remembers you, adapts to your
              cadence, and turns every session into a living performance of
              learning. Today, that studio is open to every discipline.
            </p>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">
              The Ritual
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-white/70">
              <li>Start in guest mode. No account required.</li>
              <li>Choose your archetype and let the interface transform.</li>
              <li>
                Build memory nodes, rehearse concepts, and sync your flow.
              </li>
              <li>Graduate into full sessions with your profile and graph.</li>
            </ul>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="ilmora-scroll-accent rounded-[32px] border border-slate-200 bg-white/70 p-8 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">
              {t("public.subjects.title")}
            </p>
            <h3 className="mt-4 font-display text-3xl">
              {t("public.subjects.headline")}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
              {t("public.subjects.body")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-white/70">
              {[
                t("public.subjects.list.math"),
                t("public.subjects.list.physics"),
                t("public.subjects.list.chemistry"),
                t("public.subjects.list.biology"),
                t("public.subjects.list.calculus"),
                t("public.subjects.list.statistics"),
                t("public.subjects.list.linearAlgebra"),
                t("public.subjects.list.discreteMath"),
                t("public.subjects.list.cs"),
                t("public.subjects.list.programming"),
                t("public.subjects.list.economics"),
                t("public.subjects.list.finance"),
                t("public.subjects.list.history"),
                t("public.subjects.list.literature"),
                t("public.subjects.list.languages"),
                t("public.subjects.list.design"),
                t("public.subjects.list.music"),
                t("public.subjects.list.medicine"),
                t("public.subjects.list.engineering"),
                t("public.subjects.list.law"),
                t("public.subjects.list.art"),
                t("public.subjects.list.psychology"),
                t("public.subjects.list.philosophy"),
                t("public.subjects.list.astronomy"),
              ].map((subject) => (
                <span
                  key={subject}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/10"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>

          <div className="ilmora-scroll-accent rounded-[32px] border border-slate-200 bg-white/70 p-8 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">
              {t("public.ai.title")}
            </p>
            <h3 className="mt-4 font-display text-3xl">
              {t("public.ai.headline")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-white/70">
              <li>{t("public.ai.items.one")}</li>
              <li>{t("public.ai.items.two")}</li>
              <li>{t("public.ai.items.three")}</li>
              <li>{t("public.ai.items.four")}</li>
              <li>{t("public.ai.items.five")}</li>
            </ul>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 lg:grid-cols-4">
          {[
            {
              icon: <Cpu size={20} />,
              title: t("public.cards.memory.title"),
              body: t("public.cards.memory.body"),
            },
            {
              icon: <ShieldCheck size={20} />,
              title: t("public.cards.ethics.title"),
              body: t("public.cards.ethics.body"),
            },
            {
              icon: <Layers size={20} />,
              title: t("public.cards.practice.title"),
              body: t("public.cards.practice.body"),
            },
            {
              icon: <Globe size={20} />,
              title: t("public.cards.offline.title"),
              body: t("public.cards.offline.body"),
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-white/70 p-6 backdrop-blur transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 dark:bg-white/10">
                {card.icon}
              </div>
              <h3 className="font-display text-xl">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                {card.body}
              </p>
            </div>
          ))}
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white/70 p-8 backdrop-blur transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">
              {t("public.experience.title")}
            </p>
            <h2 className="mt-4 font-display text-4xl">
              {t("public.experience.headline")}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-white/70">
              {t("public.experience.body")}
            </p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm text-slate-700 dark:text-white/80">
                  {t("public.experience.quotes.one.text")}
                </p>
                <p className="text-xs text-slate-500 dark:text-white/50">
                  {t("public.experience.quotes.one.label")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm text-slate-700 dark:text-white/80">
                  {t("public.experience.quotes.two.text")}
                </p>
                <p className="text-xs text-slate-500 dark:text-white/50">
                  {t("public.experience.quotes.two.label")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white/80 via-white/60 to-transparent p-8 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:from-white/10 dark:via-white/5">
              <h3 className="font-display text-2xl">
                {t("public.install.title")}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                {t("public.install.body")}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 dark:border-white/15">
                  <Download size={14} /> {t("public.install.badges.one")}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 dark:border-white/15">
                  <Move3d size={14} /> {t("public.install.badges.two")}
                </span>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white/70 p-8 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
              <h3 className="font-display text-2xl">
                {t("public.ritual.title")}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                {t("public.ritual.body")}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/50">
                <span>{t("public.ritual.tags.one")}</span>
                <span>{t("public.ritual.tags.two")}</span>
                <span>{t("public.ritual.tags.three")}</span>
              </div>
            </div>
          </div>
        </section>

        <FeatureShowcase />

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="rounded-[32px] border border-slate-200 bg-white/70 p-8 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/50">
                  {t("public.credits.title")}
                </p>
                <h3 className="font-display text-2xl text-slate-900 dark:text-white">
                  {t("public.credits.headline")}
                </h3>
                <p className="mt-2 text-sm">{t("public.credits.stack")}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-white/50">
                  {t("public.credits.byline")}{" "}
                  <Link href="https://github.com/ars2711" className="underline">
                    {t("public.credits.link")}
                  </Link>
                  .
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                <Link
                  href="/robots.txt"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  {t("public.credits.robots")}
                </Link>
                <Link
                  href="/sitemap.xml"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  {t("public.credits.sitemap")}
                </Link>
                <Link
                  href="/manifest.webmanifest"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  {t("public.credits.manifest")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
