import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Upload, Wifi, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

interface ChatLayoutProps {
  messages: any[];
  onSendMessage: (content: string) => void;
  isOnline: boolean;
  isProcessing?: boolean;
  demoMode?: boolean;
  isGuest?: boolean;
  onImportClick?: () => void;
}

export function ChatLayout({
  messages,
  onSendMessage,
  isOnline,
  isProcessing,
  demoMode,
  isGuest,
  onImportClick,
}: ChatLayoutProps) {
  const t = useTranslations("chat");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="ilmora-ambient flex h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.18),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.12),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise flex h-full flex-col">
        {/* Header */}
        <header className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/75 px-6 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white">
              <span className="text-lg font-semibold">I</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">
                Ilmora
                <span className="ml-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-white/50">
                  {t("header.phaseTag")}
                </span>
              </h1>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                studio session
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {demoMode && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:border-amber-200/30 dark:bg-amber-200/10 dark:text-amber-100">
                {t("header.demoBadge")}
              </span>
            )}
            {onImportClick && (
              <button
                type="button"
                onClick={onImportClick}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70"
              >
                <Upload className="h-3 w-3" />
                Import
              </button>
            )}
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                isOnline
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
              )}
            >
              {isOnline ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isOnline
                ? t("header.status.online")
                : t("header.status.offline")}
            </div>
          </div>
        </header>

        {isGuest && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-xs uppercase tracking-[0.2em] text-amber-700">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
              <span>
                Guest mode: limited memory + fewer tools. Create an account to
                unlock full sessions.
              </span>
              <Link
                href="/login"
                className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-700"
              >
                Unlock full experience
              </Link>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            {messages.length === 0 ? (
              <div className="flex h-[50vh] flex-col items-center justify-center text-center text-slate-400">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/10">
                  <span className="text-3xl">👋</span>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-slate-700 dark:text-white/80">
                  {t("empty.title")}
                </h2>
                <p className="max-w-md text-slate-500 dark:text-white/60">
                  {t("empty.body")}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id || idx}
                  role={msg.role}
                  content={msg.content}
                  pending={msg.pending}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <ChatInput onSend={onSendMessage} disabled={isProcessing} />
        </div>
      </div>
    </div>
  );
}
