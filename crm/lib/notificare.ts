import { CRM } from "@/lib/config";
import type { Decizie } from "@/lib/decizie";
import { escapa, trimiteEmail } from "@/lib/email";
import { normalizeazaTelefon } from "@/lib/telefon";
import { ETICHETE, type Serviciu, type Sursa } from "@/lib/tipuri";

export type LeadNotificare = { id: string; nume: string; telefon: string | null; serviciu: Serviciu; sursa: Sursa };

const unRand = (s: string) => s.replace(/\s*[\r\n]+\s*/g, " ").trim();

const TITLU: Record<Decizie, string> = {
  lead_nou: "Lead nou",
  leaga_de_lead: "Lead existent: cerere nouă",
  leaga_de_client: "Client existent: cerere nouă",
  redeschide: "Lead redeschis",
};

/** E-mailul pentru Andrei la o cerere nouă, cu link direct la fișă. */
export function construiesteNotificare(l: LeadNotificare, decizie: Decizie): { subiect: string; text: string; html: string } {
  const serviciu = ETICHETE.serviciu[l.serviciu];
  const sursa = ETICHETE.sursa[l.sursa];
  const link = `${CRM.url}/lead-uri/${l.id}`;
  const nume = unRand(l.nume);
  const subiect = unRand(`${TITLU[decizie]}: ${serviciu} · ${nume}`);
  const tel = l.telefon ? normalizeazaTelefon(l.telefon) : null;

  const text = [`Nume: ${nume}`, `Telefon: ${l.telefon ?? "—"}`, `Serviciu: ${serviciu}`, `Sursă: ${sursa}`, "", `Fișa: ${link}`].join("\n");
  const rand = (e: string, v: string) => `<p><b>${e}:</b> ${v}</p>`;
  const html = [
    rand("Nume", escapa(nume)),
    rand("Telefon", l.telefon && tel ? `<a href="tel:+${tel}">${escapa(l.telefon)}</a>` : "—"),
    rand("Serviciu", escapa(serviciu)),
    rand("Sursă", escapa(sursa)),
    `<p><a href="${link}">Deschide fișa în CRM</a></p>`,
  ].join("\n");
  return { subiect, text, html };
}

/** Trimite prin Resend la adresa lui Andrei. Eșecul nu oprește nimic: lead-ul e deja salvat. */
export async function trimiteNotificare(l: LeadNotificare, decizie: Decizie, f: typeof fetch = fetch): Promise<boolean> {
  const { subiect, text, html } = construiesteNotificare(l, decizie);
  return trimiteEmail({ catre: CRM.emailAdmin, subiect, text, html }, f);
}
