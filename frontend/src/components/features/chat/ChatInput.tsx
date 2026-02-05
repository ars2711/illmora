import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
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
      className="relative w-full max-w-4xl mx-auto p-4 bg-white border-t border-gray-200"
    >
      <div className="relative flex items-end gap-2 p-2 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask Ilmora anything..."
          className="w-full max-h-40 min-h-[50px] p-2 bg-transparent resize-none border-none focus:ring-0 outline-none text-gray-800 placeholder:text-gray-400"
          rows={1}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="p-2 mb-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-center text-gray-400 mt-2">
        Ilmora is an AI tutor designed for learning, not cheating.
      </p>
    </form>
  );
}
