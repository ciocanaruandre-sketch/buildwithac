/** Proiectele din secțiunea Portofoliu. `concept` = site-concept, mereu etichetat „Concept”. */
export type ElementPortofoliu = {
  titlu: string;
  tip: "proiect" | "automatizare" | "concept";
  descriere: string;
  imagine?: string;
  /** Pagina statică a conceptului, din public/concepte/, sau site-ul adevărat (https://…). */
  link?: string;
  /** Captura e cu date inventate; se scrie pe ea. */
  dateDemo?: true;
};

// automatizările: capturi reale din n8n-ul lui Andrei; CRM: captură din modul demo, blurată; ImobSearch: captura site-ului; conceptele: poze Unsplash
export const PORTOFOLIU: ElementPortofoliu[] = [
  { titlu: "CRM pentru echipe de vânzări", tip: "proiect", dateDemo: true, descriere: "Cererile, apelurile, programările și reclamele Meta, într-un singur loc. L-am făcut pentru mine, apoi l-am dus până unde poate lucra o echipă întreagă." },
  { titlu: "ImobSearch", imagine: "/portofoliu/imobsearch.webp", link: "https://www.imobsearch.ro", tip: "proiect", descriere: "Agregator imobiliar: anunțurile de pe mai multe site-uri, într-un singur loc, cu alerte." },
  { titlu: "Lead-uri pentru o agenție imobiliară", imagine: "/portofoliu/imobiliare-leaduri.webp", tip: "automatizare", descriere: "Fiecare cerere primește un scor de la AI. Agentul află pe Telegram, iar clientul primește pe e-mail 3 proprietăți potrivite, apoi follow-up până răspunde." },
  { titlu: "Pacienții care n-au venit", imagine: "/portofoliu/clinica-noshow.webp", tip: "automatizare", descriere: "Seara, clinica vede cine a lipsit de la programare. Pacientul primește un SMS să se reprogrameze, iar clinica primește raportul zilei pe Telegram." },
  { titlu: "Carusele de Instagram, din știri", imagine: "/portofoliu/instagram-carusele.webp", tip: "automatizare", descriere: "Citește dimineața noutățile din AI, alege subiectul și scrie caruselul în română. Slide-urile ajung în Drive, iar previzualizarea pe Telegram." },
  { titlu: "Clinică stomatologică", imagine: "/portofoliu/cabinet.webp", tip: "concept", descriere: "Prima vizită explicată pas cu pas, tarife și programare.", link: "/concepte/clinica" },
  { titlu: "Frizerie", imagine: "/portofoliu/frizerie.webp", tip: "concept", descriere: "Prețuri la vedere și programare direct din pagină.", link: "/concepte/frizerie" },
  { titlu: "Salon de tatuaje", imagine: "/portofoliu/tatuaje.webp", tip: "concept", descriere: "Lucrările expuse ca tablouri, iar ideea se trimite din site.", link: "/concepte/tatuaje" },
];
