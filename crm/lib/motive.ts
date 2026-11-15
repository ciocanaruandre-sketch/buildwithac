/** Motivele fixe de la „Pierdut” și „Descalificat”. Valorile = `check`-ul de pe `lead_uri.motiv_categorie`. */
export type MotivCategorie =
  | "prea_scump"
  | "alt_furnizor"
  | "nu_mai_are_nevoie"
  | "nu_mai_raspunde"
  | "nu_are_firma"
  | "numar_gresit"
  | "nu_e_interesat"
  | "cauta_altceva"
  | "altceva";

export const MOTIVE: Record<"pierdut" | "descalificat", MotivCategorie[]> = {
  pierdut: ["prea_scump", "alt_furnizor", "nu_mai_are_nevoie", "nu_mai_raspunde", "altceva"],
  descalificat: ["nu_are_firma", "numar_gresit", "nu_e_interesat", "cauta_altceva", "altceva"],
};

export const ETICHETA_MOTIV: Record<MotivCategorie, string> = {
  prea_scump: "Prea scump",
  alt_furnizor: "A ales pe altcineva",
  nu_mai_are_nevoie: "Nu mai are nevoie",
  nu_mai_raspunde: "Nu mai răspunde",
  nu_are_firma: "Nu are firmă",
  numar_gresit: "Număr greșit",
  nu_e_interesat: "Nu e interesat",
  cauta_altceva: "Caută altceva",
  altceva: "Altceva",
};

/** Mesajul de eroare, sau null dacă motivul e bun. Textul se cere doar la „Altceva”. */
export function motivValid(stare: "pierdut" | "descalificat", categorie: string | undefined | null, text: string): string | null {
  if (!categorie || !(MOTIVE[stare] as string[]).includes(categorie)) return "Alege motivul.";
  if (categorie === "altceva" && text.trim().length < 3) return "Scrie motivul.";
  return null;
}

/** Motivul ca text: eticheta, „Altceva: …”, sau textul liber de dinainte de motivele fixe. */
export function textMotiv(categorie: string | null | undefined, motiv: string | null | undefined): string | null {
  const eticheta = categorie ? ETICHETA_MOTIV[categorie as MotivCategorie] : undefined;
  if (eticheta && categorie !== "altceva") return eticheta;
  if (eticheta) return motiv ? `${eticheta}: ${motiv}` : eticheta;
  return motiv || null;
}
