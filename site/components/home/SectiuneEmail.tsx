"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FormularAbonare } from "@/components/FormularAbonare";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function SectiuneEmail() {
  const radacina = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".sticker, .paper").forEach((el, i) =>
        gsap.from(el, { y: 80, opacity: 0, rotate: i % 2 ? 3 : -3, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } }));
    });
  }, { scope: radacina });

  return (
    <section className="mail" id="email" ref={radacina}>
      <div className="sticker" aria-hidden>GHID<br />NOU?<br />AFLI<br />PRIMUL</div>
      <div className="paper">
        <div className="tape" />
        <h2>Noutățile din AI, <span>pe scurt</span>, în inbox.</h2>
        <p>Îți scriu când apare un ghid nou sau când se lansează ceva în AI care chiar contează. Doar atunci.</p>
        <FormularAbonare varianta="colaj" />
        <div className="hand">fără spam, promit</div>
      </div>
    </section>
  );
}
