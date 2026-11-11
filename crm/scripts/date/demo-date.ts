// Firma demo: datele, ca funcții pure (fără Supabase, fără Date.now()). Le scrie `scripts/demo.mts`.
// Totul e inventat: nume, firme, telefoane 0700 100 …, link-uri spre domenii de exemplu.
import type { ContTest } from "../../lib/echipa-test";
import type { Serviciu, Stare, Sursa } from "../../lib/tipuri";

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
  notite: { autor: ContTest; acumZile: number; text: string }[];
  /**
   * Parcursul, de la cel mai vechi la cel mai nou. În `detalii`, oamenii sunt chei de cont (ContTest):
   * scriitorul le traduce în id-uri; la „programat” și „callback”, ora vine din discuție / `callbackPesteOre`.
   */
  parcurs: EvenimentDemo[];
};

export const telefonDemo = (nr: number) => `0700 100 ${String(nr).padStart(3, "0")}`;
export const telefonNormDemo = (nr: number) => `40700100${String(nr).padStart(3, "0")}`;

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
  { nr: 22, nume: "Horia Gheorghe · Gheorghe & Asociații", serviciu: "automatizari", sursa: "recomandare", stare: "callback", zile: 5.3, caller: VLAD, cb: -2, note: [["admin", "Recomandat de Laura Ene. Contabilitate, 5 oameni. Vrea să scape de introdusul manual al facturilor."], [VLAD, "Vrea să vorbească întâi cu asociatul. Revin."]] },
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
  { nr: 41, nume: "Delia Pop · Agenția de Turism Hoinar", serviciu: "site", sursa: "recomandare", stare: "client", zile: 58.3, caller: MARA, note: [["admin", "Recomandată de Andreea Pop (Florăria Iris)."], [IOANA, "Vrea site și, mai târziu, o automatizare pentru ofertele trimise clienților."]] },
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
  p.push({ tip: "programat", autor: c, acumZile: t1, detalii: { closer: IOANA } });
  stare("a_raspuns", "programat", t1, c);
  p.push({ tip: "closer", autor: c, acumZile: t1, detalii: { de: null, in: IOANA } });
  if (r.stare === "programat") return p;

  // discuția a avut loc; apoi oferta și răspunsul clientului
  const t2 = max1(t1 - 3);
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

function utmPentru(r: Rand): LeadDemo["utm"] {
  if (r.sursa === "reclama_meta") return { utm_source: "meta", utm_campaign: r.serviciu === "site" ? "site-uri-toamna" : "automatizari-toamna" };
  if (r.sursa === "reclama_tiktok") return { utm_source: "tiktok", utm_campaign: "clipuri-noiembrie" };
  return undefined;
}

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
      notite: notite.map((n) => ({ ...n, autor: om(n.autor)! })),
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
