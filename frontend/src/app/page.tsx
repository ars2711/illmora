"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/common/ThemeToggle";
import PwaInstallPrompt from "@/components/common/PwaInstallPrompt";
import AmbientOrbs from "@/components/common/AmbientOrbs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Download,
  Globe,
  Layers,
  Move3d,
  Music2,
  Palette,
  ShieldCheck,
  Sparkles,
  Stars,
} from "lucide-react";

export default function Home() {
  const { user, logOut } = useAuth();
  const router = useRouter();

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
                Cognitive Engine
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 dark:text-white/70 md:flex">
            <Link
              href="/chat"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Studio
            </Link>
            <Link
              href="/graph"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Memory Graph
            </Link>
            <Link
              href="/practice"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Practice
            </Link>
            <Link
              href="/marketplace"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Marketplace
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <PwaInstallPrompt />
            {user ? (
              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-wide text-slate-900 hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-slate-900 px-4 py-2 text-xs uppercase tracking-wide text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Sign in
              </Link>
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
              Welcome to the studio
            </p>
            <h1 className="font-display text-5xl leading-tight sm:text-6xl">
              A jazz-infused
              <span className="text-transparent bg-clip-text bg-[linear-gradient(120deg,_#fbbf24,_#38bdf8,_#f8fafc)]">
                {" "}
                learning OS{" "}
              </span>
              for memory, mastery, and momentum.
            </h1>
            <p className="text-lg text-slate-600 dark:text-white/70">
              Ilmora is an ethical cognitive engine that feels like a live
              performance: adaptive, intimate, and improvisational. Build
              knowledge constellations, rehearse skills, and weave a memory map
              that remembers your story.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/onboarding"
                className="ilmora-glow inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
              >
                Begin the experience <ArrowRight size={16} />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm text-slate-700 hover:bg-slate-200/50 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
              >
                Enter studio <Music2 size={16} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/50">
              <span>Offline-first</span>
              <span>Human-centered</span>
              <span>System-aware</span>
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
                Live memory
              </div>
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-xs uppercase text-slate-500 dark:text-white/50">
                    Now playing
                  </p>
                  <h2 className="font-display text-3xl">Midnight Knowledge</h2>
                  <p className="text-sm text-slate-600 dark:text-white/70">
                    The assistant harmonizes your study beats into a living
                    memory graph. No lost context, no cold starts.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-600 dark:text-white/60">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-4 dark:border-white/10 dark:bg-white/5">
                    <Move3d className="mx-auto mb-2" size={18} />
                    3D scenes
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-4 dark:border-white/10 dark:bg-white/5">
                    <Palette className="mx-auto mb-2" size={18} />
                    Themes
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-4 dark:border-white/10 dark:bg-white/5">
                    <Stars className="mx-auto mb-2" size={18} />
                    Rituals
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="ilmora-scroll-accent rounded-[32px] border border-slate-200 bg-white/70 p-8 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/60">
              Subjects
            </p>
            <h3 className="mt-4 font-display text-3xl">
              Every discipline, one studio.
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
              Math, physics, chemistry, biology, calculus, statistics, linear
              algebra, discrete math, CS, programming, economics, finance,
              business, history, literature, languages, design, music, medicine,
              engineering, law, and more.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-white/70">
              {[
                "Math",
                "Physics",
                "Chemistry",
                "Biology",
                "Calculus",
                "Statistics",
                "Linear Algebra",
                "Discrete Math",
                "CS",
                "Programming",
                "Economics",
                "Finance",
                "History",
                "Literature",
                "Languages",
                "Design",
                "Music",
                "Medicine",
                "Engineering",
                "Law",
                "Art",
                "Psychology",
                "Philosophy",
                "Astronomy",
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
              AI Features
            </p>
            <h3 className="mt-4 font-display text-3xl">The neural toolkit.</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-white/70">
              <li>Adaptive study plans, tuned per subject and pace.</li>
              <li>Concept graph expansion with memory-safe summarization.</li>
              <li>
                Exam rehearsal mode with timed recall and Socratic prompts.
              </li>
              <li>Deep-dive explanations, proofs, and derivations.</li>
              <li>
                Cross-topic synthesis to connect ideas across disciplines.
              </li>
            </ul>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 lg:grid-cols-4">
          {[
            {
              icon: <Cpu size={20} />,
              title: "Memory Graph",
              body: "A living map of concepts, notes, and goals that grows with every session.",
            },
            {
              icon: <ShieldCheck size={20} />,
              title: "Ethical AI",
              body: "Grounded responses, privacy-respecting, transparent control over what is stored.",
            },
            {
              icon: <Layers size={20} />,
              title: "Layered Practice",
              body: "Drills, reflections, and immersive tasks that sync across devices.",
            },
            {
              icon: <Globe size={20} />,
              title: "Offline-first",
              body: "Keep studying even without signal. Syncs elegantly when you return.",
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
              The Experience
            </p>
            <h2 className="mt-4 font-display text-4xl">
              Remember like a musician.
            </h2>
            <p className="mt-4 text-slate-600 dark:text-white/70">
              Ilmora orchestrates your study ritual into a performance. Each
              note you take becomes a reusable motif in your knowledge graph.
            </p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm text-slate-700 dark:text-white/80">
                  "Turn my notes into a practice flow."
                </p>
                <p className="text-xs text-slate-500 dark:text-white/50">
                  Studio prompt
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm text-slate-700 dark:text-white/80">
                  "Rehearse concepts with a Socratic cadence."
                </p>
                <p className="text-xs text-slate-500 dark:text-white/50">
                  Learning style
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white/80 via-white/60 to-transparent p-8 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:from-white/10 dark:via-white/5">
              <h3 className="font-display text-2xl">Install everywhere</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Ilmora is PWA-ready. Pin it to your desktop or phone like a
                native app and keep your momentum offline.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 dark:border-white/15">
                  <Download size={14} /> Add to Home Screen
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 dark:border-white/15">
                  <Move3d size={14} /> Immersive UI
                </span>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white/70 p-8 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
              <h3 className="font-display text-2xl">Your custom ritual</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Switch between light and dark, adjust your focus ambience, and
                tailor the rhythm to match your study flow.
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/50">
                <span>Theme</span>
                <span>Tempo</span>
                <span>Focus</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="rounded-[32px] border border-slate-200 bg-white/70 p-8 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/50">
                  Credits
                </p>
                <h3 className="font-display text-2xl text-slate-900 dark:text-white">
                  Crafted with
                </h3>
                <p className="mt-2 text-sm">
                  Next.js, FastAPI, Firebase, Postgres + pgvector, Framer Motion
                  and a lot of late-night jazz.
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-white/50">
                  Ilmora Studio by Arsalan — building ethical learning systems
                  for the long arc of mastery. Follow the work on{" "}
                  <Link href="https://github.com/ars2711" className="underline">
                    GitHub
                  </Link>
                  .
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                <Link
                  href="/robots.txt"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Robots
                </Link>
                <Link
                  href="/sitemap.xml"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Sitemap
                </Link>
                <Link
                  href="/manifest.webmanifest"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Manifest
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
