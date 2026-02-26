import { useState, useEffect } from "react";
import { SyncManager } from "@/lib/offline/sync";
import { initDB } from "@/lib/offline/db";

const demoResponses = [
  "Here is a draft response preview. In a full session, I can expand with sources and a study plan.",
  "Draft note saved. Try asking for a breakdown, examples, or a quick quiz.",
  "I can sketch a concept map next. Want a 3-step explanation or a practice prompt?",
];

export function useOfflineChat(sessionId: string, demoMode = false) {
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

  const sendMessage = async (content: string, mode: string = "creative") => {
    const tempId = crypto.randomUUID();
    const newMessage = {
      id: tempId,
      role: "user",
      content,
      mode, // Optimistic UI can show mode if needed
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
    if (!demoMode) {
      await SyncManager.queueMutation("SEND_MESSAGE", {
        sessionId,
        content,
        tempId,
        mode,
      });
    } else {
      const response =
        demoResponses[Math.floor(Math.random() * demoResponses.length)];
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        createdAt: Date.now(),
        pending: false,
      };
      const demoMessages = [...updatedMessages, assistantMessage];
      setTimeout(async () => {
        setMessages(demoMessages);
        session.messages.push(assistantMessage);
        session.updatedAt = Date.now();
        await db.put("chat-sessions", session);
      }, 450);
    }
  };

  const importMessages = async (incoming: any[]) => {
    if (!incoming?.length) return;
    const normalized = incoming.map((item) => ({
      id: item.id ?? crypto.randomUUID(),
      role: item.role ?? "assistant",
      content: String(item.content ?? ""),
      createdAt: item.createdAt ?? Date.now(),
      pending: false,
    }));

    const updatedMessages = [...messages, ...normalized];
    setMessages(updatedMessages);

    const db = await initDB();
    const session = (await db.get("chat-sessions", sessionId)) || {
      id: sessionId,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      isSynced: false,
    };
    session.messages = [...session.messages, ...normalized];
    session.updatedAt = Date.now();
    await db.put("chat-sessions", session);
  };

  return { messages, sendMessage, importMessages, isOnline };
}
