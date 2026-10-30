"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FormularAbonare } from "@/components/FormularAbonare";
import { lenis } from "@/components/layout/LenisProvider";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const nimic = () => () => {};

export function SectiuneEmail() {
  const radacina = useRef<HTMLElement>(null);
  // Kit trimite aici omul după ce apasă „Confirm abonarea” din e-mail (https://buildwithac.ro/?abonat=1#email);
  // citim adresa în browser, ca homepage-ul să rămână static
  const abonat = useSyncExternalStore(nimic, () => new URLSearchParams(location.search).has("abonat"), () => false);
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".sticker, .paper").forEach((el, i) =>
        gsap.from(el, { y: 80, opacity: 0, rotate: i % 2 ? 3 : -3, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } }));
    });
  }, { scope: radacina });

  // browserul sare la #email înainte ca secțiunile fixate (pin) să-și ia spațiul, deci ajunge prea sus:
  // derulăm noi, și din nou la fiecare refresh ScrollTrigger cât se așază pagina (imagini, fonturi)
  useEffect(() => {
    if (!abonat) return;
    const du = () => {
      if (lenis.curent) lenis.curent.scrollTo(radacina.current!, { immediate: true, force: true });
      else radacina.current!.scrollIntoView();
    };
    du();
    ScrollTrigger.addEventListener("refresh", du);
    const opreste = () => ScrollTrigger.removeEventListener("refresh", du);
    const t = setTimeout(opreste, 3000);
    return () => { clearTimeout(t); opreste(); };
  }, [abonat]);

  return (
    <section className="mail" id="email" ref={radacina}>
      <div className="sticker" aria-hidden>GHID<br />NOU?<br />AFLI<br />PRIMUL</div>
      <div className="paper">
        <div className="tape" />
        {abonat ? (
          <>
            <h2>Felicitări, <span className="bloc">te-ai abonat!</span></h2>
            <p>De acum îți vin pe e-mail noutățile din AI și ghidurile noi. Primul vine când apare ghidul următor.</p>
            <div className="hand">mersi că ești aici!</div>
          </>
        ) : (
          <>
            <h2>Noutățile din AI, <span>pe scurt</span>, în inbox.</h2>
            <p>Îți scriu când apare un ghid nou sau când se lansează ceva în AI care chiar contează. Doar atunci.</p>
            <FormularAbonare varianta="colaj" />
            <div className="hand">fără spam, promit</div>
          </>
        )}
      </div>
    </section>
  );
}
