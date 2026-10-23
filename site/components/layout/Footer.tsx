"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Aurora } from "./Aurora";
import { SITE } from "@/lib/config";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Footer() {
  const radacina = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".big", { yPercent: 60, opacity: 0, ease: "none", scrollTrigger: { trigger: radacina.current, start: "top bottom", end: "bottom bottom", scrub: true } });
    });
  }, { scope: radacina });

  return (
    <footer className="foot bgs" ref={radacina}>
      <Aurora />
      <div className="big"><span>buildwithac</span></div>
      <div className="row">
        <span>AI pe înțelesul tău, în română.</span>
        <span>
          <a href={SITE.tiktok.url} target="_blank" rel="noopener">TikTok</a> · <a href={SITE.instagram.url} target="_blank" rel="noopener">Instagram</a> · <a href={`mailto:${SITE.emailContact}`}>e-mail</a> · <Link href="/confidentialitate">Confidențialitate</Link>
        </span>
        <span>© 2026 Build with AC</span>
      </div>
    </footer>
  );
}
