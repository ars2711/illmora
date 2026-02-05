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
          "flex max-w-[80%] rounded-lg p-4 gap-3",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900 border border-gray-200",
          pending && "opacity-70",
        )}
      >
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-indigo-600" />
          </div>
        )}

        <div className="prose prose-sm dark:prose-invert break-words overflow-hidden">
          {/* If we want markdown rendering */}
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
