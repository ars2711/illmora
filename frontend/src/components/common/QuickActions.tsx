"use client";

import { ArrowUp, Globe, Menu, RotateCcw, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/common/ThemeToggle";
import PwaInstallPrompt from "@/components/common/PwaInstallPrompt";

const defaultOrder = ["theme", "install", "back", "refresh", "top", "language"];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ar", label: "Arabic" },
  { value: "ur", label: "Urdu" },
];

export default function QuickActions() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [language, setLanguage] = useState("en");
  const [isAnimating, setIsAnimating] = useState(false);

  const getCookie = (name: string) => {
    const match = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  };

  const setCookie = (name: string, value: string, days = 180) => {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  };

  useEffect(() => {
    const storedExpanded = localStorage.getItem("ilmora-controls-expanded");
    if (storedExpanded) {
      setIsExpanded(storedExpanded === "true");
    } else {
      const cookieExpanded = getCookie("ilmora-controls-expanded");
      if (cookieExpanded) setIsExpanded(cookieExpanded === "true");
    }
    const storedOrder = localStorage.getItem("ilmora-controls-order");
    if (storedOrder) {
      try {
        const parsed = JSON.parse(storedOrder) as string[];
        if (Array.isArray(parsed) && parsed.length) {
          setOrder(parsed);
        }
      } catch {
        setOrder(defaultOrder);
      }
    } else {
      const cookieOrder = getCookie("ilmora-controls-order");
      if (cookieOrder) {
        try {
          const parsed = JSON.parse(cookieOrder) as string[];
          if (Array.isArray(parsed) && parsed.length) {
            setOrder(parsed);
          }
        } catch {
          setOrder(defaultOrder);
        }
      }
    }
    const storedLanguage = localStorage.getItem("ilmora-lang");
    if (storedLanguage) {
      setLanguage(storedLanguage);
      document.documentElement.lang = storedLanguage;
    } else {
      const cookieLang = getCookie("ilmora-lang");
      if (cookieLang) {
        setLanguage(cookieLang);
        document.documentElement.lang = cookieLang;
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ilmora-controls-expanded", String(isExpanded));
    setCookie("ilmora-controls-expanded", String(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem("ilmora-controls-order", JSON.stringify(order));
    setCookie("ilmora-controls-order", JSON.stringify(order));
  }, [order]);

  useEffect(() => {
    localStorage.setItem("ilmora-lang", language);
    setCookie("ilmora-lang", language);
    document.documentElement.lang = language;
  }, [language]);

  const actions = useMemo(
    () => ({
      theme: <ThemeToggle key="theme" variant="icon" />,
      install: (
        <PwaInstallPrompt key="install" variant="icon" showUnavailable />
      ),
      back: (
        <button
          key="back"
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white"
          aria-label="Go back"
        >
          <Undo2 size={16} />
        </button>
      ),
      refresh: (
        <button
          key="refresh"
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white"
          aria-label="Refresh page"
        >
          <RotateCcw size={16} />
        </button>
      ),
      top: (
        <button
          key="top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white"
          aria-label="Scroll to top"
        >
          <ArrowUp size={16} />
        </button>
      ),
      language: (
        <div
          key="language"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white"
        >
          <Globe size={14} />
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="absolute inset-0 cursor-pointer appearance-none bg-transparent opacity-0"
            aria-label="Language"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ),
    }),
    [language],
  );

  const orderedActions = order
    .map((key) => ({ key, node: actions[key as keyof typeof actions] }))
    .filter((item) => item.node);

  const handleDragStart = (id: string) => (event: any) => {
    setDraggingId(id);
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDragOver = (id: string) => (event: any) => {
    event.preventDefault();
    if (!draggingId || draggingId === id) return;
    setOrder((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(draggingId);
      const toIndex = next.indexOf(id);
      if (fromIndex === -1 || toIndex === -1) return prev;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggingId);
      return next;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => {
          setIsExpanded((prev) => !prev);
          setIsAnimating(true);
          window.setTimeout(() => setIsAnimating(false), 700);
        }}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white ${
          isAnimating ? "animate-controls-orbit" : ""
        }`}
        aria-label={isExpanded ? "Collapse controls" : "Expand controls"}
        aria-expanded={isExpanded ? "true" : "false"}
      >
        {isExpanded ? <X size={16} /> : <Menu size={16} />}
      </button>

      <div
        className={`controls-stack flex flex-col items-end gap-2 ${
          isExpanded ? "is-expanded" : "pointer-events-none is-collapsed"
        }`}
      >
        {orderedActions.map(({ key, node }) => (
          <div
            key={key}
            draggable
            onDragStart={handleDragStart(key)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver(key)}
            className={`group relative flex items-center gap-2 ${
              draggingId === key ? "opacity-70" : "opacity-100"
            }`}
            aria-grabbed={draggingId === key ? "true" : "false"}
          >
            <span className="controls-tooltip pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border border-white/10 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 opacity-0 shadow-lg backdrop-blur transition-all duration-200 ease-out group-hover:opacity-100 group-hover:-translate-x-1 dark:bg-slate-900/90 dark:text-white">
              {key === "theme" && "Toggle theme"}
              {key === "install" && "Install app"}
              {key === "back" && "Go back"}
              {key === "refresh" && "Refresh"}
              {key === "top" && "Scroll to top"}
              {key === "language" &&
                languageOptions.find((option) => option.value === language)
                  ?.label}
            </span>
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}
