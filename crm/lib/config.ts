import type { Serviciu, Sursa } from "@/lib/tipuri";

/** Domeniul, adresele și formularele stau doar aici. */
export const CRM = {
  domeniu: "crm.buildwithac.ro",
  url: "https://crm.buildwithac.ro",
  emailAdmin: "contact@buildwithac.ro",
  emailExpeditor: "crm@buildwithac.ro",
  urlSite: "https://buildwithac.ro",
  /** id-ul formularului Tally (cel din tally.so/r/<id>) → de unde vine și ce serviciu cere */
  formulareTally: {
    Qo1xzg: { sursa: "tally_site", serviciu: "site" },
    M1X8qg: { sursa: "tally_automatizari", serviciu: "automatizari" },
    jeZGX9: { sursa: "tally_ghid", serviciu: "1la1" },
  } satisfies Record<string, { sursa: Sursa; serviciu: Serviciu }>,
} as const;
