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
      <ChatContent />
    </ProtectedRoute>
  );
}
