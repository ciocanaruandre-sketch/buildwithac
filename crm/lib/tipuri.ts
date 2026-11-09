/** Valorile sunt și numele enum-urilor din baza de date (supabase/migrations). Se schimbă împreună. */
export const ROLURI = ["admin", "caller", "closer", "constructor"] as const;
export const STARI = ["nou", "fara_raspuns", "a_raspuns", "callback", "programat", "oferta_trimisa", "client", "pierdut", "descalificat"] as const;
export const SURSE = ["formular_site", "reclama_meta", "reclama_tiktok", "cold_calling", "recomandare", "dm_instagram", "dm_tiktok", "altceva"] as const;
/** Aceleași chei ca SERVICII_CONTACT din site/lib/contact.ts. */
export const SERVICII = ["site", "automatizari", "1la1", "altceva"] as const;

export type Rol = (typeof ROLURI)[number];
export type Stare = (typeof STARI)[number];
export type Sursa = (typeof SURSE)[number];
export type Serviciu = (typeof SERVICII)[number];

/** Sursele pe care le alege omul când adaugă un lead de mână (reclamele, până intră singure). */
export const SURSE_MANUALE: Sursa[] = ["reclama_meta", "reclama_tiktok", "cold_calling", "recomandare", "dm_instagram", "dm_tiktok", "altceva"];

export const ETICHETE: { stare: Record<Stare, string>; sursa: Record<Sursa, string>; serviciu: Record<Serviciu, string>; rol: Record<Rol, string> } = {
  stare: {
    nou: "Nou",
    fara_raspuns: "Fără răspuns",
    a_raspuns: "A răspuns",
    callback: "Callback",
    programat: "Programat",
    oferta_trimisa: "Ofertă trimisă",
    client: "Client",
    pierdut: "Pierdut",
    descalificat: "Descalificat",
  },
  sursa: {
    formular_site: "Formular site",
    reclama_meta: "Reclamă Meta",
    reclama_tiktok: "Reclamă TikTok",
    cold_calling: "Cold calling",
    recomandare: "Recomandare",
    dm_instagram: "DM Instagram",
    dm_tiktok: "DM TikTok",
    altceva: "Altceva",
  },
  serviciu: {
    site: "Site",
    automatizari: "Automatizări",
    "1la1": "Sesiune 1 la 1 / ghid",
    altceva: "Altceva",
  },
  rol: { admin: "Admin", caller: "Caller", closer: "Closer", constructor: "Constructor" },
};
