"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle({
  variant = "button",
}: {
  variant?: "button" | "icon";
}) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const resolved = theme === "system" ? systemTheme : theme;
  const isDark = resolved === "dark";

  const handleToggle = () => {
    if (isTransitioning) return;
    const nextTheme = isDark ? "light" : "dark";
    const root = document.documentElement;
    root.setAttribute("data-theme-transition", "soft");
    setIsTransitioning(true);

    const applyTheme = () => setTheme(nextTheme);

    if ("startViewTransition" in document) {
      const transition = (document as any).startViewTransition(applyTheme);
      transition.finished.finally(() => {
        root.removeAttribute("data-theme-transition");
        setIsTransitioning(false);
      });
    } else {
      applyTheme();
      window.setTimeout(() => {
        root.removeAttribute("data-theme-transition");
        setIsTransitioning(false);
      }, 420);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isTransitioning}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white disabled:opacity-70 dark:bg-white/10 dark:text-white"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isTransitioning}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-wide text-slate-900 backdrop-blur transition hover:bg-white/90 disabled:opacity-70 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isDark ? "Light" : "Dark"} mode</span>
    </button>
  );
}
