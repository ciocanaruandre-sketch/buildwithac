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
        {PORTOFOLIU.map((el, i) => {
          const continut = (
            <>
              <div className="im">
                {el.imagine && <Image src={el.imagine} alt="" fill sizes={i === 0 ? "(max-width: 700px) 100vw, 90vw" : "(max-width: 700px) 100vw, 33vw"} />}
                <span className={`ctag ${el.tip}`}>{ETICHETE[el.tip]}</span>
              </div>
              <h3>{el.titlu}</h3>
              <p>{el.descriere}</p>
            </>
          );
          return (
            <article key={el.titlu} className={`it ${el.tip}${i === 0 ? " big" : ""}`}>
              <span className="tp" aria-hidden />
              {/* <a> simplu: conceptele sunt fișiere statice, în afara aplicației */}
              {el.link ? <a className="lk" href={el.link}>{continut}</a> : continut}
            </article>
          );
        })}
      </div>
    </section>
  );
}
