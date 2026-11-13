// Firma demo: datele, ca funcții pure (fără Supabase, fără Date.now()). Le scrie `scripts/demo.mts`.
// Totul e inventat: nume, firme, telefoane variate (în clipuri, doar blurate), link-uri spre domenii de exemplu.
import type { ContTest } from "../../lib/echipa-test";
import type { AlegerePlan } from "../../lib/finante";
import type { Serviciu, Stadiu, Stare, StareLivrare, Sursa, UndeParola } from "../../lib/tipuri";

export type Optiuni = { acum: Date; singur: boolean };

export type EvenimentDemo = { tip: string; autor?: ContTest; acumZile: number; detalii?: Record<string, unknown> };

export type LeadDemo = {
  nr: number;
  nume: string;
  serviciu: Serviciu;
  sursa: Sursa;
  stare: Stare;
  /** Câte zile au trecut de la intrare (cu zecimale: ora din zi). */
  acumZile: number;
  caller?: ContTest;
  closer?: ContTest;
  motiv?: string;
  callbackPesteOre?: number;
  incercari?: number;
  raspunsuri?: { intrebare: string; raspuns: string }[];
  utm?: Record<string, string>;
  /** Indexul din `RECLAME_DEMO`, pentru lead-urile venite dintr-o reclamă. */
  reclama?: number;
  notite: { autor: ContTest; acumZile: number; text: string }[];
  /**
   * Parcursul, de la cel mai vechi la cel mai nou. În `detalii`, oamenii sunt chei de cont (ContTest):
   * scriitorul le traduce în id-uri; la „programat” și „callback”, ora vine din discuție / `callbackPesteOre`.
   */
  parcurs: EvenimentDemo[];
};

/** Prefixe reale de mobil din România. Numerele demo par reale, de-asta în clipuri se văd doar blurate (modul filmare). */
export const PREFIXE_MOBIL = ["0721", "0722", "0723", "0724", "0726", "0730", "0731", "0740", "0742", "0744", "0745", "0746", "0747", "0748", "0749", "0751", "0752", "0753", "0754", "0755", "0756", "0757", "0758", "0760", "0761", "0762", "0763", "0764", "0765", "0766", "0767", "0768", "0769"];

/** „0745 318 902”: același `nr` dă mereu același număr, ca pozele și clipurile să se poată reface. */
export const telefonDemo = (nr: number) => {
  const prefix = PREFIXE_MOBIL[(nr * 7) % PREFIXE_MOBIL.length];
  const rest = String((nr * 7919 + 104729) % 1_000_000).padStart(6, "0");
  return `${prefix} ${rest.slice(0, 3)} ${rest.slice(3)}`;
};
/** Forma normalizată („40745318902”), aceeași pe care o face `normalizeazaTelefon`. */
export const telefonNormDemo = (nr: number) => `40${telefonDemo(nr).replace(/\s/g, "").slice(1)}`;

/** Sursele pe care le adaugă cineva de mână (restul vin singure). */
const DE_MANA: Sursa[] = ["recomandare", "cold_calling", "dm_instagram", "dm_tiktok", "altceva"];

const MARA: ContTest = "caller";
const VLAD: ContTest = "caller2";
const IOANA: ContTest = "closer";

// ---------------------------------------------------------------------------------------------
// Lead-urile, scrise de mână. `zile` = cu câte zile în urmă a intrat; notițele sunt în ordinea în care s-au scris.

type Rand = {
  nr: number;
  nume: string;
  serviciu: Serviciu;
  sursa: Sursa;
  stare: Stare;
  zile: number;
  caller?: ContTest;
  motiv?: string;
  cb?: number;
  incercari?: number;
  /** Ce a scris omul: „Descriere” pe site, cele trei întrebări la reclame. */
  afacere?: string;
  vrea?: string;
  buget?: string;
  descriere?: string;
  /** Pentru cold calling: de unde e numărul. */
  numar?: string;
  note?: [ContTest, string][];
};

const RANDURI: Rand[] = [
  // ——— nou: au intrat, încă nu i-a sunat nimeni
  { nr: 1, nume: "Corina Sandu · Cofetăria Miere", serviciu: "site", sursa: "formular_site", stare: "nou", zile: 1.2, descriere: "Am o cofetărie mică și vreau să primesc comenzi de torturi online, cu poze și prețuri." },
  { nr: 2, nume: "Paul Neagu · Frizeria Brici", serviciu: "automatizari", sursa: "reclama_meta", stare: "nou", zile: 1.4, afacere: "Frizerie, 3 scaune", vrea: "Programările de pe Instagram să intre singure în calendar.", buget: "500–1.000 €" },
  { nr: 3, nume: "Irina Bucur", serviciu: "1la1", sursa: "reclama_tiktok", stare: "nou", zile: 1.6, afacere: "Fac machiaj la evenimente", vrea: "Să învăț să folosesc ChatGPT pentru postări.", buget: "Sub 500 €" },
  { nr: 4, nume: "Adrian Moldovan · Moldovan Construct", serviciu: "site", sursa: "reclama_meta", stare: "nou", zile: 2.3, afacere: "Firmă de renovări", vrea: "Un site cu lucrările făcute, să nu mai trimit poze pe WhatsApp.", buget: "1.000–2.000 €" },
  { nr: 5, nume: "Simona Dragomir · Yoga Acasă", serviciu: "site", sursa: "formular_site", stare: "nou", zile: 2.8, descriere: "Țin cursuri de yoga online și vreau o pagină unde oamenii se înscriu și plătesc." },
  { nr: 6, nume: "Marius Oprea · Pensiunea Brazilor", serviciu: "automatizari", sursa: "reclama_tiktok", stare: "nou", zile: 3.1, afacere: "Pensiune la munte, 8 camere", vrea: "Să răspund automat la întrebările repetitive despre camere și prețuri.", buget: "500–1.000 €" },
  { nr: 7, nume: "Larisa Constantin · Clinica Dentară Smile Line", serviciu: "automatizari", sursa: "reclama_meta", stare: "nou", zile: 3.5, afacere: "Clinică stomatologică", vrea: "Reamintiri pe SMS înainte de programare, oamenii uită să vină.", buget: "1.000–2.000 €" },
  { nr: 8, nume: "Cosmin Barbu", serviciu: "altceva", sursa: "dm_instagram", stare: "nou", zile: 4.2, note: [["admin", "Mi-a scris pe Instagram după clipul cu agentul de programări. Vrea ceva asemănător pentru sala lui de fitness."]] },
  { nr: 9, nume: "Gabriela Munteanu · Atelier Croitorie", serviciu: "site", sursa: "formular_site", stare: "nou", zile: 5.1, caller: VLAD, descriere: "Fac haine la comandă. Vreau un site simplu, cu ce fac și cum mă găsesc." },
  { nr: 10, nume: "Ovidiu Pavel · Agenția Casa Ta", serviciu: "automatizari", sursa: "reclama_meta", stare: "nou", zile: 5.6, caller: MARA, afacere: "Agenție imobiliară, 4 agenți", vrea: "Lead-urile de pe portaluri să ajungă la agentul liber, nu în e-mailul meu.", buget: "2.000–5.000 €" },

  // ——— fara_raspuns: sunați o dată sau de mai multe ori, n-au răspuns
  { nr: 11, nume: "Valentina Ciobanu · Salon Bella", serviciu: "automatizari", sursa: "reclama_tiktok", stare: "fara_raspuns", zile: 2.4, caller: MARA, incercari: 1, afacere: "Salon de înfrumusețare", vrea: "Mai puține telefoane pentru programări.", buget: "500–1.000 €" },
  { nr: 12, nume: "Lucian Stan · Service Moto LS", serviciu: "site", sursa: "reclama_meta", stare: "fara_raspuns", zile: 4.3, caller: MARA, incercari: 2, afacere: "Service de motociclete", vrea: "Să apar pe Google când caută cineva service moto.", buget: "Sub 500 €", note: [[MARA, "A doua oară a intrat căsuța vocală. Încerc mâine după 17, zice în anunț că lucrează până atunci."]] },
  { nr: 13, nume: "Daniela Rusu", serviciu: "1la1", sursa: "formular_site", stare: "fara_raspuns", zile: 6.2, caller: VLAD, incercari: 3, descriere: "Vreau să învăț să-mi fac singură automatizări pentru magazinul online.", note: [[VLAD, "Trei încercări, la ore diferite. I-am lăsat un mesaj pe WhatsApp cu numele meu."]] },
  { nr: 14, nume: "Emil Tănase · Tâmplăria Stejar", serviciu: "site", sursa: "cold_calling", stare: "fara_raspuns", zile: 7.4, caller: VLAD, incercari: 2, numar: "Google Maps, profilul firmei" },
  { nr: 15, nume: "Roxana Iordache · Studio Foto Lumen", serviciu: "site", sursa: "reclama_tiktok", stare: "fara_raspuns", zile: 8.1, caller: MARA, incercari: 1, afacere: "Fotograf de nunți", vrea: "Un portofoliu care se încarcă repede pe telefon.", buget: "1.000–2.000 €" },
  { nr: 16, nume: "Victor Manole · Transport Manole", serviciu: "automatizari", sursa: "reclama_meta", stare: "fara_raspuns", zile: 9.5, caller: VLAD, incercari: 2, afacere: "Transport marfă, 6 camioane", vrea: "Facturile și avizele să nu le mai scriem de mână.", buget: "2.000–5.000 €" },
  { nr: 17, nume: "Monica Ilie · Grădinița Piticot", serviciu: "site", sursa: "formular_site", stare: "fara_raspuns", zile: 11.3, caller: MARA, incercari: 3, descriere: "Grădiniță privată. Părinții întreabă mereu de program și meniu, vreau să fie pe site.", note: [[MARA, "Sună ocupat de fiecare dată în jur de 12. Probabil e prânzul copiilor."]] },
  { nr: 18, nume: "Sebastian Florea · Burgerul lui Sebi", serviciu: "automatizari", sursa: "dm_tiktok", stare: "fara_raspuns", zile: 12.6, caller: VLAD, incercari: 1, note: [["admin", "Mi-a scris sub clipul cu comenzile pe WhatsApp. Vrea comenzile online să intre direct în bucătărie."]] },
  { nr: 19, nume: "Claudia Pană · Pet Shop Lăbuțe", serviciu: "site", sursa: "reclama_meta", stare: "fara_raspuns", zile: 14.2, caller: MARA, incercari: 2, afacere: "Magazin pentru animale", vrea: "Să vând online hrana pe care o am în stoc.", buget: "1.000–2.000 €" },

  // ——— callback: au răspuns și au cerut să fie sunați altă dată
  { nr: 20, nume: "Ștefan Voicu · Cabinet Avocat Voicu", serviciu: "site", sursa: "formular_site", stare: "callback", zile: 3.2, caller: MARA, cb: 5, descriere: "Cabinet de avocatură. Am nevoie de un site serios, cu domeniile în care lucrez.", note: [[MARA, "Era în instanță. Zice să revin azi după-amiază, după 16."]] },
  { nr: 21, nume: "Andreea Lazăr · Salon Glam", serviciu: "automatizari", sursa: "reclama_tiktok", stare: "callback", zile: 4.4, caller: MARA, cb: 22, afacere: "Salon de unghii", vrea: "Clientele să-și facă singure programarea, fără să mă sune.", buget: "500–1.000 €", note: [[MARA, "A răspuns între două cliente. Mâine dimineață are pauză, sun atunci."]] },
  { nr: 22, nume: "Horia Gheorghe · Gheorghe & Asociații", serviciu: "automatizari", sursa: "recomandare", stare: "callback", zile: 5.3, caller: VLAD, cb: -2, note: [["admin", "Recomandat de o clientă. Contabilitate, 5 oameni. Vrea să scape de introdusul manual al facturilor."], [VLAD, "Vrea să vorbească întâi cu asociatul. Revin."]] },
  { nr: 23, nume: "Nicoleta Avram · Florăria Margareta", serviciu: "site", sursa: "reclama_meta", stare: "callback", zile: 6.6, caller: VLAD, cb: 47, afacere: "Florărie", vrea: "Comenzi de buchete online, cu livrare în oraș.", buget: "1.000–2.000 €", note: [[VLAD, "Săptămâna asta e aglomerată cu nunțile. Joi e mai liberă."]] },
  { nr: 24, nume: "Răzvan Enache · Sala Forța", serviciu: "automatizari", sursa: "dm_instagram", stare: "callback", zile: 8.2, caller: MARA, cb: -20, note: [["admin", "Mi-a scris pe Instagram. Are o sală de fitness cu abonamente pe hârtie."], [MARA, "Vrea să vadă întâi un exemplu de abonament digital. I-am zis că revin cu unul."]] },
  { nr: 25, nume: "Cătălina Mihai · Ceainăria Ceai & Carte", serviciu: "site", sursa: "formular_site", stare: "callback", zile: 9.4, caller: VLAD, cb: 70, descriere: "Ceainărie cu bibliotecă. Vreau un site cu evenimentele din fiecare lună." },
  { nr: 26, nume: "Dragoș Ilie · Spălătoria Auto Bulevard", serviciu: "automatizari", sursa: "reclama_tiktok", stare: "callback", zile: 11.2, caller: MARA, cb: 26, afacere: "Spălătorie auto", vrea: "Programări online, ca să nu mai stea oamenii la coadă.", buget: "Sub 500 €" },

  // ——— a_raspuns: au vorbit, urmează pasul următor
  { nr: 27, nume: "Mirela Toma · Laborator Analize Vita", serviciu: "automatizari", sursa: "reclama_meta", stare: "a_raspuns", zile: 3.4, caller: MARA, afacere: "Laborator de analize medicale", vrea: "Rezultatele să plece singure pe e-mail când sunt gata.", buget: "2.000–5.000 €", note: [[MARA, "Interesată. Trimit numărul la Ioana să-i propună o discuție."]] },
  { nr: 28, nume: "Silviu Dobre", serviciu: "1la1", sursa: "reclama_tiktok", stare: "a_raspuns", zile: 5.2, caller: VLAD, afacere: "Freelancer, montaj video", vrea: "Să folosesc AI la subtitrări și la idei de clipuri.", buget: "Sub 500 €", note: [[VLAD, "Vrea două sesiuni, nu una. Întreabă dacă pot fi seara."]] },
  { nr: 29, nume: "Bianca Radu · Boutique Elle", serviciu: "site", sursa: "formular_site", stare: "a_raspuns", zile: 7.3, caller: MARA, descriere: "Magazin de haine. Vreau magazin online legat de stocul din magazin." },
  { nr: 30, nume: "Tudor Niță · Cramă Dealul Viilor", serviciu: "site", sursa: "cold_calling", stare: "a_raspuns", zile: 9.6, caller: VLAD, numar: "site-ul cramei, pagina de contact", note: [[VLAD, "Mi-a spus din prima că nu vrea vânzare la telefon, dar l-a interesat partea cu rezervările la degustări. Mi-a dat voie să-i trimit un exemplu."]] },

  // ——— programat: au discuția cu Ioana în zilele următoare
  { nr: 31, nume: "Alexandra Petcu · Clinica Vet Lăbuța", serviciu: "automatizari", sursa: "reclama_meta", stare: "programat", zile: 4.5, caller: MARA, afacere: "Cabinet veterinar", vrea: "Reamintiri pentru vaccinuri, trimise automat stăpânilor.", buget: "1.000–2.000 €", note: [[MARA, "Are lista de pacienți în Excel. Ioana, întreab-o cât de des o completează."]] },
  { nr: 32, nume: "Mihnea Sârbu · Restaurant La Ceaun", serviciu: "site", sursa: "reclama_tiktok", stare: "programat", zile: 5.4, caller: VLAD, afacere: "Restaurant tradițional", vrea: "Meniul pe site și rezervări de mese.", buget: "1.000–2.000 €" },
  { nr: 33, nume: "Ramona Ene · Studio Dans Ritm", serviciu: "site", sursa: "formular_site", stare: "programat", zile: 6.3, caller: MARA, descriere: "Școală de dans pentru copii și adulți. Vreau orarul și înscrierile pe site.", note: [[MARA, "Vrea să vină și soțul la discuție, el se ocupă de bani."]] },
  { nr: 34, nume: "Liviu Ardeleanu · Ardeleanu Imobiliare", serviciu: "automatizari", sursa: "recomandare", stare: "programat", zile: 8.4, caller: VLAD, note: [["admin", "Recomandat de un client vechi. Vrea un asistent care răspunde la anunțuri noaptea."], [VLAD, "Foarte grăbit. Ioana, du-te direct la preț și termen."]] },
  { nr: 35, nume: "Oana Vasilescu", serviciu: "1la1", sursa: "reclama_meta", stare: "programat", zile: 10.2, caller: MARA, afacere: "Contabilă", vrea: "Să înțeleg ce pot automatiza în munca mea.", buget: "Sub 500 €" },

  // ——— oferta_trimisa: au avut discuția, au primit oferta
  { nr: 36, nume: "Iulian Matei · Matei Auto", serviciu: "site", sursa: "reclama_meta", stare: "oferta_trimisa", zile: 12.5, caller: MARA, afacere: "Parc auto rulat", vrea: "Mașinile din stoc pe site, cu filtre.", buget: "2.000–5.000 €", note: [[IOANA, "Oferta trimisă: 2.800 lei, 3 săptămâni. Răspunde până vineri."]] },
  { nr: 37, nume: "Carmen Dumitrescu · Pensiunea Lacul Verde", serviciu: "automatizari", sursa: "formular_site", stare: "oferta_trimisa", zile: 16.3, caller: VLAD, descriere: "Pensiune. Vreau ca rezervările de pe Booking și de pe telefon să fie într-un singur loc.", note: [[IOANA, "I-am arătat pe ecran calendarul cu rezervări. I-a plăcut."]] },
  { nr: 38, nume: "Robert Neacșu · Cafeneaua Colț", serviciu: "site", sursa: "dm_instagram", stare: "oferta_trimisa", zile: 21.4, caller: MARA, note: [["admin", "Mi-a scris după clipul cu site-ul de cafenea."], [IOANA, "Compară cu încă o ofertă. A cerut să vadă un site făcut de noi pe telefon."]] },

  // ——— client: au semnat (fișele lor de client vin din Task 9)
  { nr: 39, nume: "Elisabeta Marin · Patiseria Dulce Colț", serviciu: "site", sursa: "reclama_tiktok", stare: "client", zile: 34.2, caller: MARA, afacere: "Patiserie", vrea: "Comenzi de prăjituri pentru evenimente.", buget: "1.000–2.000 €", note: [[IOANA, "A acceptat oferta. Avans 50% plătit."]] },
  { nr: 40, nume: "Cornel Radu · Clinica Kineto Plus", serviciu: "automatizari", sursa: "reclama_meta", stare: "client", zile: 46.4, caller: VLAD, afacere: "Clinică de recuperare", vrea: "Programările și reamintirile pe WhatsApp.", buget: "2.000–5.000 €", note: [[VLAD, "Știe exact ce vrea. Ioana, are bugetul aprobat."], [IOANA, "Semnat. Pornim luni."]] },
  { nr: 41, nume: "Delia Pop · Agenția de Turism Hoinar", serviciu: "site", sursa: "recomandare", stare: "client", zile: 58.3, caller: MARA, note: [["admin", "Recomandată de o clientă, o florărie."], [IOANA, "Vrea site și, mai târziu, o automatizare pentru ofertele trimise clienților."]] },
  { nr: 42, nume: "Aurelian Stoica", serviciu: "1la1", sursa: "formular_site", stare: "client", zile: 63.5, caller: VLAD, descriere: "Am un magazin online mic și vreau să învăț să lucrez cu AI pentru descrieri de produse." },
  { nr: 43, nume: "Teodor Câmpeanu · Ferma Câmpeanu", serviciu: "altceva", sursa: "cold_calling", stare: "client", zile: 72.2, caller: VLAD, numar: "pagina de Facebook a fermei", note: [[IOANA, "Vrea un formular de comandă pentru coșuri cu produse și un tabel cu stocul."]] },

  // ——— pierdut: au zis nu, după discuție sau după ofertă
  { nr: 44, nume: "Petru Nistor · Nistor Mobilă", serviciu: "site", sursa: "reclama_meta", stare: "pierdut", zile: 27.4, caller: MARA, motiv: "A ales un site făcut de un nepot.", afacere: "Mobilă la comandă", vrea: "Un site cu proiectele făcute.", buget: "1.000–2.000 €" },
  { nr: 45, nume: "Felicia Radu · Salon Felicia", serviciu: "automatizari", sursa: "reclama_tiktok", stare: "pierdut", zile: 39.3, caller: VLAD, motiv: "Prea scump acum. Revine în primăvară.", afacere: "Salon de coafură", vrea: "Programări online.", buget: "Sub 500 €", note: [[IOANA, "Bugetul ei e sub 500 €. I-am spus sincer ce iese cu banii ăștia."]] },
  { nr: 46, nume: "Gelu Popovici · Popovici Instal", serviciu: "site", sursa: "formular_site", stare: "pierdut", zile: 52.6, caller: MARA, motiv: "Nu mai răspunde după ofertă.", descriere: "Instalații sanitare. Vreau să apar pe Google." },

  // ——— descalificat
  { nr: 47, nume: "Ionuț Vlad", serviciu: "altceva", sursa: "reclama_tiktok", stare: "descalificat", zile: 6.4, caller: MARA, motiv: "Căuta un loc de muncă, nu un serviciu.", afacere: "Nu am încă", vrea: "Să lucrez cu voi.", buget: "Nu știu încă" },
  { nr: 48, nume: "Sorina Albu", serviciu: "site", sursa: "reclama_meta", stare: "descalificat", zile: 18.5, caller: VLAD, motiv: "Număr greșit.", afacere: "Cofetărie", vrea: "Site.", buget: "Sub 500 €" },
];

// ---------------------------------------------------------------------------------------------

const max1 = (z: number) => Math.max(1, Math.round(z * 100) / 100);

/** Parcursul care se potrivește cu starea: preluat, încercări, răspuns, discuție, ofertă, rezultat. */
function parcursPentru(r: Rand): EvenimentDemo[] {
  const d = r.zile;
  const p: EvenimentDemo[] = [{ tip: "creat", autor: DE_MANA.includes(r.sursa) ? "admin" : undefined, acumZile: d, detalii: { sursa: r.sursa } }];
  if (!r.caller) return p;
  const c = r.caller;
  // preluat la câteva ore după intrare
  const t0 = max1(d - 0.08);
  p.push({ tip: "caller", autor: c, acumZile: t0, detalii: { de: null, in: c } });
  if (r.stare === "nou") return p;

  const stare = (de: Stare, inn: Stare, z: number, autor: ContTest, motiv?: string) =>
    p.push({ tip: "stare", autor, acumZile: z, detalii: motiv ? { de, in: inn, motiv } : { de, in: inn } });

  if (r.stare === "fara_raspuns") {
    const k = r.incercari ?? 1;
    for (let i = 1; i <= k; i++) {
      const z = max1(t0 - (i - 1) * Math.min(1, (t0 - 1) / Math.max(1, k - 1)));
      if (i === 1) stare("nou", "fara_raspuns", z, c);
      p.push({ tip: "incercare", autor: c, acumZile: z, detalii: { nr: i } });
    }
    return p;
  }
  if (r.stare === "descalificat") {
    stare("nou", "descalificat", t0, c, r.motiv);
    return p;
  }
  if (r.stare === "callback") {
    stare("nou", "callback", t0, c);
    p.push({ tip: "callback", autor: c, acumZile: t0, detalii: {} });
    return p;
  }
  stare("nou", "a_raspuns", t0, c);
  if (r.stare === "a_raspuns") return p;

  // programarea: o zi după primul telefon (sau aceeași zi, dacă e foarte nou)
  const t1 = max1(t0 - 1);
  // discuția are loc trei zile mai târziu (dacă a avut deja loc, Parcursul îi arată ziua)
  const t2 = max1(t1 - 3);
  p.push({ tip: "programat", autor: c, acumZile: t1, detalii: r.stare === "programat" ? { closer: IOANA } : { closer: IOANA, discutieAcumZile: t2 } });
  stare("a_raspuns", "programat", t1, c);
  p.push({ tip: "closer", autor: c, acumZile: t1, detalii: { de: null, in: IOANA } });
  if (r.stare === "programat") return p;

  // discuția a avut loc; apoi oferta și răspunsul clientului
  if (r.stare === "pierdut" && r.nr === 44) {
    stare("programat", "pierdut", t2, IOANA, r.motiv);
    return p;
  }
  stare("programat", "oferta_trimisa", t2, IOANA);
  if (r.stare === "oferta_trimisa") return p;
  const t3 = max1(t2 - 6);
  if (r.stare === "client") stare("oferta_trimisa", "client", t3, IOANA);
  else stare("oferta_trimisa", "pierdut", t3, IOANA, r.motiv);
  return p;
}

function notitePentru(r: Rand, parcurs: EvenimentDemo[]) {
  const n: LeadDemo["notite"] = [];
  if (r.sursa === "cold_calling" && r.numar) n.push({ autor: r.caller ?? "admin", acumZile: r.zile, text: `Numărul e de pe: ${r.numar}` });
  const dupaCreare = parcurs.slice(1);
  (r.note ?? []).forEach(([autor, text], i) => {
    // o notiță de la Admin se scrie la intrare; celelalte după evenimentul autorului (sau după ultimul)
    const alAutorului = dupaCreare.filter((e) => e.autor === autor);
    const z = autor === "admin" && i === 0 ? r.zile : (alAutorului.at(-1) ?? parcurs.at(-1)!).acumZile;
    n.push({ autor, acumZile: max1(z - 0.01), text });
  });
  return n.sort((a, b) => b.acumZile - a.acumZile);
}

function raspunsuriPentru(r: Rand): LeadDemo["raspunsuri"] {
  if (r.sursa === "formular_site") return [{ intrebare: "Descriere", raspuns: r.descriere ?? "" }];
  if (r.sursa === "reclama_meta" || r.sursa === "reclama_tiktok")
    return [
      { intrebare: "Ce afacere ai?", raspuns: r.afacere ?? "" },
      { intrebare: "Ce vrei să rezolvi?", raspuns: r.vrea ?? "" },
      { intrebare: "Buget aproximativ", raspuns: r.buget ?? "" },
    ];
  return undefined;
}

/**
 * Cele 5 reclame din machetă (`prototip/crm-reclame.html`), cu cheltuielile de acolo, în afară de TikTok:
 * 1.500 în loc de 300, ca singurul ei client (1.300 încasați, 1.300 de încasat) să dea „Încă pe minus, dar mai vin”.
 * Cu clienții demo, verdictele ies: Meta „Clip programări” aduce bani, cele două de cafenele n-au clienți,
 * „Poză: recenzii Google” n-are sumă, TikTok e pe minus cu bani care mai vin.
 */
export const RECLAME_DEMO: { platforma: "meta" | "tiktok"; campanie: string; nume: string; cheltuit: number | null }[] = [
  { platforma: "meta", campanie: "Site-uri pentru cafenele", nume: "Clip cafenea, înainte și după", cheltuit: 620 },
  { platforma: "meta", campanie: "Site-uri pentru cafenele", nume: "Carusel: 5 greșeli pe site", cheltuit: 380 },
  { platforma: "meta", campanie: "Automatizări pentru saloane", nume: "Clip programări pe WhatsApp", cheltuit: 450 },
  { platforma: "meta", campanie: "Automatizări pentru saloane", nume: "Poză: recenzii Google", cheltuit: null },
  { platforma: "tiktok", campanie: "Site în 7 zile", nume: "Clip ecran de telefon", cheltuit: 1500 },
];

/** Reclama unui lead demo: TikTok are una; la Meta, site-urile merg la cafenele, restul la saloane (pe rând, după `nr`). */
function reclamaPentru(r: Rand): number | undefined {
  if (r.sursa === "reclama_tiktok") return 4;
  if (r.sursa !== "reclama_meta") return undefined;
  if (r.serviciu === "site") return r.nr % 2 ? 0 : 1;
  // clientul de la Meta (Kineto Plus, nr 40) e al reclamei cu programări
  return r.stare === "client" || r.nr % 2 ? 2 : 3;
}

function utmPentru(r: Rand): LeadDemo["utm"] {
  const i = reclamaPentru(r);
  if (i === undefined) return undefined;
  const a = RECLAME_DEMO[i];
  return { utm_source: a.platforma === "tiktok" ? "tiktok" : r.nr % 3 ? "ig" : "fb", utm_medium: "reclama", utm_campaign: a.campanie, utm_content: a.nume };
}

/** Notițele care vorbesc cu echipa, spuse de un om care lucrează singur. */
const TEXT_SINGUR: Record<string, string> = {
  "Interesată. Trimit numărul la Ioana să-i propună o discuție.": "Interesată. Îi propun o discuție săptămâna asta.",
  "Are lista de pacienți în Excel. Ioana, întreab-o cât de des o completează.": "Are lista de pacienți în Excel. La discuție, o întreb cât de des o completează.",
  "Foarte grăbit. Ioana, du-te direct la preț și termen.": "Foarte grăbit. La discuție, merg direct la preț și termen.",
  "Știe exact ce vrea. Ioana, are bugetul aprobat.": "Știe exact ce vrea. Are bugetul aprobat.",
};

/** Cele 48 de lead-uri ale firmei demo. Cu `singur`, toți oamenii devin Adminul. */
export function leaduriDemo(o: Optiuni): LeadDemo[] {
  const om = (c: ContTest | undefined) => (c && o.singur ? "admin" : c);
  return RANDURI.map((r) => {
    const parcurs = parcursPentru(r);
    const notite = notitePentru(r, parcurs);
    const areCloser = ["programat", "oferta_trimisa", "client", "pierdut"].includes(r.stare);
    return {
      nr: r.nr,
      nume: r.nume,
      serviciu: r.serviciu,
      sursa: r.sursa,
      stare: r.stare,
      acumZile: r.zile,
      caller: om(r.caller),
      closer: areCloser ? om(IOANA) : undefined,
      motiv: r.motiv,
      callbackPesteOre: r.stare === "callback" ? r.cb : undefined,
      incercari: r.incercari,
      raspunsuri: raspunsuriPentru(r),
      utm: utmPentru(r),
      reclama: reclamaPentru(r),
      notite: notite.map((n) => ({ ...n, autor: om(n.autor)!, text: (o.singur && TEXT_SINGUR[n.text]) || n.text })),
      parcurs: parcurs.map((e) => ({
        ...e,
        autor: om(e.autor),
        detalii: o.singur && e.detalii ? Object.fromEntries(Object.entries(e.detalii).map(([k, v]) => [k, ["in", "closer"].includes(k) && v ? "admin" : v])) : e.detalii,
      })),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Ora României

const BUC = "Europe/Bucharest";

/** Cu câte minute e ora României înaintea UTC, în momentul `t`. */
function decalaj(t: number): number {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: BUC, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  const local = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  return Math.round((local - t) / 60_000);
}

/** Momentul în care, la București, e ziua `an-luna-zi` și ora `ora:min`. */
function laBucuresti(an: number, luna: number, zi: number, ora: number, min: number): Date {
  const ca = Date.UTC(an, luna, zi, ora, min);
  return new Date(ca - decalaj(ca - 2 * 3_600_000) * 60_000);
}

/** Ziua calendaristică de la București (an, lună 0–11, zi). */
function ziuaBucuresti(t: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: BUC, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(t).map((x) => [x.type, x.value]));
  return { an: Number(p.year), luna: Number(p.month) - 1, zi: Number(p.day) };
}

/**
 * Momentul de acum `acumZile` zile, mutat în orele de lucru: ziua e cea de acum `floor(acumZile)` zile,
 * iar ora merge de la 18:00 (zecimale 0) spre 09:00 (zecimale aproape de 1), ca ce e mai vechi să fie mai devreme.
 */
export function laOra(acum: Date, acumZile: number): Date {
  const zile = Math.floor(acumZile);
  const minute = Math.round((acumZile - zile) * 540);
  const z = ziuaBucuresti(acum);
  const d = new Date(Date.UTC(z.an, z.luna, z.zi - Math.max(1, zile), 12));
  return laBucuresti(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 18, -minute);
}

/** Ziua lui `t` (la București), la ora `ora:min` a României. */
export function laOraRomaniei(t: Date, ora: number, min: number): Date {
  const z = ziuaBucuresti(t);
  return laBucuresti(z.an, z.luna, z.zi, ora, min);
}

/**
 * Callback-ul de peste `ore` ore (negativ = întârziat), mutat în orele de lucru (09:30–17:00, ora României),
 * fără să treacă de partea cealaltă a lui „acum”: un callback întârziat rămâne întârziat, unul viitor rămâne viitor.
 */
export function laCallback(acum: Date, ore: number): Date {
  const t = new Date(acum.getTime() + ore * 3_600_000);
  const z = ziuaBucuresti(t);
  const ora = Math.floor(((t.getTime() / 60_000 + decalaj(t.getTime())) / 60) % 24);
  let d = ora < 9 ? laBucuresti(z.an, z.luna, z.zi, 9, 30) : ora >= 17 ? laBucuresti(z.an, z.luna, z.zi, 17, 0) : t;
  if (ore < 0 && d.getTime() >= acum.getTime()) d = laBucuresti(z.an, z.luna, z.zi - 1, 17, 0);
  if (ore > 0 && d.getTime() <= acum.getTime()) d = laBucuresti(z.an, z.luna, z.zi + 1, 9, 30);
  return d;
}

/** Orele discuțiilor (nu 14:00: acolo e discuția din datele de test). */
const ORE: [number, number][] = [
  [10, 0],
  [11, 30],
  [15, 0],
  [16, 30],
  [12, 0],
];

/** O discuție pentru fiecare lead „programat”, în următoarele zile lucrătoare, 10–18 ora României, fără suprapuneri. */
export function discutiiDemo(o: Optiuni, leaduri: LeadDemo[]): { nr: number; incepe: Date; minute: 30 }[] {
  const programati = leaduri.filter((l) => l.stare === "programat").sort((a, b) => a.nr - b.nr);
  const azi = ziuaBucuresti(o.acum);
  const zile: { an: number; luna: number; zi: number }[] = [];
  for (let k = 1; zile.length < programati.length; k++) {
    const d = new Date(Date.UTC(azi.an, azi.luna, azi.zi + k, 12));
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
    zile.push({ an: d.getUTCFullYear(), luna: d.getUTCMonth(), zi: d.getUTCDate() });
  }
  return programati.map((l, i) => {
    const [ora, min] = ORE[i % ORE.length];
    const z = zile[i];
    return { nr: l.nr, incepe: laBucuresti(z.an, z.luna, z.zi, ora, min), minute: 30 as const };
  });
}

/** Data calendaristică de la București, peste `n` zile (YYYY-MM-DD), pentru termene. */
export function ziDupa(acum: Date, n: number): string {
  const z = ziuaBucuresti(acum);
  return new Date(Date.UTC(z.an, z.luna, z.zi + n, 12)).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------------------------
// Clienții și proiectele lor

export type ProiectDemo = {
  titlu: string;
  serviciu: Serviciu;
  stadiu: Stadiu;
  pret: number;
  /** Planul de plată, cu zilele „peste N zile” (negativ = în trecut). Fără el: „Fără plan”. */
  plata?: AlegerePlanDemo;
  /** Ce s-a încasat: indexul tranșei din plan; `suma` lipsă = toată; `platit` = comisioanele ei plătite în aceeași zi. */
  incasari?: { rata: number; suma?: number; acumZile: number; platit?: boolean }[];
  returnare?: { rata: number; suma: number; acumZile: number };
  /** Mentenanța lunară; tranșele ei cu scadența trecută se bifează încasate, la scadență. */
  abonament?: { suma: number; zi: number; pornitAcumZile: number };
  termenPesteZile: number | null;
  /** Când a pornit proiectul (primul proiect pornește odată cu clientul). */
  creatAcumZile: number;
  inchisAcumZile?: number;
  procentRadu?: number;
  taskuri: { titlu: string; om: ContTest; termenPesteZile: number; gata: boolean }[];
  materiale: { titlu: string; url: string; nota?: string; om: ContTest }[];
  conturi: { serviciu: string; cont: string; al_cui: "client" | "firma"; unde_parola: UndeParola }[];
  livrari: { titlu: string; link: string; nota?: string; stare: StareLivrare; acumZile: number }[];
  notite: { autor: ContTest; text: string; acumZile: number }[];
  /** Parcursul proiectului, de la cel mai vechi la cel mai nou (oamenii din `detalii.om` sunt chei de cont). */
  parcurs: EvenimentDemo[];
};

export type AlegerePlanDemo =
  | { fel: "odata"; zi: number }
  | { fel: "avans"; avans: { lei: number } | { procent: number }; ziAvans: number; ziRest: number }
  | { fel: "rate"; nr: number; primaZi: number };

/** Planul demo cu zilele calendaristice de la București, relative la `acum`. */
export function planDemo(acum: Date, a: AlegerePlanDemo): AlegerePlan {
  if (a.fel === "odata") return { fel: "odata", zi: ziDupa(acum, a.zi) };
  if (a.fel === "avans") return { fel: "avans", avans: a.avans, ziAvans: ziDupa(acum, a.ziAvans), ziRest: ziDupa(acum, a.ziRest) };
  return { fel: "rate", nr: a.nr, primaZi: ziDupa(acum, a.primaZi) };
}

/** Procentele de bază ale firmei demo (constructor / caller / closer); rămân și cu `--singur`. */
export const PROCENTE_BAZA_DEMO: { categorie: string; rol: "constructor" | "caller" | "closer"; procent: number }[] = (
  [
    ["site", 30, 10, 10],
    ["automatizari", 40, 10, 10],
    ["1la1", 20, 10, 10],
    ["altceva", 30, 10, 10],
    ["mentenanta", 50, 0, 0],
  ] as const
).flatMap(([categorie, constructor, caller, closer]) => [
  { categorie, rol: "constructor" as const, procent: constructor },
  { categorie, rol: "caller" as const, procent: caller },
  { categorie, rol: "closer" as const, procent: closer },
]);

export type ClientDemo = { nrLead: number; clientDinAcumZile: number; proiecte: ProiectDemo[] };

type ProiectScris = Omit<ProiectDemo, "creatAcumZile" | "parcurs" | "livrari" | "notite"> & {
  pornitAcumZile?: number;
  livrari: Omit<ProiectDemo["livrari"][number], "acumZile">[];
  notite: [ContTest, string][];
};

const RADU: ContTest = "constructor";
const drive = (x: string) => `https://drive.google.com/drive/folders/exemplu-${x}`;
const doc = (x: string) => `https://docs.google.com/document/d/exemplu-${x}`;

const CLIENTI: { nrLead: number; proiecte: ProiectScris[] }[] = [
  {
    nrLead: 39, // Elisabeta Marin · Patiseria Dulce Colț
    proiecte: [
      {
        titlu: "Site cu comenzi pentru evenimente",
        serviciu: "site",
        stadiu: "schita",
        pret: 2600,
        plata: { fel: "avans", avans: { procent: 50 }, ziAvans: -25, ziRest: 12 },
        incasari: [{ rata: 0, acumZile: 24, platit: true }],
        termenPesteZile: 16,
        procentRadu: 30,
        taskuri: [
          { titlu: "Discuția de pornire", om: "admin", termenPesteZile: -22, gata: true },
          { titlu: "Lista de produse și prețuri, de la client", om: "admin", termenPesteZile: -10, gata: true },
          { titlu: "Schița paginii principale, varianta 2", om: RADU, termenPesteZile: 0, gata: false },
          { titlu: "Pozele prăjiturilor, făcute la lumina zilei", om: "admin", termenPesteZile: -3, gata: false },
          { titlu: "Formularul de comandă pentru evenimente", om: RADU, termenPesteZile: 6, gata: false },
        ],
        materiale: [
          { titlu: "Logo (vectorial)", url: drive("logo-patiserie"), om: "admin" },
          { titlu: "Lista de prețuri", url: doc("preturi-patiserie"), om: "admin" },
          { titlu: "Poze din vitrină", url: drive("poze-vitrina"), nota: "prea întunecate, am cerut altele", om: RADU },
        ],
        conturi: [
          { serviciu: "Domeniu", cont: "dulcecolt.ro", al_cui: "client", unde_parola: "la_client" },
          { serviciu: "Vercel (site-ul)", cont: "patiseria-dulce-colt", al_cui: "firma", unde_parola: "la_firma" },
          { serviciu: "Instagram", cont: "@dulcecolt", al_cui: "client", unde_parola: "nu_e_cazul" },
        ],
        livrari: [{ titlu: "Schița paginii principale (v1)", link: "https://dulce-colt.exemplu.ro/schita-v1", nota: "vrea culori mai calde, fără negru", stare: "de_refacut" }],
        notite: [
          ["admin", "Comenzile mari vin pe WhatsApp. Formularul trimite tot acolo, nu pe e-mail."],
          [RADU, "Fac schița 2 în crem și roz pudrat, cum a cerut."],
        ],
      },
    ],
  },
  {
    nrLead: 40, // Cornel Radu · Clinica Kineto Plus
    proiecte: [
      {
        titlu: "Programări și reamintiri pe WhatsApp",
        serviciu: "automatizari",
        stadiu: "constructie",
        pret: 3800,
        plata: { fel: "rate", nr: 4, primaZi: -33 },
        incasari: [{ rata: 0, acumZile: 32, platit: true }],
        termenPesteZile: 9,
        procentRadu: 40,
        taskuri: [
          { titlu: "Fluxul programărilor, desenat și aprobat", om: "admin", termenPesteZile: -28, gata: true },
          { titlu: "Contul WhatsApp Business al clinicii, verificat", om: "admin", termenPesteZile: -20, gata: true },
          { titlu: "Legătura cu calendarul terapeuților", om: RADU, termenPesteZile: -2, gata: false },
          { titlu: "Mesajul de reamintire, cu o zi înainte", om: RADU, termenPesteZile: 4, gata: false },
          { titlu: "Proba cu cinci pacienți care au zis da", om: "admin", termenPesteZile: 8, gata: false },
          { titlu: "Recepția: 30 de minute de lămuriri", om: "admin", termenPesteZile: 12, gata: false },
        ],
        materiale: [
          { titlu: "Programul terapeuților", url: "https://docs.google.com/spreadsheets/d/exemplu-program-kineto", om: "admin" },
          { titlu: "Textele mesajelor, aprobate", url: doc("mesaje-kineto"), om: RADU },
        ],
        conturi: [
          { serviciu: "WhatsApp Business", cont: "numărul clinicii", al_cui: "client", unde_parola: "la_client" },
          { serviciu: "Make (automatizarea)", cont: "kineto-plus", al_cui: "firma", unde_parola: "manager_parole" },
          { serviciu: "Google Calendar", cont: "calendarul clinicii", al_cui: "client", unde_parola: "la_client" },
        ],
        livrari: [
          { titlu: "Schema fluxului de programare", link: "https://kineto.exemplu.ro/schema", nota: "„Exact așa vrem.”", stare: "aprobat" },
          { titlu: "Mesajele de reamintire (3 variante)", link: doc("variante-mesaje"), stare: "trimis" },
        ],
        notite: [
          [RADU, "Terapeuții au ture diferite. Pun întâi tura, apoi orele libere."],
          ["admin", "Mesajele pleacă doar pacienților care au zis da la reamintiri."],
        ],
      },
    ],
  },
  {
    nrLead: 41, // Delia Pop · Agenția de Turism Hoinar
    proiecte: [
      {
        titlu: "Site cu ofertele agenției",
        serviciu: "site",
        stadiu: "revizii",
        pret: 3200,
        plata: { fel: "odata", zi: -11 },
        incasari: [{ rata: 0, suma: 2000, acumZile: 5 }],
        termenPesteZile: 5,
        procentRadu: 30,
        taskuri: [
          { titlu: "Structura site-ului, aprobată", om: "admin", termenPesteZile: -40, gata: true },
          { titlu: "Paginile de oferte", om: RADU, termenPesteZile: -18, gata: true },
          { titlu: "Formularul de cerere de ofertă", om: RADU, termenPesteZile: -9, gata: true },
          { titlu: "Corecturile din prima rundă", om: RADU, termenPesteZile: 2, gata: false },
          { titlu: "Textul pentru „Despre noi”, de la client", om: "admin", termenPesteZile: -1, gata: false },
          { titlu: "Publicarea pe domeniu", om: "admin", termenPesteZile: 5, gata: false },
        ],
        materiale: [
          { titlu: "Pozele din excursii", url: drive("poze-hoinar"), nota: "le micșorez înainte să le urc", om: RADU },
          { titlu: "Ofertele de iarnă (PDF)", url: drive("oferte-iarna"), om: "admin" },
        ],
        conturi: [
          { serviciu: "Domeniu", cont: "hoinar-turism.ro", al_cui: "client", unde_parola: "la_client" },
          { serviciu: "Vercel (site-ul)", cont: "hoinar", al_cui: "firma", unde_parola: "la_firma" },
          { serviciu: "GitHub", cont: "buildwithac/hoinar", al_cui: "firma", unde_parola: "la_firma" },
        ],
        livrari: [
          { titlu: "Schița site-ului (v2)", link: "https://hoinar.exemplu.ro/schita-v2", stare: "aprobat" },
          { titlu: "Previzualizarea site-ului", link: "https://hoinar.exemplu.ro", nota: "a trimis corecturile pe WhatsApp", stare: "trimis" },
        ],
        notite: [
          ["admin", "Vrea ofertele pe sezoane: iarnă, vară, city break."],
          [RADU, "Pozele mari din excursii le micșorez, altfel site-ul merge greu pe telefon."],
        ],
      },
      {
        titlu: "Automatizare pentru ofertele trimise clienților",
        serviciu: "automatizari",
        stadiu: "discutie",
        pret: 1800,
        termenPesteZile: null,
        pornitAcumZile: 6,
        taskuri: [
          { titlu: "Discuția: ce oferte trimite și cât de des", om: "admin", termenPesteZile: 2, gata: false },
          { titlu: "Exemple de oferte trimise anul trecut", om: "admin", termenPesteZile: -1, gata: false },
          { titlu: "Propunerea de preț", om: "admin", termenPesteZile: 5, gata: false },
        ],
        materiale: [{ titlu: "Oferte trimise (exemple)", url: drive("oferte-hoinar"), om: "admin" }],
        conturi: [],
        livrari: [],
        notite: [["admin", "Acum scrie fiecare ofertă de mână, în Word. Durează cam o oră pe ofertă."]],
      },
    ],
  },
  {
    nrLead: 42, // Aurelian Stoica
    proiecte: [
      {
        titlu: "Sesiuni 1 la 1: AI pentru magazinul online",
        serviciu: "1la1",
        stadiu: "livrat",
        pret: 900,
        plata: { fel: "odata", zi: -22 },
        incasari: [{ rata: 0, acumZile: 21, platit: true }],
        returnare: { rata: 0, suma: 300, acumZile: 4 },
        termenPesteZile: -20,
        taskuri: [
          { titlu: "Sesiunea 1: descrieri de produse cu ChatGPT", om: "admin", termenPesteZile: -45, gata: true },
          { titlu: "Sesiunea 2: poze de produs cu AI", om: "admin", termenPesteZile: -38, gata: true },
          { titlu: "Sesiunea 3: răspunsuri automate la mesaje", om: "admin", termenPesteZile: -31, gata: true },
          { titlu: "Rezumatul și prompturile, trimise", om: "admin", termenPesteZile: -29, gata: true },
        ],
        materiale: [
          { titlu: "Înregistrările sesiunilor", url: drive("sesiuni-aurelian"), om: "admin" },
          { titlu: "Prompturile folosite", url: doc("prompturi-aurelian"), om: "admin" },
        ],
        conturi: [],
        livrari: [{ titlu: "Rezumatul celor 3 sesiuni", link: doc("rezumat-sesiuni"), nota: "„Mi-a prins bine partea cu descrierile.”", stare: "aprobat" }],
        notite: [["admin", "Își scrie singur descrierile acum. A întrebat de încă o sesiune, despre reclame."]],
      },
    ],
  },
  {
    nrLead: 43, // Teodor Câmpeanu · Ferma Câmpeanu
    proiecte: [
      {
        titlu: "Formular de comenzi și tabel de stoc",
        serviciu: "altceva",
        stadiu: "mentenanta",
        pret: 1500,
        plata: { fel: "odata", zi: -45 },
        incasari: [{ rata: 0, acumZile: 44, platit: true }],
        abonament: { suma: 250, zi: 10, pornitAcumZile: 38 },
        termenPesteZile: -42,
        inchisAcumZile: 40,
        taskuri: [
          { titlu: "Formularul de comandă pentru coșuri", om: "admin", termenPesteZile: -55, gata: true },
          { titlu: "Tabelul de stoc, legat de formular", om: "admin", termenPesteZile: -48, gata: true },
          { titlu: "Familia știe să adauge produse", om: "admin", termenPesteZile: -43, gata: true },
        ],
        materiale: [{ titlu: "Produsele de sezon", url: "https://docs.google.com/spreadsheets/d/exemplu-produse-ferma", om: "admin" }],
        conturi: [
          { serviciu: "Google Forms", cont: "contul fermei", al_cui: "client", unde_parola: "la_client" },
          { serviciu: "Google Sheets", cont: "tabelul de stoc", al_cui: "client", unde_parola: "la_client" },
        ],
        livrari: [
          { titlu: "Formularul de comandă", link: "https://ferma.exemplu.ro/comanda", stare: "aprobat" },
          { titlu: "Tabelul de stoc", link: doc("stoc-ferma"), stare: "aprobat" },
        ],
        notite: [["admin", "Colaborarea s-a încheiat. Dacă vrea și magazin online la primăvară, îl sun eu."]],
      },
    ],
  },
];

const STADII_ORDINE: Stadiu[] = ["discutie", "schita", "constructie", "revizii", "livrat", "mentenanta"];

/** Zilele unui proiect: pornirea, oamenii, stadiile pe rând, ce s-a trimis și închiderea. */
function completeazaProiect(p: ProiectScris, pornit: number): ProiectDemo {
  const sfarsit = p.inchisAcumZile !== undefined ? p.inchisAcumZile + 1 : 2;
  const k = STADII_ORDINE.indexOf(p.stadiu);
  const parcurs: EvenimentDemo[] = [{ tip: "proiect_creat", autor: "admin", acumZile: pornit, detalii: { titlu: p.titlu, serviciu: p.serviciu } }];
  if (p.procentRadu !== undefined) parcurs.push({ tip: "om_adaugat", autor: "admin", acumZile: max1(pornit - 0.1), detalii: { om: RADU } });
  const pas = k > 0 ? (pornit - sfarsit) / k : 0;
  for (let i = 1; i <= k; i++) parcurs.push({ tip: "stadiu", autor: "admin", acumZile: max1(pornit - pas * i), detalii: { de: STADII_ORDINE[i - 1], in: STADII_ORDINE[i] } });

  // ce s-a trimis: spre final, la două zile unul de altul; răspunsul clientului vine a doua zi
  const livrari = p.livrari.map((l, j) => ({ ...l, acumZile: max1(sfarsit + 1.5 + (p.livrari.length - 1 - j) * 2) }));
  for (const l of livrari) {
    parcurs.push({ tip: "livrat", autor: "admin", acumZile: l.acumZile, detalii: { titlu: l.titlu } });
    if (l.stare !== "trimis") parcurs.push({ tip: "livrare_stare", autor: "admin", acumZile: max1(l.acumZile - 1), detalii: { titlu: l.titlu, in: l.stare } });
  }
  if (p.inchisAcumZile !== undefined) parcurs.push({ tip: "inchis", autor: "admin", acumZile: p.inchisAcumZile });
  parcurs.sort((a, b) => b.acumZile - a.acumZile);

  const notite = p.notite.map(([autor, text], j) => ({ autor, text, acumZile: max1(sfarsit + (p.notite.length - j) * 1.3) }));
  const rest: Partial<ProiectScris> = { ...p };
  delete rest.pornitAcumZile;
  return { ...(rest as ProiectScris), creatAcumZile: pornit, livrari, notite, parcurs };
}

/** Cei 5 clienți demo, din lead-urile demo cu starea „client”. Cu `singur`, doar Adminul e pe proiecte. */
export function clientiDemo(o: Optiuni): ClientDemo[] {
  const leaduri = leaduriDemo({ ...o, singur: false });
  const om = (c: ContTest): ContTest => (o.singur ? "admin" : c);
  return CLIENTI.map((c) => {
    const lead = leaduri.find((l) => l.nr === c.nrLead)!;
    const clientDin = lead.parcurs.find((e) => e.tip === "stare" && e.detalii?.in === "client")!.acumZile;
    const proiecte = c.proiecte.map((p) => completeazaProiect(p, p.pornitAcumZile ?? max1(clientDin - 0.05)));
    return {
      nrLead: c.nrLead,
      clientDinAcumZile: clientDin,
      proiecte: proiecte.map((p) => ({
        ...p,
        procentRadu: o.singur ? undefined : p.procentRadu,
        taskuri: p.taskuri.map((t) => ({ ...t, om: om(t.om) })),
        materiale: p.materiale.map((m) => ({ ...m, om: om(m.om) })),
        notite: p.notite.map((n) => ({ ...n, autor: om(n.autor) })),
        parcurs: o.singur ? p.parcurs.filter((e) => e.tip !== "om_adaugat") : p.parcurs,
      })),
    };
  });
}
