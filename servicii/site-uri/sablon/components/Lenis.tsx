"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Scroll-ul lin, legat de GSAP. Oprit pentru cine a cerut mai puțină mișcare în telefon. */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ lerp: 0.1, anchors: true });
    l.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
    };
  }, []);
  return <>{children}</>;
}
