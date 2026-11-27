"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./coperta-variante.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// intrarea titlului e în CSS (home.css), ca să pornească la prima afișare, nu după încărcarea JS-ului
// cât urcă fiecare strat la scroll (yPercent), ca în efectul Osmo
const YP: Record<number, number> = { 2: 55, 3: 40, 4: 10 };

// PROTOTIP (ramura `coperta`): varianta C, cu frazele de ales din ?fraza=1..4
type Varianta = "1" | "2" | "3" | "4";
const FRAZE: Record<Varianta, [string, string]> = {
  "1": ["Un site care nu aduce clienți, mesaje fără răspuns, clienți notați prin caiete?", "Le rezolv eu."],
  "2": ["Programări uitate, mesaje fără răspuns, clienți notați prin caiete?", "Le rezolv eu."],
  "3": ["Programări uitate, mesaje fără răspuns, clienți pierduți prin Excel?", "Le rezolv eu."],
  "4": ["Programări uitate, mesaje fără răspuns, clienți de care nu mai știi nimic?", "Le rezolv eu."],
};
const VARIANTE = (Object.keys(FRAZE) as Varianta[]).map((v) => ({ v, nume: `Fraza ${v}` }));

const Eticheta = () => <div className="cv-eti">Site-uri · Automatizări · CRM</div>;
const Butoane = () => (
  <div className="cv-but">
    <a className="plin" href="#formular">Analiză gratuită</a>
    <Link href="/ghiduri">Ghiduri gratuite</Link>
  </div>
);

export function Hero() {
  const radacina = useRef<HTMLElement>(null);
  const [v, setV] = useState<Varianta>("4");
  const [comutator, setComutator] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const ales = p.get("fraza");
    if (ales && ales in FRAZE) setV(ales as Varianta);
    setComutator(!p.has("fara-comutator"));
  }, []);

  const alege = (x: Varianta) => {
    setV(x);
    const u = new URL(location.href);
    u.searchParams.set("fraza", x);
    history.replaceState(null, "", u);
  };

  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ".px__layers", start: "0% 0%", end: "100% 0%", scrub: 0 } });
      gsap.utils.toArray<HTMLElement>(".px__layer").forEach((el, i) => {
        tl.to(el, { yPercent: YP[Number(el.dataset.l)], ease: "none" }, i ? "<" : 0);
      });
    });
  }, { scope: radacina });

  return (
    <section className="px cv-c" id="hero" ref={radacina}>
      <div className="px__visuals">
        <div className="px__layers">
          <div className="px__layer" data-l="2">
            <Image src="/hero/l2.webp" alt="" fill priority sizes="100vw" />
          </div>
          <div className="px__layer titlu" data-l="3">
            <div className="px__titlewrap">
              <div className="px__sub cv-sus">
                <Eticheta />
                <p className="cv-fraza">{FRAZE[v][0]} <span className="serif grad-text">{FRAZE[v][1]}</span></p>
                <p className="cv-eti cv-claritate">Împreună construim claritate în afacerea ta</p>
              </div>
              <h1 className="px__title">buildwithac</h1>
            </div>
          </div>
          <div className="px__layer" data-l="4">
            <Image src="/hero/l4.webp" alt="Om pe un scaun de camping, cu laptopul, în fața unui munte" fill priority sizes="100vw" />
          </div>
        </div>
        <div className="px__fade" />
      </div>
      <div className="px__header">
        <div className="cv-jos">
          <Butoane />
          <div className="cv-prom">Îți răspund în 1–2 zile <i>·</i> Vorbești direct cu mine</div>
        </div>
      </div>
      <div className="px__spacer" />
      {comutator && (
        <div className="cv-comutator" role="group" aria-label="Variantele copertei">
          {VARIANTE.map((x) => (
            <button key={x.v} type="button" aria-pressed={v === x.v} onClick={() => alege(x.v)}>{x.nume}</button>
          ))}
        </div>
      )}
    </section>
  );
}
