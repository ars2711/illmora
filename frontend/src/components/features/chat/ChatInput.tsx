import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const t = useTranslations("chat");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;

    onSend(input);
    setInput("");
    textareaRef.current!.style.height = "auto"; // Reset height
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-4xl mx-auto p-4"
    >
      <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm transition-all focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-200 dark:border-white/10 dark:bg-white/5">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t("input.placeholder")}
          className="w-full max-h-40 min-h-[50px] p-2 bg-transparent resize-none border-none focus:ring-0 outline-none text-slate-800 placeholder:text-slate-400 dark:text-white/90 dark:placeholder:text-white/40"
          rows={1}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="mb-1 rounded-xl bg-slate-900 p-2 text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400 dark:text-white/40">
        {t("input.helper")}
      </p>
    </form>
  );
}
