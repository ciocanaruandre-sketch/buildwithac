import type { Metadata } from "next";
import { SITE } from "@/lib/config";
import { Aurora } from "@/components/layout/Aurora";
import "./confidentialitate.css";

export const metadata: Metadata = {
  title: "Confidențialitate · buildwithac",
  description: "Ce date strâng pe buildwithac.ro, de ce și ce drepturi ai.",
};

// textul se actualizează când operatorul devine PFA (datele stau în lib/config.ts)
const ACTUALIZAT = "30 octombrie 2026";

export default function Confidentialitate() {
  const op = SITE.operatorDate;
  return (
    <main className="legal">
      <Aurora />
      <article>
        <div className="eb">Confidențialitate</div>
        <h1>Ce date strâng și <span className="serif gtxt">ce faci cu ele.</span></h1>
        <p className="upd">Actualizat la {ACTUALIZAT}</p>

        <p>Pe scurt: site-ul nu are conturi și nici plăți. Singura dată personală pe care o strâng este adresa ta de e-mail, și doar dacă te abonezi la newsletter.</p>

        <h2>Cine strânge datele</h2>
        <p>Operatorul datelor este {op.nume}, {op.tip}. Pentru orice întrebare despre datele tale îmi scrii la <a href={`mailto:${op.email}`}>{op.email}</a>.</p>

        <h2>Ce date și de ce</h2>
        <ul>
          <li><b>Adresa de e-mail</b>, când te abonezi. O folosesc doar ca să-ți trimit e-mailuri despre ghidurile noi și noutăți din AI. Nu promit un ritm și nu o vând nimănui.</li>
          <li><b>Date tehnice de vizită</b>: firma care găzduiește site-ul (Vercel) păstrează pentru scurt timp jurnalele tehnice ale serverului, de exemplu adresa IP, ca să livreze paginile și să le protejeze de abuzuri.</li>
          <li><b>Statistici de trafic</b>: folosesc Vercel Web Analytics, care numără vizitele fără cookie-uri și fără să te identifice.</li>
        </ul>

        <h2>Pe ce temei</h2>
        <p>Pentru newsletter, temeiul este consimțământul tău (art. 6 alin. (1) lit. a din GDPR). Îl dai când te abonezi și confirmi abonarea din e-mailul pe care îl primești. Îl poți retrage oricând, din link-ul de dezabonare din orice e-mail sau scriindu-mi. Pentru datele tehnice, temeiul este interesul legitim de a ține site-ul funcțional și sigur (art. 6 alin. (1) lit. f).</p>

        <h2>Cine mai vede datele</h2>
        <ul>
          <li><b>Kit</b> (ConvertKit, SUA), serviciul prin care trimit newsletterul. Acolo stă lista abonaților.</li>
          <li><b>Vercel</b> (SUA), care găzduiește site-ul.</li>
        </ul>
        <p>Ambele firme prelucrează datele doar la instrucțiunile mele. Pentru că sunt în SUA, transferul se face pe baza mecanismelor permise de GDPR: cadrul UE-SUA privind protecția datelor sau clauze contractuale standard.</p>

        <h2>Cât timp le păstrez</h2>
        <p>Adresa de e-mail rămâne în lista de abonați până te dezabonezi sau îmi ceri să o șterg. Dacă nu confirmi abonarea, adresa nu primește e-mailuri. Dacă nu confirmi abonarea în 30 de zile, îți șterg adresa: o dată pe lună scot din listă adresele neconfirmate mai vechi de 30 de zile.</p>

        <h2>Ce se salvează în browserul tău</h2>
        <p>Când bifezi pașii unui ghid, bifele se salvează doar în browserul tău (localStorage), ca să le găsești data viitoare. Nu ajung la mine și nu sunt folosite pentru altceva. Le ștergi din setările browserului. Site-ul nu folosește cookie-uri de reclamă sau de urmărire.</p>

        <h2>Link-uri spre alte site-uri</h2>
        <p>Link-urile spre Instagram, TikTok sau alte unelte duc pe site-urile lor, care au propriile reguli de confidențialitate.</p>

        <h2>Drepturile tale</h2>
        <p>Ai dreptul să afli ce date am despre tine, să le corectezi, să le ștergi, să restrângi sau să te opui prelucrării și să le primești într-un format portabil. Îmi scrii la <a href={`mailto:${op.email}`}>{op.email}</a> și îți răspund în cel mult o lună.</p>
        <p>Dacă crezi că datele tale nu sunt prelucrate corect, poți face plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), <a href="https://www.dataprotection.ro" target="_blank" rel="noopener">dataprotection.ro</a>.</p>

        <h2>Vârsta</h2>
        <p>Newsletterul e pentru persoane de cel puțin 16 ani.</p>

        <h2>Schimbări</h2>
        <p>Dacă schimb ceva important aici, actualizez data de sus. Dacă schimbarea te privește direct ca abonat, îți scriu.</p>
      </article>
    </main>
  );
}
