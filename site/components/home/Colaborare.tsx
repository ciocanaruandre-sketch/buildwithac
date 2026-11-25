import { Aurora } from "@/components/layout/Aurora";
import { FormularContact } from "./FormularContact";

const PROMISIUNI = ["Știi prețul înainte să încep", "Vorbești direct cu mine", "Îți răspund în 1–2 zile"];

export function Colaborare() {
  return (
    <section className="colab bgs" id="colaborare">
      <Aurora />
      {/* #formular: aici ajung linkurile din reclame, din concepte și butoanele „analiză gratuită” */}
      <div className="colab-in" id="formular">
        <div>
          <div className="eb">Colaborare</div>
          <h2 id="colab-titlu">Vrei să <span className="serif gtxt">colaborăm?</span></h2>
          <p className="intro">
            <b>Începem cu o analiză gratuită.</b> Îmi povestești cum lucrezi, iar eu îți spun ce s-ar putea automatiza și ce aș îmbunătăți la site. Dacă n-ai încă site, îmi spui cum ți-l imaginezi și pornim de acolo.
          </p>
          <ul className="promisiuni">{PROMISIUNI.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
        <FormularContact />
      </div>
    </section>
  );
}
