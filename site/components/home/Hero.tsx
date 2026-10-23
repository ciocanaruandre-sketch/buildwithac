"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// cât urcă fiecare strat la scroll (yPercent), ca în efectul Osmo
const YP: Record<number, number> = { 2: 55, 3: 40, 4: 10 };

export function Hero() {
  const radacina = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ".px__layers", start: "0% 0%", end: "100% 0%", scrub: 0 } });
      gsap.utils.toArray<HTMLElement>(".px__layer").forEach((el, i) => {
        tl.to(el, { yPercent: YP[Number(el.dataset.l)], ease: "none" }, i ? "<" : 0);
      });
      gsap.from(".px__title", { yPercent: 30, opacity: 0, duration: 1.4, ease: "expo.out", delay: 0.2 });
      gsap.from(".px__sub", { y: 20, opacity: 0, duration: 1.2, ease: "expo.out", delay: 0.5 });
    });
  }, { scope: radacina });

  return (
    <section className="px" id="hero" ref={radacina}>
      <div className="px__visuals">
        <div className="px__layers">
          <div className="px__layer" data-l="2">
            <Image src="/hero/l2.webp" alt="" fill priority sizes="100vw" />
          </div>
          <div className="px__layer titlu" data-l="3">
            {/* subtitlul stă DEASUPRA titlului, pe cer, ca să nu-l acopere omul din primul plan */}
            <div className="px__titlewrap">
              <div className="px__sub">AI pe înțelesul tău, <span className="serif">în română.</span></div>
              <h1 className="px__title">buildwithac</h1>
            </div>
          </div>
          <div className="px__layer" data-l="4">
            <Image src="/hero/l4.webp" alt="Om pe un scaun de camping, cu laptopul, în fața unui munte" fill priority sizes="100vw" />
          </div>
        </div>
        <div className="px__fade" />
      </div>
      <div className="px__header"><div className="scrollcue">scroll<i /></div></div>
      <div className="px__spacer" />
    </section>
  );
}
