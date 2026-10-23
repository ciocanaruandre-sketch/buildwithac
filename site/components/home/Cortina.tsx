"use client";

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
        <Cuvinte text="Salut, sunt Andrei. Pe TikTok îți arăt în 60 de secunde ce poate face AI-ul. Aici găsești" />
        <span className="serif gtxt w">restul:</span>{" "}
        <Cuvinte text="pașii compleți, prompturile și greșelile pe care le-am făcut eu, ca să nu le faci tu." />
      </p>
      <div className="who">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="" width={52} height={52} />
        <span>Andrei · Build with AC</span>
      </div>
      <div className="note hand">tot gratuit ↓</div>
    </section>
  );
}
