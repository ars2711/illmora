import React from "react";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  pending?: boolean;
}

export function MessageBubble({ role, content, pending }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] rounded-2xl p-4 gap-3 border shadow-sm",
          isUser
            ? "bg-gradient-to-br from-slate-900 to-slate-700 text-white border-slate-900/60"
            : "bg-white/80 text-slate-900 border-slate-200 dark:bg-white/10 dark:text-white/90 dark:border-white/10",
          pending && "opacity-70",
        )}
      >
        {!isUser && (
          <div className="w-8 h-8 rounded-full border border-slate-200 bg-white/90 flex items-center justify-center shrink-0 dark:border-white/10 dark:bg-white/10">
            <Bot className="w-5 h-5 text-slate-700 dark:text-white/80" />
          </div>
        )}

        <div className="prose prose-sm dark:prose-invert break-words overflow-hidden">
          {/* If we want markdown rendering */}
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
