"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { GhidCard } from "@/lib/ghiduri";
import { imagineGhid } from "@/lib/imagine";
import { Aurora } from "@/components/layout/Aurora";
import { lenis } from "@/components/layout/LenisProvider";
import { PanouGhid } from "./PanouGhid";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const scurt = (t: string, n = 74) => (t.length > n ? t.slice(0, n).trimEnd() + "…" : t);

export function SectiuneGhiduri({ ghiduri }: { ghiduri: GhidCard[] }) {
  const radacina = useRef<HTMLElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const [deschis, setDeschis] = useState<number | null>(null);
  const carduri = useRef<(HTMLButtonElement | null)[]>([]);

  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const tr = pista.current!;
      const st = gsap.to(tr, {
        x: () => -(tr.scrollWidth - innerWidth),
        ease: "none",
        scrollTrigger: { trigger: radacina.current, start: "top top", end: () => "+=" + (tr.scrollWidth - innerWidth), pin: true, scrub: 1, invalidateOnRefresh: true },
      }).scrollTrigger!;
      // cu Tab, pista nu se mișcă singură: derulăm pagina până unde animația aduce cardul în mijlocul ecranului
      const laFocus = (e: FocusEvent) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".gcard");
        // doar pentru tastatură: un click sau o atingere pe Android dau și ele focus, iar pagina n-are voie să sară
        if (!card || !card.matches(":focus-visible")) return;
        radacina.current!.scrollLeft = 0; // browserul poate împinge secțiunea ca să arate cardul
        const pozitie = card.getBoundingClientRect().left - tr.getBoundingClientRect().left;
        const parte = gsap.utils.clamp(0, 1, (pozitie + card.offsetWidth / 2 - innerWidth / 2) / (tr.scrollWidth - innerWidth));
        const y = st.start + parte * (st.end - st.start);
        if (lenis.curent) lenis.curent.scrollTo(y, { immediate: true }); else scrollTo(0, y);
      };
      tr.addEventListener("focusin", laFocus);
      return () => tr.removeEventListener("focusin", laFocus);
    });
  }, { scope: radacina });

  const inchide = useCallback(() => {
    const i = deschis;
    setDeschis(null);
    if (i !== null) carduri.current[i]?.focus();
  }, [deschis]);

  return (
    <section className="guides bgs" id="ghiduri" ref={radacina}>
      <Aurora />
      <div className="head">
        <div className="eb">Biblioteca de ghiduri</div>
        <h2>Ce ai văzut pe TikTok, <span className="serif gtxt">pas cu pas.</span></h2>
        <p>Apasă pe un ghid ca să vezi ce găsești în el.</p>
      </div>
      <div className="gtrack" ref={pista}>
        {ghiduri.map((g, i) => (
          <button
            type="button"
            key={g.slug}
            className={`gcard${i === 0 ? " nou" : ""}`}
            ref={(el) => { carduri.current[i] = el; }}
            onClick={() => setDeschis(i)}
          >
            <span className="tape" />
            <span className="ph">
              <Image src={imagineGhid(g, g.imagine)} alt="" fill sizes={i === 0 ? "380px" : "300px"} />
              <b>GHID · {g.durata.toUpperCase()}</b>
              {i === 0 && <b className="nou-et">Nou</b>}
            </span>
            <span className="t">{g.titlu}</span>
            <span className="d">{scurt(g.descriere)}</span>
            <span className="meta"><span>{g.nivel[0].toUpperCase() + g.nivel.slice(1)}</span><span>Gratuit</span></span>
          </button>
        ))}
        <Link className="gcard more" href="/ghiduri">Toate ghidurile →</Link>
      </div>
      {deschis !== null && <PanouGhid ghid={ghiduri[deschis]} onClose={inchide} />}
    </section>
  );
}
