"use client";

import { useEffect, useRef, useState } from "react";
import { Aurora } from "@/components/layout/Aurora";

// textele: Andrei, 2026-11-08 (prototip/banda-chat.html, chatul C4, răspunsul 4 = C, răspunsul 5 = A)
export const INTREBARI: { q: string; r: string }[] = [
  { q: "Cât costă un site?", r: "Depinde de ce îți trebuie. Vorbim la telefon, îmi spui ce vrei, iar prețul îl știi înainte să încep. Nu lucrez cu prețuri din listă." },
  { q: "Îmi trebuie cunoștințe tehnice?", r: "Nu. Îmi spui ce face afacerea ta și ce vrei să facă oamenii pe site. Partea tehnică e treaba mea." },
  { q: "Ce fel de automatizări faci?", r: "Lucrurile care se repetă: confirmări trimise clienților, comenzi trecute în tabel, aceleași mesaje în fiecare zi. Le leg de aplicațiile pe care le folosești deja. Dacă nu știi încă ce ți-ar folosi, stabilim împreună, la o consultație." },
  { q: "Cum arată o sesiune 1 la 1?", r: "Îți arăt live, pe ecran, cum folosești AI-ul în munca ta. Dacă preferi să citești în ritmul tău, îți scriu un ghid doar pentru tine, cu pașii tăi." },
  { q: "Ghidurile chiar sunt gratuite?", r: "Da, toate cele de acum. Le citești pe site, fără cont și fără card. Mai încolo apar și ghiduri premium, plătite, și o să vezi clar care sunt." },
  { q: "În cât timp îmi răspunzi?", r: "Îți scriu în 1–2 zile de când primesc formularul." },
];
/** Întrebarea deschisă de la început, ca omul să vadă cum merge. */
const DESCHISA = 1;

type Mesaj = { cine: "eu" | "el"; text: string };
const LA_INCEPUT: Mesaj[] = [{ cine: "eu", text: INTREBARI[DESCHISA].q }, { cine: "el", text: INTREBARI[DESCHISA].r }];

/** Întrebările frecvente, ca o conversație pe Instagram într-un telefon lipit pe pagină. */
export function Intrebari() {
  const [mesaje, setMesaje] = useState<Mesaj[]>(LA_INCEPUT);
  const [folosite, setFolosite] = useState<number[]>([DESCHISA]);
  const [scrie, setScrie] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const temporizator = useRef<number | undefined>(undefined);

  useEffect(() => {
    const l = lista.current;
    if (l) l.scrollTo({ top: l.scrollHeight, behavior: "smooth" });
  }, [mesaje, scrie]);
  useEffect(() => () => clearTimeout(temporizator.current), []);

  const intreaba = (i: number) => {
    if (scrie) return;
    setFolosite((f) => [...f, i]);
    setMesaje((m) => [...m, { cine: "eu", text: INTREBARI[i].q }]);
    const raspunde = () => {
      setMesaje((m) => [...m, { cine: "el", text: INTREBARI[i].r }]);
      setScrie(false);
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return raspunde();
    setScrie(true);
    temporizator.current = window.setTimeout(raspunde, 900);
  };

  const deLaCapat = () => {
    clearTimeout(temporizator.current);
    setScrie(false);
    setMesaje(LA_INCEPUT);
    setFolosite([DESCHISA]);
  };

  return (
    <section className="intr bgs" id="intrebari">
      <Aurora />
      <div>
        <div className="eb">Întrebări</div>
        <h2>Ce mă întreabă <span className="serif gtxt">toată lumea.</span></h2>
        <p className="intr-lead">Apasă pe o întrebare și îți răspund pe loc. Dacă a ta nu e aici, scrie-mi.</p>
        <a className="intr-direct" href="#formular">Scrie-mi direct <span aria-hidden>→</span></a>
      </div>
      <div className="intr-tel">
        <span className="banda-ad b1" aria-hidden />
        <span className="banda-ad b2" aria-hidden />
        <div className="ecran">
          <div className="insula" aria-hidden />
          <div className="antet">
            <span className="inapoi" aria-hidden>‹</span>
            <span className="inel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.webp" alt="" width={32} height={32} />
            </span>
            <span><b>buildwithac.ai</b><small>Andrei</small></span>
          </div>
          <div className="mesaje" ref={lista} role="log" aria-live="polite" aria-label="Conversația" data-lenis-prevent>
            {mesaje.map((m, i) => <p key={i} className={`bula ${m.cine}`}>{m.text}</p>)}
            {scrie && <p className="bula el" aria-label="Andrei scrie"><span className="puncte" aria-hidden><i /><i /><i /></span></p>}
          </div>
          <div className="camp" aria-hidden>Mesaj…</div>
        </div>
        <div className="intr-sub">
          <p className="hand">întrebările care îmi vin cel mai des ↓</p>
          <div className="alegeri">
            {INTREBARI.map((x, i) => folosite.includes(i) ? null : (
              <button key={i} type="button" onClick={() => intreaba(i)} disabled={scrie}>{x.q}</button>
            ))}
          </div>
          {folosite.length > 1 && <button type="button" className="reia" onClick={deLaCapat}>de la capăt</button>}
        </div>
      </div>
    </section>
  );
}
