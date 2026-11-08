"use client";

import { useEffect, useRef } from "react";

// varianta C3 din prototip/banda-chat.html (aleasă de Andrei, 2026-11-08): fâșie kraft sub fâșie crem, scris de mână
const MARE = ["ghiduri gratuite", "site-uri de la zero", "automatizări", "sesiuni 1 la 1", "AI pe înțeles"];
const MIC = ["pas cu pas", "cu prompturile mele", "tot gratuit", "testate de mine", "fără cont"];

function Fasie({ cls, cuvinte, sep, dir, viteza }: { cls: string; cuvinte: string[]; sep: string; dir: 1 | -1; viteza: number }) {
  // un grup e mai lat decât orice ecran; două grupuri una după alta fac bucla fără cusătură
  const grup = [...cuvinte, ...cuvinte, ...cuvinte];
  return (
    <div className={`fasie ${cls}`} data-dir={dir} data-v={viteza}>
      <div className="pista">
        {[0, 1].map((g) => (
          <div className="grup" key={g}>
            {grup.map((c, i) => <span key={i}>{c}<i>{sep}</i></span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Banda care curge între cortină și ghiduri. La scroll se grăbește și ia sensul derulării. Decorativă: textul ei e spus și în restul paginii. */
export function Banda() {
  const radacina = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rad = radacina.current!;
    const fasii = [...rad.querySelectorAll<HTMLElement>(".fasie")].map((f) => ({
      pista: f.querySelector<HTMLElement>(".pista")!,
      grup: f.querySelector<HTMLElement>(".grup")!,
      dir: Number(f.dataset.dir),
      v: Number(f.dataset.v),
      x: 0,
      w: 0,
    }));
    // lățimea se schimbă când se încarcă fontul Caveat sau se rotește telefonul
    const masoara = () => fasii.forEach((f) => (f.w = f.grup.offsetWidth));
    masoara();
    const ro = new ResizeObserver(masoara);
    fasii.forEach((f) => ro.observe(f.grup));

    let cadru = 0, inainte = 0, ultimY = scrollY, avant = 0, sens = 1;
    const laScroll = () => {
      const d = scrollY - ultimY;
      ultimY = scrollY;
      if (d) sens = Math.sign(d);
      avant = Math.min(avant + Math.abs(d) * 0.12, 14);
    };
    const bucla = (t: number) => {
      // viteza nu depinde de rata ecranului (60 sau 120 de cadre pe secundă)
      const k = inainte ? Math.min((t - inainte) / 16.67, 3) : 1;
      inainte = t;
      avant *= Math.pow(0.92, k);
      for (const f of fasii) {
        if (!f.w) continue;
        f.x -= (f.v + avant) * f.dir * sens * k;
        if (f.x <= -f.w) f.x += f.w;
        if (f.x > 0) f.x -= f.w;
        f.pista.style.transform = `translate3d(${f.x}px,0,0)`;
      }
      cadru = requestAnimationFrame(bucla);
    };
    // bucla merge doar cât banda e lângă ecran
    const io = new IntersectionObserver(([i]) => {
      cancelAnimationFrame(cadru);
      inainte = 0;
      if (i.isIntersecting) { ultimY = scrollY; cadru = requestAnimationFrame(bucla); }
    }, { rootMargin: "100px 0px" });
    io.observe(rad);
    addEventListener("scroll", laScroll, { passive: true });
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(cadru);
      removeEventListener("scroll", laScroll);
    };
  }, []);

  return (
    <div className="banda" aria-hidden>
      <div className="banda-in" ref={radacina}>
        <Fasie cls="kraft" cuvinte={MIC} sep="·" dir={1} viteza={0.4} />
        <Fasie cls="crem" cuvinte={MARE} sep="✶" dir={-1} viteza={0.55} />
      </div>
    </div>
  );
}
