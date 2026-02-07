import { initDB } from "./db";
import { v4 as uuidv4 } from "uuid";
import { getStoredAuthToken } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api";

// Simple listener type for sync status changes
type SyncCallback = (isSyncing: boolean) => void;

export type Mutation = {
  id: string;
  type: "SEND_MESSAGE" | "UPDATE_TITLE" | "DELETE_SESSION";
  payload: any;
  timestamp: number;
};

export class SyncManager {
  private static isSyncing = false;
  private static listeners: SyncCallback[] = [];

  static subscribe(callback: SyncCallback) {
    this.listeners.push(callback);
    // Initial call
    callback(this.isSyncing);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private static notify() {
    this.listeners.forEach((l) => l(this.isSyncing));
  }

  static async queueMutation(
    type: Mutation["type"],
    payload: Mutation["payload"],
  ) {
    const db = await initDB();
    const mutation: Mutation = {
      id: uuidv4(),
      type,
      payload,
      timestamp: Date.now(),
    };
    await db.put("pending-mutations", mutation);

    // Attempt immediate sync if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  static async processQueue() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    this.notify(); // Notify start
    const db = await initDB();
    const pending = await db.getAll("pending-mutations");

    // Sort by timestamp to preserve order
    pending.sort((a, b) => a.timestamp - b.timestamp);

    for (const mutation of pending) {
      try {
        await this.executeMutation(mutation);
        await db.delete("pending-mutations", mutation.id);
      } catch (error: any) {
        console.error(`Failed to sync mutation ${mutation.id}`, error);

        // HARDENING: Error Handling Policy
        // If error is 4xx (Client Error), the mutation is invalid and will never succeed. Drop it.
        // If error is 5xx (Server Error) or Network (TypeError/DOMException), keep it to retry later.

        const isClientError =
          error.cause?.status >= 400 && error.cause?.status < 500;

        if (isClientError) {
          console.warn(
            `Dropping invalid mutation ${mutation.id} due to 4xx error.`,
          );
          await db.delete("pending-mutations", mutation.id);
        } else {
          // Stop processing queue to preserve order/causality for remaining items.
          break;
        }
      }
    }

    this.isSyncing = false;
    this.notify(); // Notify end
  }

  private static async executeMutation(mutation: Mutation) {
    const token = getStoredAuthToken();

    if (mutation.type === "SEND_MESSAGE") {
      const response = await fetch(buildApiUrl("/api/v1/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(mutation.payload),
      });

      if (!response.ok) {
        throw new Error(`API Sync Failed: ${response.statusText}`, {
          cause: { status: response.status },
        });
      }

      // Update local message with real server data if needed
      // (e.g. replacing tempId with server ID)
    }
  }
}
