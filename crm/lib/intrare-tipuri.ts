import type { Serviciu, Sursa } from "@/lib/tipuri";

/** O cerere venită dintr-un formular, înainte să intre în baza de date. */
export type CerereNoua = {
  nume: string;
  telefon: string | null;
  email: string | null;
  serviciu: Serviciu;
  sursa: Sursa;
  raspunsuri: { intrebare: string; raspuns: string }[];
  utm: Record<string, string>;
  /** id-ul cererii la sursă (ex. formularul unei reclame): aceeași cerere retrimisă nu se scrie de două ori */
  idExtern: string | null;
};
