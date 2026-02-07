"use client";

import { useEffect, useRef } from "react";

export default function AmbientOrbs() {
  const orbOne = useRef<HTMLDivElement | null>(null);
  const orbTwo = useRef<HTMLDivElement | null>(null);
  const orbThree = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animeLib: any = null;

    const load = async () => {
      const mod = await import("animejs");
      animeLib = (mod as any).default ?? (mod as any).anime ?? mod;

      if (typeof animeLib !== "function") return;

      const targets = [orbOne.current, orbTwo.current, orbThree.current].filter(
        Boolean,
      ) as HTMLDivElement[];

      if (!targets.length) return;

      animeLib({
        targets,
        translateY: [0, -18],
        direction: "alternate",
        duration: 6000,
        easing: "easeInOutSine",
        loop: true,
        delay: animeLib.stagger ? animeLib.stagger(350) : 350,
      });

      animeLib({
        targets,
        rotate: [0, 6],
        direction: "alternate",
        duration: 9000,
        easing: "easeInOutSine",
        loop: true,
        delay: animeLib.stagger ? animeLib.stagger(500) : 500,
      });
    };

    load();

    return () => {
      const targets = [orbOne.current, orbTwo.current, orbThree.current].filter(
        Boolean,
      ) as HTMLDivElement[];

      if (animeLib && targets.length) {
        // remove any running animations on the targets
        if (typeof animeLib.remove === "function") animeLib.remove(targets);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={orbOne}
        className="ilmora-orb ilmora-parallax-layer left-[10%] top-[8%] h-40 w-40"
        data-parallax="0.6"
      />
      <div
        ref={orbTwo}
        className="ilmora-orb ilmora-parallax-layer left-[70%] top-[18%] h-56 w-56"
        data-parallax="0.9"
      />
      <div
        ref={orbThree}
        className="ilmora-orb ilmora-parallax-layer left-[35%] top-[55%] h-44 w-44"
        data-parallax="0.4"
      />
    </div>
  );
}
