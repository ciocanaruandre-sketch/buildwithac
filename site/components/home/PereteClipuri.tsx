"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CLIPURI } from "@/content/clipuri";
import { SITE } from "@/lib/config";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const Titlu = ({ text }: { text: string }) =>
  text.split("*").map((bucata, i) => (i % 2 ? <em key={i}>{bucata}</em> : bucata));

// 5 coloane × 4 clipuri, luate pe rând din listă
const COLOANE = [0, 1, 2, 3, 4].map((c) => [0, 1, 2, 3].map((k) => CLIPURI[(c * 2 + k) % CLIPURI.length]));

export function PereteClipuri() {
  const radacina = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".wcol").forEach((c, i) =>
        gsap.fromTo(c, { y: i % 2 ? -260 : 60 }, { y: i % 2 ? 60 : -260, ease: "none", scrollTrigger: { trigger: radacina.current, start: "top bottom", end: "bottom top", scrub: true } }));
    });
  }, { scope: radacina });

  return (
    <section className="wall" id="tiktok" ref={radacina}>
      <div className="tilt">
        {COLOANE.map((col, c) => (
          <div className="wcol" key={c}>
            {col.map((clip, k) => (
              <a key={k} className="clip" href={clip.url} target="_blank" rel="noopener" tabIndex={-1} aria-hidden>
                <Image src={clip.coperta} alt="" fill sizes="(max-width: 700px) 170px, 260px" />
                <span><Titlu text={clip.titlu} /></span>
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="over">
        <div className="eb">Pe TikTok</div>
        <h2>Clipuri scurte.<br /><span className="serif gtxt">Idei mari.</span></h2>
        <a href={SITE.tiktok.url} target="_blank" rel="noopener">Urmărește {SITE.tiktok.handle}</a>
      </div>
    </section>
  );
}
