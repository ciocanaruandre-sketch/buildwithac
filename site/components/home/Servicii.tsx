import type { ReactNode } from "react";
import { Aurora } from "@/components/layout/Aurora";
import type { CheieServiciu } from "@/lib/contact";
import { LinkServiciu } from "./LinkServiciu";

const SERVICII: { cheie: CheieServiciu; eticheta: string; titlu: ReactNode; text: string }[] = [
  {
    cheie: "crm",
    eticheta: "CRM pentru echipe de vânzări",
    titlu: <>CRM <span className="serif gtxt">pentru echipe de vânzări</span></>,
    text: "Fiecare lead intră automat. Callerii preiau lead-urile, closerii închid procesul de vânzare, iar tu analizezi toate datele și performanța echipei. De asemenea, ai integrare Meta pentru a urmări corect lead-urile provenite din reclame, dar și pentru o analiză completă a acestora.",
  },
  {
    cheie: "site",
    eticheta: "Site făcut de la zero",
    titlu: <>Site făcut <span className="serif gtxt">de la zero</span></>,
    text: "Îl fac de la zero, după firma ta. Îmi povestești ce faci și cui vinzi, îți arăt câteva variante, iar tu alegi. Optimizat pentru a funcționa eficient pe telefon.",
  },
  {
    cheie: "automatizari",
    eticheta: "Automatizări pentru firma ta",
    titlu: <>Automatizări <span className="serif gtxt">pentru firma ta</span></>,
    text: "Răspunsurile pentru clienți, programările, mesajele de follow-up și orice muncă repetitivă de zi cu zi. Le integrez astfel încât să funcționeze automat, fără intervenția ta.",
  },
  {
    cheie: "1la1",
    eticheta: "Sesiune 1 la 1 sau ghid personalizat",
    titlu: <>Sesiune 1 la 1<span className="kick gtxt">sau ghid personalizat</span></>,
    text: "Vrei să înveți să le faci singur? Îți arăt live, pe ecran, cum folosești AI-ul în munca ta, sau îți scriu un ghid doar pentru tine.",
  },
];

export function Servicii() {
  return (
    <section className="serv bgs" id="servicii">
      <Aurora />
      <div className="eb">Servicii</div>
      <h2>Cu ce îți pot fi <span className="serif gtxt">de ajutor.</span></h2>
      <p className="intro">Alegi ce ți se potrivește, în funcție de nevoile tale.</p>
      <div className="stack">
        {SERVICII.map((s, i) => (
          <div className="scard" key={s.cheie}>
            <div><div className="n">{String(i + 1).padStart(2, "0")}</div><h3>{s.titlu}</h3></div>
            <div><p>{s.text}</p><LinkServiciu cheie={s.cheie} eticheta={s.eticheta}>Hai să vorbim <span aria-hidden>→</span></LinkServiciu></div>
          </div>
        ))}
      </div>
    </section>
  );
}
