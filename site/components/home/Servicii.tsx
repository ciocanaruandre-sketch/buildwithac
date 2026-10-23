import { Aurora } from "@/components/layout/Aurora";

// text de exemplu: serviciile le gândim separat
const SERVICII = [
  { titlu: "Automatizări pentru firma ta", text: "Text exemplu: identificăm ce se repetă în firma ta și construim automatizarea." },
  { titlu: "Ghiduri premium", text: "Text exemplu: proiecte complete, cap-coadă, cu fișiere gata de folosit." },
  { titlu: "Sesiune 1 la 1", text: "Text exemplu: o oră în care rezolvăm împreună problema ta concretă." },
];

export function Servicii() {
  return (
    <section className="serv bgs" id="servicii">
      <Aurora />
      <div className="eb">Servicii</div>
      <h2>Când vrei să-l <span className="serif gtxt">facem împreună.</span></h2>
      <div className="stack">
        {SERVICII.map((s, i) => (
          <div className="scard" key={s.titlu}>
            <div><div className="n">{String(i + 1).padStart(2, "0")}</div><h3>{s.titlu}</h3></div>
            <div><p>{s.text}</p><span className="soon">în curând</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}
