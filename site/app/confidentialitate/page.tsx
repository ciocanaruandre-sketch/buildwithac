import type { Metadata } from "next";
import { SITE } from "@/lib/config";
import { Aurora } from "@/components/layout/Aurora";
import "./confidentialitate.css";

export const metadata: Metadata = {
  title: "Confidențialitate · buildwithac",
  description: "Ce date strâng pe buildwithac.ro, de ce și ce drepturi ai.",
};

// textul se actualizează când operatorul devine PFA (datele stau în lib/config.ts)
const ACTUALIZAT = "3 noiembrie 2026";

export default function Confidentialitate() {
  const op = SITE.operatorDate;
  return (
    <main className="legal">
      <Aurora />
      <article>
        <div className="eb">Confidențialitate</div>
        <h1>Ce date strâng și <span className="serif gtxt">ce faci cu ele.</span></h1>
        <p className="upd">Actualizat la {ACTUALIZAT}</p>

        <p>Pe scurt: site-ul nu are conturi și nici plăți. Pe site strâng date personale doar în două cazuri: adresa ta de e-mail, dacă te abonezi la newsletter, și numele și telefonul tău, dacă îmi lași o cerere în formularul de contact. Dacă lucrăm împreună, îți trimit separat un formular despre afacerea ta. Mai jos scrie și ce fac cu răspunsurile de acolo.</p>

        <h2>Cine strânge datele</h2>
        <p>Operatorul datelor este {op.nume}, {op.tip}. Pentru orice întrebare despre datele tale îmi scrii la <a href={`mailto:${op.email}`}>{op.email}</a>.</p>

        <h2>Ce date și de ce</h2>
        <ul>
          <li><b>Adresa de e-mail</b>, când te abonezi. O folosesc doar ca să-ți trimit e-mailuri despre ghidurile noi și noutăți din AI. Nu promit un ritm și nu o vând nimănui.</li>
          <li><b>Cererile din formularul de contact</b> de pe pagina principală: numele, telefonul, serviciul ales și descrierea, dacă scrii una. Le folosesc doar ca să te sun despre cererea ta. Nu se salvează pe site: ajung direct în căsuța mea de e-mail.</li>
          <li><b>Răspunsurile din formularele pentru clienți</b>, dacă lucrăm împreună la un site, o automatizare sau un ghid personalizat. Formularul e făcut în Tally și îți trimit link-ul după ce ne-am înțeles. Acolo îmi scrii numele tău și al afacerii, e-mailul, telefonul, ce face afacerea ta și de ce ai nevoie. Poți încărca și fișiere: logo, poze, exemple. Le folosesc doar ca să-ți fac proiectul și să vorbim despre el. Nu pune acolo parole sau date ale clienților tăi.</li>
          <li><b>Date tehnice de vizită</b>: firma care găzduiește site-ul (Vercel) păstrează pentru scurt timp jurnalele tehnice ale serverului, de exemplu adresa IP, ca să livreze paginile și să le protejeze de abuzuri.</li>
          <li><b>Statistici de trafic</b>: folosesc Vercel Web Analytics, care numără vizitele fără cookie-uri și fără să te identifice.</li>
        </ul>

        <h2>Pe ce temei</h2>
        <p>Pentru newsletter, temeiul este consimțământul tău (art. 6 alin. (1) lit. a din GDPR). Îl dai când te abonezi și confirmi abonarea din e-mailul pe care îl primești. Îl poți retrage oricând, din link-ul de dezabonare din orice e-mail sau scriindu-mi. Pentru formularul de contact și formularele de clienți, temeiul este contractul dintre noi și pașii pe care îi facem la cererea ta înainte de el (art. 6 alin. (1) lit. b): fără numărul tău nu te pot suna, iar fără răspunsuri nu pot face proiectul. Pentru datele tehnice, temeiul este interesul legitim de a ține site-ul funcțional și sigur (art. 6 alin. (1) lit. f).</p>

        <h2>Cine mai vede datele</h2>
        <ul>
          <li><b>Kit</b> (ConvertKit, SUA), serviciul prin care trimit newsletterul. Acolo stă lista abonaților.</li>
          <li><b>Vercel</b> (SUA), care găzduiește site-ul.</li>
          <li><b>Tally</b> (Belgia), unde stau formularele pentru clienți și răspunsurile. Datele rămân pe servere din UE.</li>
          <li><b>SendGrid</b> (SUA), prin care Tally îmi trimite pe e-mail o copie a fiecărui formular completat.</li>
          <li><b>Google</b> (Gmail), unde primesc e-mailurile de la Tally, deci și copia răspunsurilor.</li>
          <li><b>Resend</b> (SUA), prin care site-ul îmi trimite pe e-mail cererile din formularul de contact. Păstrează o copie a e-mailului 30 de zile, apoi o șterge.</li>
          <li><b>Apple</b> (iCloud Mail), unde e căsuța {op.email}, în care primesc cererile din formularul de contact.</li>
        </ul>
        <p>Kit, Vercel, Tally, SendGrid și Resend prelucrează datele doar la instrucțiunile mele. Pentru firmele din SUA, transferul se face pe baza mecanismelor permise de GDPR: cadrul UE-SUA privind protecția datelor sau clauze contractuale standard.</p>

        <h2>Cât timp le păstrez</h2>
        <p>Adresa de e-mail rămâne în lista de abonați până te dezabonezi sau îmi ceri să o șterg. Dacă nu confirmi abonarea, adresa nu primește e-mailuri. Dacă nu confirmi abonarea în 30 de zile, îți șterg adresa: o dată pe lună scot din listă adresele neconfirmate mai vechi de 30 de zile.</p>
        <p>Răspunsurile din formularele pentru clienți le păstrez cât lucrăm împreună și încă un an după ultimul proiect, ca să te pot ajuta cu modificări. Dacă nu ajungem să lucrăm împreună, le șterg după 90 de zile. Le șterg de mână, din Tally și din e-mail, o dată pe lună.</p>
        <p>Cererile din formularul de contact le păstrez 90 de zile, dacă nu ajungem să lucrăm împreună. Dacă ajungem, se aplică regula de mai sus. Te sun doar despre cererea ta, nu pentru reclame. Dacă îmi spui că nu mai vrei, îți șterg cererea pe loc. Le șterg de mână, din e-mail, o dată pe lună.</p>

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
        <p>Dacă schimb ceva important aici, actualizez data de sus. Dacă schimbarea te privește direct, ca abonat sau client, îți scriu.</p>
      </article>
    </main>
  );
}
