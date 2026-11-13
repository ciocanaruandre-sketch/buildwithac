"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ancoraDinHash } from "@/lib/utm";

gsap.registerPlugin(ScrollTrigger);

/** Instanța curentă, ca meniurile și ferestrele să poată opri scroll-ul de fundal. */
export const lenis: { curent?: Lenis } = {};

/**
 * Sosirea pe /#ancoră din altă pagină: browserul derulează înainte ca scenele fixate să adauge înălțime,
 * iar ScrollTrigger pune înapoi poziția veche la refresh, deci ținta ajunge mult mai jos.
 * Câteva secunde, ținta e ținută pe loc la fiecare cadru, până omul derulează singur.
 */
function ramaiLaAncora() {
  // o reclamă poate lipi parametrii după ancoră (#formular&utm_source=…)
  const ancora = ancoraDinHash(location.hash);
  const tinta = ancora ? document.getElementById(ancora) : null;
  if (!tinta) return;
  let cadru = 0;
  const pas = () => {
    tinta.scrollIntoView({ behavior: "instant" });
    cadru = requestAnimationFrame(pas);
  };
  const gata = () => {
    cancelAnimationFrame(cadru);
    clearTimeout(limita);
    removeEventListener("wheel", gata);
    removeEventListener("touchstart", gata);
    removeEventListener("keydown", gata);
  };
  const limita = setTimeout(gata, 4000);
  addEventListener("wheel", gata, { passive: true });
  addEventListener("touchstart", gata, { passive: true });
  addEventListener("keydown", gata);
  pas();
  return gata;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => ramaiLaAncora(), []);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ lerp: 0.1, anchors: true });
    lenis.curent = l;
    l.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      lenis.curent = undefined;
    };
  }, []);
  return <>{children}</>;
}
