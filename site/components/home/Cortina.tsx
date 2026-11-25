"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Aurora } from "@/components/layout/Aurora";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const Cuvinte = ({ text }: { text: string }) =>
  text.split(" ").map((c, i) => <span key={i}><span className="w">{c}</span> </span>);

export function Cortina() {
  const radacina = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(".manifest .w", { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".manifest", start: "top 75%", end: "bottom 45%", scrub: true } });
    });
  }, { scope: radacina });

  return (
    <section className="curtain bgs" ref={radacina}>
      <Aurora />
      <p className="manifest">
        <Cuvinte text="Salut, sunt Andrei, am 24 de ani și am terminat Mecatronica la Politehnica din București. Știu că la început de drum le faci pe toate singur. Eu îți fac site-ul și automatizările, ca tu să ai timp" />
        <span className="serif gtxt w">de clienții tăi.</span>
      </p>
      <div className="who">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="" width={52} height={52} />
        <span>Andrei · Build with AC</span>
      </div>
      <div className="cortina-but">
        <a className="plin" href="#formular">Analiză gratuită</a>
        <Link href="/ghiduri">Ghiduri gratuite</Link>
      </div>
    </section>
  );
}
