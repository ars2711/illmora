"use client";

import { useEffect, useRef } from "react";

type RefreshCallback = () => void | Promise<void>;

export default function useAutoRefresh(
  callback: RefreshCallback,
  intervalMs: number,
  enabled: boolean,
) {
  const savedCallback = useRef<RefreshCallback>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      void savedCallback.current();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
}
