import type { Rol, Stare } from "@/lib/tipuri";

export type Actiune = "ia_lead" | "nu_raspunde" | "a_raspuns" | "callback" | "programeaza" | "oferta_trimisa" | "client" | "pierdut" | "descalificat";
export type LeadPentruActiune = { stare: Stare; caller_id: string | null; closer_id: string | null };

const STARE_DUPA: Record<Exclude<Actiune, "ia_lead">, Stare> = {
  nu_raspunde: "fara_raspuns",
  a_raspuns: "a_raspuns",
  callback: "callback",
  programeaza: "programat",
  oferta_trimisa: "oferta_trimisa",
  client: "client",
  pierdut: "pierdut",
  descalificat: "descalificat",
};

export const stareDupa = (a: Exclude<Actiune, "ia_lead">): Stare => STARE_DUPA[a];

/** Starea din care se poate programa discuția: doar după ce omul a răspuns. */
const POATE_PROGRAMA: Stare[] = ["a_raspuns", "callback", "programat"];

/**
 * Ce butoane vede omul pe un lead. Aceleași reguli le impune baza de date
 * (trigger-ul `inainte_de_schimbare_lead`); aici doar nu arătăm ce n-ar merge.
 */
export function actiuniPermise(lead: LeadPentruActiune, rol: Rol, eu: string): Actiune[] {
  if (rol === "constructor") return [];
  if (rol === "admin") return ["nu_raspunde", "a_raspuns", "callback", "programeaza", "oferta_trimisa", "client", "pierdut", "descalificat", ...(lead.caller_id ? [] : (["ia_lead"] as const))];
  if (lead.caller_id === null) return ["ia_lead"];
  const alMeu = lead.caller_id === eu || (rol === "closer" && lead.closer_id === eu);
  if (!alMeu || lead.stare === "client") return [];

  const a: Actiune[] = ["nu_raspunde", "a_raspuns", "callback"];
  if (POATE_PROGRAMA.includes(lead.stare)) a.push("programeaza");
  a.push("oferta_trimisa");
  if (rol === "closer") a.push("client", "pierdut");
  a.push("descalificat");
  return a;
}
