"use client";

import { useEffect, useRef } from "react";

// varianta C3 din prototip/banda-chat.html (aleasă de Andrei, 2026-11-08): fâșie kraft sub fâșie crem, scris de mână
const MARE = ["ghiduri gratuite", "site-uri de la zero", "automatizări", "sesiuni 1 la 1", "AI pe înțeles"];
const TURE = 10000;
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
    // Mersul de bază e o animație a browserului (Web Animations), nu un calcul la fiecare cadru:
    // așa o duce placa video și nu se sacadează cât telefonul încă încarcă pagina.
    // JavaScript schimbă doar viteza, când omul derulează.
    const fasii = [...rad.querySelectorAll<HTMLElement>(".fasie")].map((f) => ({
      pista: f.querySelector<HTMLElement>(".pista")!,
      grup: f.querySelector<HTMLElement>(".grup")!,
      dir: Number(f.dataset.dir),
      v: Number(f.dataset.v), // pixeli pe cadru, la 60 de cadre pe secundă
      w: 0,
      anim: undefined as Animation | undefined,
    }));

    let sens = 1, avant = 0;
    const rata = (f: (typeof fasii)[number]) => (sens * (f.v + avant)) / f.v;

    // lățimea se schimbă când se încarcă fontul Caveat sau se rotește telefonul
    const masoara = () =>
      fasii.forEach((f) => {
        const w = f.grup.offsetWidth;
        if (!w || w === f.w) return;
        const parcurs = f.anim ? Number(f.anim.currentTime ?? 0) / Number(f.anim.effect!.getTiming().duration) : 0;
        f.anim?.cancel();
        f.w = w;
        const dus = f.dir === 1 ? [0, -w] : [-w, 0];
        f.anim = f.pista.animate(
          [{ transform: `translate3d(${dus[0]}px,0,0)` }, { transform: `translate3d(${dus[1]}px,0,0)` }],
          { duration: (w / (f.v * 60)) * 1000, iterations: Infinity, easing: "linear" },
        );
        // pornește de la mii de ture: în sens invers (rată negativă) o animație fără sfârșit se oprește la zero
        f.anim.currentTime = (TURE + (parcurs % 1)) * (w / (f.v * 60)) * 1000;
        f.anim.playbackRate = rata(f);
        if (!vizibila) f.anim.pause();
      });
    let vizibila = false;
    masoara();
    const ro = new ResizeObserver(masoara);
    fasii.forEach((f) => ro.observe(f.grup));

    // la scroll banda se grăbește și ia sensul derulării, apoi încetinește la loc
    let cadru = 0, inainte = 0, ultimY = scrollY;
    const incetineste = (t: number) => {
      const k = inainte ? Math.min((t - inainte) / 16.67, 3) : 1;
      inainte = t;
      avant *= Math.pow(0.92, k);
      if (avant < 0.02) avant = 0;
      fasii.forEach((f) => f.anim?.updatePlaybackRate(rata(f)));
      cadru = avant ? requestAnimationFrame(incetineste) : 0;
      if (!cadru) inainte = 0;
    };
    const laScroll = () => {
      const d = scrollY - ultimY;
      ultimY = scrollY;
      if (!vizibila || !d) return;
      sens = Math.sign(d);
      avant = Math.min(avant + Math.abs(d) * 0.12, 14);
      if (!cadru) cadru = requestAnimationFrame(incetineste);
    };

    // banda merge doar cât e lângă ecran
    const io = new IntersectionObserver(([i]) => {
      vizibila = i.isIntersecting;
      ultimY = scrollY;
      fasii.forEach((f) => (vizibila ? f.anim?.play() : f.anim?.pause()));
    }, { rootMargin: "100px 0px" });
    io.observe(rad);
    addEventListener("scroll", laScroll, { passive: true });
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(cadru);
      removeEventListener("scroll", laScroll);
      fasii.forEach((f) => f.anim?.cancel());
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
