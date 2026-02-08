"use client";

import React from "react";
import { useOfflineChat } from "@/hooks/use-offline-chat";
import { ChatLayout } from "@/components/features/chat/ChatLayout";
import { v4 as uuidv4 } from "uuid";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { parseImportedChat } from "@/lib/chat-import";
import { useToast } from "@/context/ToastContext";

function ChatContent() {
  const { user, demoMode: contextDemoMode } = useAuth();
  const { showToast } = useToast();
  const isGuest = !user;
  // If user is guest (not logged in), treat as demo mode for limited functionality
  const activeDemoMode = contextDemoMode || isGuest;

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

  const { messages, sendMessage, importMessages, isOnline } = useOfflineChat(
    sessionId,
    activeDemoMode,
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImportedChat(text);
      if (!parsed.length) {
        showToast("No messages found in that file.", "warning");
        return;
      }
      await importMessages(parsed);
      showToast(`Imported ${parsed.length} messages.`, "success");
    } catch (error) {
      console.error(error);
      showToast("Import failed. Check the file format.", "error");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <ChatLayout
        messages={messages}
        onSendMessage={sendMessage}
        isOnline={isOnline}
        demoMode={activeDemoMode}
        isGuest={isGuest}
        onImportClick={handleImportClick}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,text/plain"
        className="hidden"
        onChange={handleImportFile}
        aria-label="Import chat messages"
      />
    </>
  );
}

export default function ChatPage() {
  return (
    // Access allowed for guests (incognito)
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10">
          <ChatContent />
        </div>
      </div>
    </div>
  );
}
