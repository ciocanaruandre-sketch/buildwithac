"use client";

import { Children, isValidElement, useLayoutEffect, useRef, useState } from "react";
import { lenis } from "@/components/layout/LenisProvider";

// un prompt lung se arată pliat, cu „Vezi tot promptul”; „Copiază” copiază oricum tot
const INALTIME_PLIAT = 300; // px, la fel ca max-height din ghid.css
const CARACTERE_LUNG = 1500;

function textul(copii: React.ReactNode): string {
  return Children.toArray(copii)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : isValidElement<{ children?: React.ReactNode }>(c) ? textul(c.props.children) : ""))
    .join("");
}

export function Prompt({ children }: { children: React.ReactNode }) {
  const cutie = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLPreElement>(null);
  const [copiat, setCopiat] = useState(false);
  // pe server: după lungimea textului; în browser: după înălțimea reală
  const [lung, setLung] = useState(() => textul(children).length > CARACTERE_LUNG);
  const [deschis, setDeschis] = useState(false);

  useLayoutEffect(() => {
    const pre = text.current;
    if (pre) setLung(pre.scrollHeight > INALTIME_PLIAT * 2);
  }, [children]);

  async function copiaza() {
    try {
      await navigator.clipboard.writeText(text.current?.textContent?.trim() ?? "");
      setCopiat(true);
      setTimeout(() => setCopiat(false), 2000);
    } catch {
      // fără acces la clipboard: textul rămâne de selectat de mână
    }
  }

  function comuta() {
    if (deschis) {
      // la „Ascunde”, întoarce cititorul la începutul promptului, nu-l lasă mult mai jos
      const sus = cutie.current!.getBoundingClientRect().top;
      if (sus < 0) {
        const y = window.scrollY + sus - 100;
        if (lenis.curent) lenis.curent.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      }
    }
    setDeschis(!deschis);
  }

  const pliat = lung && !deschis;
  return (
    <div className={`prompt${pliat ? " pliat" : ""}`} ref={cutie}>
      <div className="ph"><span>Prompt</span><button type="button" onClick={copiaza} data-fara-tipar>{copiat ? "Copiat ✓" : "Copiază"}</button></div>
      <pre ref={text}>{children}</pre>
      {lung && (
        <button type="button" className="vezi-tot" onClick={comuta} aria-expanded={deschis} data-fara-tipar>
          {deschis ? "Ascunde ↑" : "Vezi tot promptul ↓"}
        </button>
      )}
    </div>
  );
}
