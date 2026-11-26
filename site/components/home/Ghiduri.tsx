"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Aurora } from "@/components/layout/Aurora";
import { cuDe } from "@/lib/numere";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const Lacat = () => (
  <svg className="lacat" viewBox="0 0 24 24" width="26" height="26" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" fill="currentColor" stroke="none" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </svg>
);

export function Ghiduri({ numar }: { numar: number }) {
  const radacina = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".foaie-in").forEach((el, i) =>
        gsap.from(el, { y: 70, opacity: 0, rotate: i % 2 ? 3 : -3, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
    });
  }, { scope: radacina });

  return (
    <section className="ghid-home bgs" id="ghiduri" ref={radacina}>
      <Aurora />
      <div className="eb">Ghiduri</div>
      <h2>Vrei să înveți <span className="serif gtxt">singur?</span></h2>
      <div className="ghid-foi">
        <Link className="foaie" href="/ghiduri">
          <span className="foaie-in">
            <span className="tp" aria-hidden />
            {/* în dezvoltare lista are și exemple; în producție, doar ghidurile adevărate */}
            {numar > 0 && <span className="nr hand">{cuDe(numar, "ghid", "ghiduri")}</span>}
            <span className="h3">Ghiduri gratuite</span>
            <span className="p">Pas cu pas, cu prompturile gata de copiat. Fără cont și fără card.</span>
            <span className="go">Vezi ghidurile <span aria-hidden>→</span></span>
          </span>
        </Link>
        <a className="foaie premium" href="#email">
          <span className="foaie-in">
            <span className="tp" aria-hidden />
            <span className="sigiliu" aria-hidden><Lacat /></span>
            <span className="h3">Ghiduri premium</span>
            <span className="p">Mai lungi, pentru un singur lucru dus până la capăt. Lasă-mi e-mailul și te anunț când apar.</span>
            <span className="stampila">În curând</span>
          </span>
        </a>
      </div>
    </section>
  );
}
