/** Proiectele din secțiunea Portofoliu. `concept` = site-concept, mereu etichetat „Concept”. */
export type ElementPortofoliu = {
  titlu: string;
  tip: "proiect" | "automatizare" | "concept";
  descriere: string;
  imagine?: string;
  inCurand?: boolean;
};

// provizoriu: capturile reale le trimite Andrei
export const PORTOFOLIU: ElementPortofoliu[] = [
  { titlu: "ImobSearch", tip: "proiect", descriere: "Agregator imobiliar: anunțurile de pe mai multe site-uri, într-un singur loc, cu alerte." },
  { titlu: "Răspunsuri automate la clienți", tip: "automatizare", descriere: "E-mailurile primite sunt sortate și primesc un răspuns-ciornă în 30 de secunde." },
  { titlu: "Facturi din e-mail în tabel", tip: "automatizare", descriere: "Facturile din atașamente ajung singure într-un tabel, cu sumă și dată." },
  { titlu: "Clinică stomatologică", tip: "concept", descriere: "Site cu programări online și prețuri clare.", inCurand: true },
  { titlu: "Salon", tip: "concept", descriere: "Galerie de lucrări, servicii și programare rapidă.", inCurand: true },
  { titlu: "Service auto / Salon de tatuaje", tip: "concept", descriere: "Al treilea concept, încă nedecis.", inCurand: true },
];
