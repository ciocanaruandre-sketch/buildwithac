import Image from "next/image";
import { Aurora } from "@/components/layout/Aurora";
import { PORTOFOLIU, type ElementPortofoliu } from "@/content/portofoliu";

const ETICHETE: Record<ElementPortofoliu["tip"], string> = {
  proiect: "Proiect",
  automatizare: "Automatizare n8n",
  concept: "Concept",
};

function Foaie({ el, mare }: { el: ElementPortofoliu; mare?: boolean }) {
  const extern = el.link?.startsWith("http");
  const continut = (
    <>
      <div className="im">
        {el.imagine && <Image src={el.imagine} alt="" fill sizes={mare ? "(max-width: 700px) 100vw, 66vw" : "(max-width: 700px) 80vw, 33vw"} />}
        <span className={`ctag ${el.tip}`}>{ETICHETE[el.tip]}</span>
        {el.dateDemo && <span className="demo">date demo</span>}
      </div>
      <div className="tx">
        <h3>{el.titlu}</h3>
        <p>{el.descriere}</p>
        {el.link && <span className="vezi">{extern ? "Deschide site-ul" : "Vezi conceptul"} <span aria-hidden>{extern ? "↗" : "→"}</span></span>}
      </div>
    </>
  );
  return (
    <article className={`it ${el.tip}${mare ? " big" : ""}`}>
      <span className="tp" aria-hidden />
      {/* <a> simplu: conceptele sunt fișiere statice, în afara aplicației */}
      {el.link ? <a className="lk" href={el.link} {...(extern && { target: "_blank", rel: "noopener" })}>{continut}</a> : continut}
    </article>
  );
}

const deTip = (tip: ElementPortofoliu["tip"]) => PORTOFOLIU.filter((el) => el.tip === tip);

/** Proiectele adevărate sus, primul mare; automatizările și conceptele pe rânduri, care pe telefon se trag cu degetul. */
export function Portofoliu() {
  return (
    <section className="port bgs" id="portofoliu">
      <Aurora />
      <div className="eb">Portofoliu</div>
      <h2>Ce am construit <span className="serif gtxt">până acum.</span></h2>
      <p className="intro">Proiecte făcute de mine și concepte pentru firme mici, ca să vezi cum ar putea arăta și al tău. Conceptele sunt marcate.</p>
      <div className="pa">
        <div className="sus">{deTip("proiect").map((el, i) => <Foaie key={el.titlu} el={el} mare={i === 0} />)}</div>
        {([["Automatizări", "automatizare"], ["Site-uri-concept", "concept"]] as const).map(([titlu, tip]) => (
          <div className="grup" key={tip}>
            <div className="grup-t hand" aria-hidden>{titlu}</div>
            {/* tabIndex: rândul se derulează și din tastatură */}
            <div className="rand" role="region" aria-label={titlu} tabIndex={0}>
              {deTip(tip).map((el) => <Foaie key={el.titlu} el={el} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
