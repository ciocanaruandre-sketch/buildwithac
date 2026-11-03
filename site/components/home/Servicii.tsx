import type { ReactNode } from "react";
import { Aurora } from "@/components/layout/Aurora";
import type { CheieServiciu } from "@/lib/contact";
import { LinkServiciu } from "./LinkServiciu";

const SERVICII: { cheie: CheieServiciu; eticheta: string; titlu: ReactNode; text: string }[] = [
  {
    cheie: "site",
    eticheta: "Site făcut de la zero",
    titlu: <>Site făcut <span className="serif gtxt">de la zero</span></>,
    text: "Ai nevoie de un site, dar nu vrei unul care seamănă cu toate celelalte. Îl construiesc de la zero, pornind de la felul în care arată și lucrează afacerea ta.",
  },
  {
    cheie: "automatizari",
    eticheta: "Automatizări pentru firma ta",
    titlu: <>Automatizări <span className="serif gtxt">pentru firma ta</span></>,
    text: "O parte din munca ta se repetă zilnic, dar n-ai avut timp să schimbi asta. Găsim împreună ce se poate face automat, iar eu construiesc restul.",
  },
  {
    cheie: "1la1",
    eticheta: "Sesiune 1 la 1 sau ghid personalizat",
    titlu: <>Sesiune 1 la 1<span className="kick gtxt">sau ghid personalizat</span></>,
    text: "Îți arăt cum să folosești AI-ul în munca ta. Live, pe ecran, sau într-un ghid scris doar pentru tine.",
  },
];

export function Servicii() {
  return (
    <section className="serv bgs" id="servicii">
      <Aurora />
      <div className="eb">Servicii</div>
      <h2>Când vrei să-l <span className="serif gtxt">facem împreună.</span></h2>
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
