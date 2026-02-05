"use client";

import { useEffect, useState } from "react";
import { SyncManager } from "@/lib/offline/sync";
import { RefreshCw } from "lucide-react";

export default function SyncIndicator() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 1. Subscribe to Sync Manager status
    const unsubscribe = SyncManager.subscribe((syncing) => {
      setIsSyncing(syncing);
    });

    // 2. Subscribe to Network status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    return () => {
      unsubscribe();
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!isSyncing && isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur border rounded-full shadow-sm text-xs font-medium text-slate-600 transition-all duration-300">
      {!isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Offline Mode</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
          <span>Syncing changes...</span>
        </>
      )}
    </div>
  );
}
