import type { Continut } from "./schema";

/**
 * Tot ce poate cere clientul să se schimbe: texte, prețuri, program, poze.
 * Singurul loc cu ele: componentele nu au texte scrise în ele.
 * Valorile de aici sunt doar exemple, înlocuite la fiecare client.
 */
export const CONTINUT: Continut = {
  titlu: "Numele firmei, pe scurt ce face",
  descriere: "O frază despre firmă, așa cum vrei să apară în Google. Cel mult 160 de caractere.",
  program: [
    { zile: "Luni – Vineri", ore: "09:00 – 18:00" },
    { zile: "Sâmbătă", ore: "10:00 – 14:00" },
    { zile: "Duminică", ore: "Închis" },
  ],
  servicii: [
    { nume: "Primul serviciu", pret: 100, descriere: "Ce primește omul, într-o frază." },
    { nume: "Al doilea serviciu", pret: 250 },
    { nume: "Serviciu la cerere", pret: null, descriere: "Prețul se stabilește după discuție." },
  ],
  // pozele stau în public/poze/; sursa fiecăreia se notează în jurnal
  poze: [],
};
