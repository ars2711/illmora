import { openDB, DBSchema } from "idb";

interface IlmoraDB extends DBSchema {
  "chat-sessions": {
    key: string;
    value: {
      id: string;
      title: string;
      createdAt: number;
      updatedAt: number;
      messages: any[]; // Store message objects
      isSynced: boolean;
    };
    indexes: { "by-date": number };
  };
  "pending-mutations": {
    key: string;
    value: {
      id: string;
      type: "SEND_MESSAGE" | "UPDATE_TITLE" | "DELETE_SESSION";
      payload: any;
      timestamp: number;
    };
  };
}

const DB_NAME = "ilmora-db";
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<IlmoraDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("chat-sessions")) {
        const store = db.createObjectStore("chat-sessions", { keyPath: "id" });
        store.createIndex("by-date", "updatedAt");
      }
      if (!db.objectStoreNames.contains("pending-mutations")) {
        db.createObjectStore("pending-mutations", { keyPath: "id" });
      }
    },
  });
};

export const saveSessionLocally = async (session: any) => {
  const db = await initDB();
  await db.put("chat-sessions", { ...session, isSynced: false });
};

export const getLocalSessions = async () => {
  const db = await initDB();
  return db.getAllFromIndex("chat-sessions", "by-date");
};

// This function would be called by a Service Worker or a specialized hook when online
export const getPendingSyncs = async () => {
  const db = await initDB();
  return db.getAll("pending-mutations");
};
