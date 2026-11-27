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

// PROTOTIP (ramura `coperta`): variantele copertei, alese cu ?coperta=a|b|c
type Varianta = "a" | "b" | "c";
const VARIANTE: { v: Varianta; nume: string }[] = [
  { v: "a", nume: "A · Text jos" },
  { v: "b", nume: "B · Bilet lipit" },
  { v: "c", nume: "C · Totul pe cer" },
];

const Eticheta = () => <div className="cv-eti">Site-uri · Automatizări AI · Firme mici</div>;
const Promisiuni = () => <div className="cv-prom">Îți răspund în 1–2 zile <i>·</i> Vorbești direct cu mine</div>;
const Butoane = () => (
  <div className="cv-but">
    <a className="plin" href="#formular">Analiză gratuită</a>
    <Link href="/ghiduri">Ghiduri gratuite</Link>
  </div>
);

export function Hero() {
  const radacina = useRef<HTMLElement>(null);
  const [v, setV] = useState<Varianta>("a");
  const [comutator, setComutator] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const ales = p.get("coperta");
    if (ales === "a" || ales === "b" || ales === "c") setV(ales);
    setComutator(!p.has("fara-comutator"));
  }, []);

  const alege = (x: Varianta) => {
    setV(x);
    const u = new URL(location.href);
    u.searchParams.set("coperta", x);
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
    <section className={`px cv-${v}`} id="hero" ref={radacina}>
      <div className="px__visuals">
        <div className="px__layers">
          <div className="px__layer" data-l="2">
            <Image src="/hero/l2.webp" alt="" fill priority sizes="100vw" />
          </div>
          <div className="px__layer titlu" data-l="3">
            <div className="px__titlewrap">
              {v === "c" ? (
                <div className="px__sub cv-sus">
                  <Eticheta />
                  <p className="cv-fraza">Îți fac site-ul și automatizările, <span className="serif grad-text">ca tu să ai timp de afacere.</span></p>
                </div>
              ) : (
                <div className="px__sub"><Eticheta /></div>
              )}
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
        {v === "a" && (
          <div className="cv-jos">
            <p className="cv-fraza">Site-uri și automatizări cu AI <span className="serif grad-text">pentru firme mici.</span></p>
            <p className="cv-desc">Site de la zero, reamintiri pentru programări, răspuns la clienți în primul minut.</p>
            <Butoane />
            <Promisiuni />
          </div>
        )}
        {v === "b" && (
          <div className="cv-jos">
            <div className="cv-bilet">
              <span className="cv-banda" />
              <p className="cv-fraza">Îți fac site-ul și automatizările, ca tu să ai timp de afacere.</p>
              <p className="cv-desc">Pentru cafenele, saloane, clinici și imobiliare.</p>
              <span className="hand cv-mana">îți răspund în 1–2 zile ↘</span>
            </div>
            <Butoane />
          </div>
        )}
        {v === "c" && (
          <div className="cv-jos">
            <Butoane />
            <Promisiuni />
          </div>
        )}
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
