import React from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Wifi, WifiOff } from "lucide-react";

interface ChatLayoutProps {
  messages: any[];
  onSendMessage: (content: string) => void;
  isOnline: boolean;
  isProcessing?: boolean;
}

export function ChatLayout({
  messages,
  onSendMessage,
  isOnline,
  isProcessing,
}: ChatLayoutProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Ilmora{" "}
          <span className="text-xs font-medium text-gray-400 ml-2 tracking-wide">
            PHASE 1 PROTO
          </span>
        </h1>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
            isOnline
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700",
          )}
        >
          {isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {isOnline ? "Online" : "Offline Mode"}
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center text-gray-400">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to Ilmora
              </h2>
              <p className="max-w-md">
                I am your AI learning companion. I can help you understand
                concepts, review topics, and track your progress.
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
      <div className="bg-white">
        <ChatInput onSend={onSendMessage} disabled={isProcessing} />
      </div>
    </div>
  );
}
