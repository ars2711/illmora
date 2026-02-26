import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bot,
  User,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Layers,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  pending?: boolean;
}

export function MessageBubble({ role, content, pending }: MessageBubbleProps) {
  const isUser = role === "user";
  const [showThinking, setShowThinking] = useState(false);

  // Extract structured parts if assistant
  let thinkingContent = "";
  let conceptsContent = "";
  let mainContent = content;

  if (!isUser) {
    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      thinkingContent = thinkingMatch[1].trim();
      mainContent = content.replace(thinkingMatch[0], "");
    }

    const conceptsMatch = mainContent.match(/<concepts>([\s\S]*?)<\/concepts>/);
    if (conceptsMatch) {
      conceptsContent = conceptsMatch[1].trim();
      mainContent = mainContent.replace(conceptsMatch[0], "");
    }
  }

  // Identify concepts as a list if comma separated
  const conceptList = conceptsContent
    ? conceptsContent.split(",").map((c) => c.trim())
    : [];

  return (
    <div
      className={cn(
        "flex w-full mb-6",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* Main Bubble */}
        <div
          className={cn(
            "relative rounded-2xl p-4 shadow-sm transition-all duration-300 overflow-hidden",
            isUser
              ? "bg-gradient-to-br from-slate-900 to-slate-700 text-white border border-slate-700/50"
              : "bg-white/80 border border-slate-200/60 dark:bg-white/5 dark:border-white/10 dark:text-slate-100",
            pending && "opacity-70 animate-pulse",
          )}
        >
          {/* Avatar / Icon */}
          {!isUser && (
            <div className="absolute -left-10 top-0 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-white shadow-sm ring-1 ring-slate-900/5 dark:from-slate-800 dark:to-slate-900 dark:ring-white/10">
              <Bot className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          )}

          {isUser && (
            <div className="absolute -right-10 top-0 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10">
              <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          )}

          {/* Reasoning / Thinking Process (Collapsible) */}
          {thinkingContent && (
            <div className="mb-3 overflow-hidden rounded-lg bg-indigo-50/50 border border-indigo-100/50 dark:bg-indigo-900/20 dark:border-indigo-500/20">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BrainCircuit
                    size={14}
                    className={
                      showThinking ? "text-indigo-500" : "text-indigo-400/70"
                    }
                  />
                  <span>AI Reasoning Process</span>
                </div>
                {showThinking ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>

              {showThinking && (
                <div className="p-3 bg-white/50 dark:bg-black/20 text-xs text-slate-600 dark:text-slate-300 border-t border-indigo-100/50 dark:border-indigo-500/20 animate-in slide-in-from-top-1 fade-in duration-200">
                  {/* Render thinking content as markdown too, in case of lists */}
                  <ReactMarkdown>{thinkingContent}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Concept Map / Dependencies */}
          {conceptList.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                <Layers size={10} />
                <span>Prerequisites:</span>
              </div>
              {conceptList.map((concept, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-md bg-slate-100/80 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div
            className={cn(
              "prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed",
              isUser &&
                "text-white prose-headings:text-white prose-p:text-slate-100 prose-a:text-sky-300 prose-strong:text-white",
            )}
          >
            <ReactMarkdown>{mainContent}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
