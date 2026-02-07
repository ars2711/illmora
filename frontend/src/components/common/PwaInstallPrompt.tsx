"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallPrompt({
  variant = "button",
  showUnavailable = false,
}: {
  variant?: "button" | "pill" | "icon";
  showUnavailable?: boolean;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "dismissed") setDismissed(true);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || dismissed) {
    if (!showUnavailable) return null;
    if (variant === "icon") {
      return (
        <button
          type="button"
          disabled
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/60 text-slate-400 shadow-lg backdrop-blur"
          aria-label="Install app (unavailable)"
          title="Install unavailable"
        >
          <Download size={16} />
        </button>
      );
    }
    return null;
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white"
        aria-label="Install app"
      >
        <Download size={16} />
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-900 hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      >
        <Download size={14} />
        Install
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-wide text-slate-900 hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
    >
      <Download size={16} />
      Install app
    </button>
  );
}
