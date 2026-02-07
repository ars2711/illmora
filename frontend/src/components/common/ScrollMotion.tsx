"use client";

import { useEffect } from "react";

export default function ScrollMotion() {
  useEffect(() => {
    let ticking = false;

    const update = () => {
      document.documentElement.style.setProperty(
        "--scroll-y",
        `${window.scrollY}`,
      );
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
