import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Upload, Wifi, WifiOff, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";

interface ChatLayoutProps {
  messages: any[];
  onSendMessage: (content: string, mode: string) => void;
  isOnline: boolean;
  isProcessing?: boolean;
  demoMode?: boolean;
  isGuest?: boolean;
  onImportClick?: () => void;
}

const MODES = [
  { id: "creative", label: "Creative" },
  { id: "fast", label: "Fast" },
  { id: "deep", label: "Deep" },
  { id: "socratic", label: "Socratic" },
  { id: "exam", label: "Exam" },
  { id: "research", label: "Research" },
  { id: "mentor", label: "Mentor" },
];

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
  const [selectedMode, setSelectedMode] = React.useState("creative");
  const [isTtsEnabled, setIsTtsEnabled] = React.useState(false);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // TTS Effect
  React.useEffect(() => {
    if (!isTtsEnabled) {
      window.speechSynthesis.cancel();
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      !lastMessage.isStreaming
    ) {
      // Simple browser TTS
      const utterance = new SpeechSynthesisUtterance(lastMessage.content);
      // Try to select a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.name.includes("Google US English") || v.name.includes("Samantha"),
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }, [messages, isTtsEnabled]);

  const handleSend = (content: string) => {
    if (isTtsEnabled) window.speechSynthesis.cancel(); // Stop speaking when user sends new message
    onSendMessage(content, selectedMode);
  };

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

            <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/10 mx-2" />

            <label htmlFor="mode-selector" className="sr-only">Select Chat Mode</label>
            <select
              id="mode-selector"
              title="Select Chat Mode"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-transparent px-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:text-slate-300 dark:bg-white/5"
            >
              {MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
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

            <button
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                isTtsEnabled
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300",
              )}
              title={
                isTtsEnabled ? "Mute Text-to-Speech" : "Enable Text-to-Speech"
              }
            >
              {isTtsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
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
          <ChatInput onSend={handleSend} disabled={isProcessing} />
        </div>
      </div>
    </div>
  );
}
