/** Valorile sunt și numele enum-urilor din baza de date (supabase/migrations). Se schimbă împreună. */
export const ROLURI = ["admin", "caller", "closer", "constructor"] as const;
export const STARI = ["nou", "fara_raspuns", "a_raspuns", "callback", "programat", "oferta_trimisa", "client", "pierdut", "descalificat"] as const;
export const SURSE = ["formular_site", "reclama_meta", "reclama_tiktok", "cold_calling", "recomandare", "dm_instagram", "dm_tiktok", "altceva"] as const;
/** Aceleași chei ca SERVICII_CONTACT din site/lib/contact.ts. */
export const SERVICII = ["site", "automatizari", "1la1", "altceva"] as const;

/** Stadiile unui proiect, în ordine. */
export const STADII = ["discutie", "schita", "constructie", "revizii", "livrat", "mentenanta"] as const;

/** Ce s-a întâmplat cu un lucru trimis clientului. */
export const STARI_LIVRARE = ["trimis", "aprobat", "de_refacut"] as const;

/** Conturile unui proiect: al cui e contul și unde e parola (o listă, ca să nu ajungă parola în CRM). */
export const AL_CUI = ["client", "firma"] as const;
export const UNDE_PAROLA = ["la_client", "la_firma", "manager_parole", "nu_e_cazul"] as const;

export type Rol = (typeof ROLURI)[number];
export type Stare = (typeof STARI)[number];
export type Sursa = (typeof SURSE)[number];
export type Serviciu = (typeof SERVICII)[number];
export type Stadiu = (typeof STADII)[number];
export type StareLivrare = (typeof STARI_LIVRARE)[number];
export type AlCui = (typeof AL_CUI)[number];
export type UndeParola = (typeof UNDE_PAROLA)[number];

/** Sursele pe care le alege omul când adaugă un lead de mână (reclamele, până intră singure). */
export const SURSE_MANUALE: Sursa[] = ["reclama_meta", "reclama_tiktok", "cold_calling", "recomandare", "dm_instagram", "dm_tiktok", "altceva"];

export const ETICHETE: { stare: Record<Stare, string>; sursa: Record<Sursa, string>; serviciu: Record<Serviciu, string>; rol: Record<Rol, string>; stadiu: Record<Stadiu, string>; livrare: Record<StareLivrare, string>; alCui: Record<AlCui, string>; undeParola: Record<UndeParola, string> } = {
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
  stadiu: { discutie: "Discuție", schita: "Schiță", constructie: "Construcție", revizii: "Revizii", livrat: "Livrat", mentenanta: "Mentenanță" },
  livrare: { trimis: "Trimis", aprobat: "Aprobat", de_refacut: "De refăcut" },
  alCui: { client: "al clientului", firma: "buildwithac" },
  undeParola: { la_client: "la client", la_firma: "la buildwithac", manager_parole: "manager de parole", nu_e_cazul: "—" },
};
