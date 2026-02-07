"use client";

import React from "react";
import { useOfflineChat } from "@/hooks/use-offline-chat";
import { ChatLayout } from "@/components/features/chat/ChatLayout";
import { v4 as uuidv4 } from "uuid";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

function ChatContent() {
  // In a real app, sessionId would come from URL param or global store
  // For prototype, we generate one or persist it in localStorage
  const [sessionId, setSessionId] = React.useState<string>("");

  React.useEffect(() => {
    let stored = localStorage.getItem("current_session_id");
    if (!stored) {
      stored = uuidv4();
      localStorage.setItem("current_session_id", stored);
    }
    setSessionId(stored);
  }, []);

  const { messages, sendMessage, isOnline } = useOfflineChat(sessionId);

  return (
    <ChatLayout
      messages={messages}
      onSendMessage={sendMessage}
      isOnline={isOnline}
    />
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
        <div className="ilmora-noise relative">
          <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
          <div className="relative z-10">
            <ChatContent />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
