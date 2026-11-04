/** Proiectele din secțiunea Portofoliu. `concept` = site-concept, mereu etichetat „Concept”. */
export type ElementPortofoliu = {
  titlu: string;
  tip: "proiect" | "automatizare" | "concept";
  descriere: string;
  imagine?: string;
  /** Pagina statică a conceptului, din public/concepte/. */
  link?: string;
};

// provizoriu: pozele sunt de pe Unsplash; capturile reale le trimite Andrei
export const PORTOFOLIU: ElementPortofoliu[] = [
  { titlu: "ImobSearch", imagine: "/portofoliu/imobsearch.webp", tip: "proiect", descriere: "Agregator imobiliar: anunțurile de pe mai multe site-uri, într-un singur loc, cu alerte." },
  { titlu: "Răspunsuri automate la clienți", imagine: "/portofoliu/raspunsuri.webp", tip: "automatizare", descriere: "E-mailurile primite sunt sortate și primesc un răspuns-ciornă în 30 de secunde." },
  { titlu: "Facturi din e-mail în tabel", imagine: "/portofoliu/facturi.webp", tip: "automatizare", descriere: "Facturile din atașamente ajung singure într-un tabel, cu sumă și dată." },
  { titlu: "Clinică stomatologică", imagine: "/portofoliu/cabinet.webp", tip: "concept", descriere: "Prima vizită explicată pas cu pas, tarife și programare.", link: "/concepte/clinica" },
  { titlu: "Frizerie", imagine: "/portofoliu/frizerie.webp", tip: "concept", descriere: "Prețuri la vedere și programare direct din pagină.", link: "/concepte/frizerie" },
  { titlu: "Salon de tatuaje", imagine: "/portofoliu/tatuaje.webp", tip: "concept", descriere: "Lucrările expuse ca tablouri, iar ideea se trimite din site.", link: "/concepte/tatuaje" },
];
