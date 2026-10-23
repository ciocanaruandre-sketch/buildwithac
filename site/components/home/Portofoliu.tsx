import Image from "next/image";
import { Aurora } from "@/components/layout/Aurora";
import { PORTOFOLIU, type ElementPortofoliu } from "@/content/portofoliu";

const ETICHETE: Record<ElementPortofoliu["tip"], string> = {
  proiect: "Proiect",
  automatizare: "Automatizare n8n",
  concept: "Concept",
};

// varianta A · colaj (aleasă de Andrei): foi crem cu bandă adezivă, primul proiect pe toată lățimea;
// pe desktop, un rând pe tip: automatizările câte două, conceptele câte trei
export function Portofoliu() {
  return (
    <section className="port bgs" id="portofoliu">
      <Aurora />
      <div className="eb">Portofoliu</div>
      <h2>Ce am construit <span className="serif gtxt">cu AI.</span></h2>
      <p className="intro">Proiecte reale și concepte pentru firme mici. Conceptele sunt marcate clar.</p>
      <div className="pa">
        {PORTOFOLIU.map((el, i) => (
          <article key={el.titlu} className={`it ${el.tip}${i === 0 ? " big" : ""}${el.inCurand ? " soon" : ""}`}>
            <span className="tp" aria-hidden />
            <div className="im">
              {el.imagine && <Image src={el.imagine} alt="" fill sizes={i === 0 ? "(max-width: 700px) 100vw, 90vw" : "(max-width: 700px) 100vw, 33vw"} />}
              <span className={`ctag ${el.tip}`}>{ETICHETE[el.tip]}</span>
              {el.inCurand && <span className="cc">în curând</span>}
            </div>
            <h3>{el.titlu}</h3>
            <p>{el.descriere}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
