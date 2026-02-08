"use client";

import { ArrowUp, Globe, Menu, RotateCcw, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "@/components/common/ThemeToggle";
import PwaInstallPrompt from "@/components/common/PwaInstallPrompt";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n/config";

const defaultOrder = ["theme", "install", "back", "refresh", "top", "language"];

const localeOrder = ["en", "es", "fr", "hi", "ur", "ar"] as const;

export default function QuickActions() {
  const t = useTranslations("quickActions");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [language, setLanguage] = useState(locale);
  const [isVisible, setIsVisible] = useState(true);
  const [dockPosition, setDockPosition] = useState<"top" | "bottom">("bottom");

  useEffect(() => {
    setIsVisible(true);
    setDockPosition("top");
  }, [pathname]);
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
    setLanguage(locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem("ilmora-controls-expanded", String(isExpanded));
    setCookie("ilmora-controls-expanded", String(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem("ilmora-controls-order", JSON.stringify(order));
    setCookie("ilmora-controls-order", JSON.stringify(order));
  }, [order]);

  useEffect(() => {
    if (!language || language === locale) return;
    localStorage.setItem("ilmora-lang", language);
    setCookie("NEXT_LOCALE", language);
    router.refresh();
  }, [language, locale, router]);

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
          aria-label={t("back")}
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
          aria-label={t("refresh")}
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
          aria-label={t("top")}
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
            aria-label={t("language")}
          >
            {localeOrder
              .filter((option) => locales.includes(option))
              .map((option) => (
                <option key={option} value={option}>
                  {t(`languages.${option}`)}
                </option>
              ))}
          </select>
        </div>
      ),
    }),
    [language, t],
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
    <div
      ref={containerRef}
      className={`fixed right-6 z-50 flex items-start gap-2 transition-all duration-500 ease-in-out transform ${
        dockPosition === "top" ? "top-6" : "bottom-6"
      } ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-20 opacity-0 pointer-events-none"
      }`}
      style={{ flexDirection: dockPosition === "top" ? "row-reverse" : "column", alignItems: dockPosition === "top" ? "center" : "flex-end" }}
    >
      {/* Menu toggle - always rightmost in top dock */}
      <button
        type="button"
        onClick={() => {
          setIsExpanded((prev) => !prev);
          setIsAnimating(true);
          window.setTimeout(() => setIsAnimating(false), 700);
        }}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/80 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-white ${
          isAnimating ? "animate-controls-orbit" : ""
        }`}
        aria-label={isExpanded ? t("collapse") : t("expand")}
      >
        {isExpanded ? <X size={16} /> : <Menu size={16} />}
      </button>

      {/* Action items - expand LEFT from the menu button (top dock) */}
      <div
        className={`controls-stack flex gap-2 ${
          dockPosition === "top"
            ? "is-docked-top flex-row-reverse items-center"
            : "is-docked-bottom flex-col items-end"
        } ${isExpanded ? "is-expanded" : "pointer-events-none is-collapsed"}`}
      >
        {orderedActions.map(({ key, node }, idx) => (
          <div
            key={key}
            draggable
            onDragStart={handleDragStart(key)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver(key)}
            className={`controls-item group relative ${
              draggingId === key ? "opacity-70" : "opacity-100"
            }`}
            style={{
              transitionDelay: isExpanded ? `${idx * 40}ms` : `${(orderedActions.length - idx) * 25}ms`,
            }}
          >
            {node}
            <span className="controls-tooltip pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-full border border-white/10 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 opacity-0 shadow-lg backdrop-blur transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0 dark:bg-slate-900/90 dark:text-white">
              {key === "theme" && t("theme")}
              {key === "install" && t("install")}
              {key === "back" && t("back")}
              {key === "refresh" && t("refresh")}
              {key === "top" && t("top")}
              {key === "language" && t(`languages.${language}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
