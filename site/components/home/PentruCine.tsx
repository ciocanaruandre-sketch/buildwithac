"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Aurora } from "@/components/layout/Aurora";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const DRUMURI = [
  { img: "/home/inveti.webp", eb: "Înveți AI", titlu: "Vrei să fii cu un pas înainte.", text: "Unelte noi explicate pe înțelesul tău, cu prompturi pe care le copiezi și le folosești azi.", go: "Începe cu ghidurile de bază →" },
  { img: "/home/firma.webp", eb: "Ai o firmă", titlu: "Vrei să lucrezi mai puțin pentru același rezultat.", text: "Automatizări concrete pentru afacerea ta: răspunsuri la clienți, documente, programări.", go: "Vezi ghidurile pentru firme →" },
];

export function PentruCine() {
  const radacina = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".path").forEach((el, i) =>
        gsap.from(el, { y: 80, opacity: 0, rotate: i % 2 ? 3 : -3, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } }));
      gsap.utils.toArray<HTMLElement>(".path .bgi").forEach((el) =>
        gsap.to(el, { yPercent: -8, ease: "none", scrollTrigger: { trigger: el.parentElement, scrub: true } }));
    });
  }, { scope: radacina });

  return (
    <section className="who2 bgs" id="cine" ref={radacina}>
      <Aurora />
      <div className="eb">Pentru cine e</div>
      <h2>Două drumuri, <span className="serif gtxt">același punct de plecare.</span></h2>
      <div className="paths">
        {DRUMURI.map((d) => (
          <Link key={d.eb} href="/ghiduri" className="path">
            <span className="bgi"><Image src={d.img} alt="" fill sizes="(max-width: 700px) 100vw, 50vw" /></span>
            <span className="eb">{d.eb}</span>
            <span className="h3">{d.titlu}</span>
            <span className="p">{d.text}</span>
            <span className="go gtxt">{d.go}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
