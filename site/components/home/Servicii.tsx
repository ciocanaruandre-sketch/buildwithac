import type { ReactNode } from "react";
import { Aurora } from "@/components/layout/Aurora";
import type { CheieServiciu } from "@/lib/contact";
import { LinkServiciu } from "./LinkServiciu";

const SERVICII: { cheie: CheieServiciu; eticheta: string; titlu: ReactNode; text: string }[] = [
  {
    cheie: "site",
    eticheta: "Site făcut de la zero",
    titlu: <>Site făcut <span className="serif gtxt">de la zero</span></>,
    text: "Îl fac de la zero, după firma ta. Îmi povestești ce faci și cui vinzi, îți arăt câteva variante, iar tu alegi. Merge bine pe telefon, de unde intră cei mai mulți.",
  },
  {
    cheie: "automatizari",
    eticheta: "Automatizări pentru firma ta",
    titlu: <>Automatizări <span className="serif gtxt">pentru firma ta</span></>,
    text: "Răspunsurile la clienți, programările, mesajele de revenire, tot ce faci la fel în fiecare zi. Le pun să meargă singure, în aplicațiile pe care le ai deja.",
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
