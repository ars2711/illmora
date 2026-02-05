import { useState, useEffect } from "react";
import { SyncManager } from "@/lib/offline/sync";
import { initDB } from "@/lib/offline/db";

export function useOfflineChat(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  // Load initial from IDB
  useEffect(() => {
    const loadMessages = async () => {
      const db = await initDB();
      const session = await db.get("chat-sessions", sessionId);
      if (session) {
        setMessages(session.messages);
      }
    };
    loadMessages();

    setIsOnline(navigator.onLine);
    window.addEventListener("online", () => {
      setIsOnline(true);
      SyncManager.processQueue();
    });
    window.addEventListener("offline", () => setIsOnline(false));
  }, [sessionId]);

  const sendMessage = async (content: string) => {
    const tempId = crypto.randomUUID();
    const newMessage = {
      id: tempId,
      role: "user",
      content,
      createdAt: Date.now(),
      pending: true,
    };

    // 1. Optimistic Update UI
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // 2. Save to IDB Session Storage
    const db = await initDB();
    const session = (await db.get("chat-sessions", sessionId)) || {
      id: sessionId,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      isSynced: false,
    };

    session.messages.push(newMessage);
    session.updatedAt = Date.now();
    await db.put("chat-sessions", session);

    // 3. Queue for Sync
    await SyncManager.queueMutation("SEND_MESSAGE", {
      sessionId,
      content,
      tempId,
    });
  };

  return { messages, sendMessage, isOnline };
}
