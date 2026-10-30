"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SITE } from "@/lib/config";
import { lenis } from "@/components/layout/LenisProvider";
import { useCapcanaFocus } from "@/lib/capcana-focus";

/** PDF-ul se ia doar prin Instagram: urmărești, scrii cuvântul în privat, primești link-ul. */
export function CasetaPdf({ titlu, cuvant }: { titlu: string; cuvant: string }) {
  const [deschis, setDeschis] = useState(false);
  const [copiat, setCopiat] = useState(false);
  const buton = useRef<HTMLButtonElement>(null);
  const fereastra = useRef<HTMLDivElement>(null);
  useCapcanaFocus(fereastra, deschis);

  useEffect(() => {
    if (!deschis) return;
    fereastra.current?.querySelector<HTMLElement>(".x")?.focus();
    lenis.curent?.stop();
    const tasta = (e: KeyboardEvent) => e.key === "Escape" && setDeschis(false);
    document.addEventListener("keydown", tasta);
    const declansator = buton.current;
    return () => { document.removeEventListener("keydown", tasta); lenis.curent?.start(); declansator?.focus(); };
  }, [deschis]);

  async function copiaza() {
    try { await navigator.clipboard.writeText(cuvant); setCopiat(true); } catch { /* se scrie de mână */ }
  }

  return (
    <section className="pdf" id="pdf" data-fara-tipar>
      <div className="in">
        <div className="hand note" aria-hidden>bonus ↓</div>
        <div className="doc" aria-hidden>
          <div className="tp" />
          <div className="eb">ghid · buildwithac</div>
          <b>{titlu}</b>
          {Array.from({ length: 7 }, (_, i) => <span key={i} />)}
        </div>
        <div>
          <div className="eb">Gratuit</div>
          <h3>Ghidul complet, în PDF</h3>
          <p>Urmărește-mă pe Instagram și scrie-mi <span className="kw">{cuvant}</span> în privat. Îți trimit PDF-ul.</p>
          <button type="button" className="b1" ref={buton} onClick={() => setDeschis(true)}>Primește-l pe Instagram</button>
          <div className="small">Durează 30 de secunde. Link-ul ți-l trimit eu, de obicei în aceeași zi.</div>
        </div>
      </div>
      {deschis && createPortal(
        <div className="mdl" onClick={(e) => e.target === e.currentTarget && setDeschis(false)}>
          <div className="mbox" ref={fereastra} role="dialog" aria-modal="true" aria-labelledby="pdf-titlu" data-lenis-prevent>
            <button type="button" className="x" aria-label="Închide" onClick={() => setDeschis(false)}>✕</button>
            <div className="eb">Ghidul complet în PDF</div>
            <h3 id="pdf-titlu">Îl primești pe Instagram</h3>
            <ol className="msteps">
              <li><span><b>Urmărește</b> {SITE.instagram.handle}</span></li>
              <li><span>Trimite-mi în privat <span className="kw">{cuvant}</span></span><button type="button" onClick={copiaza}>{copiat ? "Copiat ✓" : "Copiază"}</button></li>
              <li><span>Îți trimit link-ul la PDF</span></li>
            </ol>
            <a className="ig" href={SITE.instagram.url} target="_blank" rel="noopener">Deschide Instagram ↗</a>
            <div className="small">Pe telefon se deschide aplicația, direct pe profilul meu.</div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
