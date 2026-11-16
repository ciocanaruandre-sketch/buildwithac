import { CRM } from "@/lib/config";
import { ETICHETE, type Serviciu } from "@/lib/tipuri";

export type DateEveniment = {
  leadId: string;
  nume: string;
  telefon: string | null;
  serviciu: Serviciu | null;
  incepe: string;
  sfarseste: string;
};

/** Evenimentul din Google Calendar al unei discuții: fără invitați, fără Meet, cu memento-ul implicit al omului. */
export function corpEveniment(d: DateEveniment) {
  const randuri = [
    d.telefon ? `Telefon: ${d.telefon}` : null,
    d.serviciu ? `Serviciu: ${ETICHETE.serviciu[d.serviciu]}` : null,
    `Fișa: ${CRM.url}/lead-uri/${d.leadId}`,
  ].filter((r): r is string => r !== null);
  return {
    summary: `Discuție · ${d.nume}`,
    description: randuri.join("\n"),
    start: { dateTime: d.incepe, timeZone: "Europe/Bucharest" as const },
    end: { dateTime: d.sfarseste, timeZone: "Europe/Bucharest" as const },
  };
}
