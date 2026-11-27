import type { CerereContact } from "@/lib/contact";

/**
 * Puntea: CRM-ul nu cunoaște încă serviciul „crm”, așa că o astfel de cerere intră ca „altceva”, cu „[CRM]” în față.
 * Se scoate după ce CRM-ul primește „crm” (docs/superpowers/specs/2026-11-27-coperta-crm-design.md, „Puntea”).
 */
function pentruCrm(c: CerereContact): { serviciu: string; descriere: string } {
  if (c.serviciu !== "crm") return { serviciu: c.serviciu, descriere: c.descriere };
  return { serviciu: "altceva", descriere: `[CRM] ${c.descriere}`.trim() };
}

/**
 * Trimite cererea și în CRM (crm.buildwithac.ro). Nu aruncă niciodată: orice eșec, inclusiv timpul depășit, e `null`,
 * iar e-mailul către Andrei spune atunci că lead-ul trebuie adăugat de mână.
 */
export async function trimiteLaCrm(c: CerereContact, mediu: { url: string; secret: string }, f: typeof fetch = fetch, ms = 4000): Promise<{ id: string } | null> {
  try {
    const r = await f(`${mediu.url}/api/intrare/site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mediu.secret}` },
      body: JSON.stringify({ nume: c.nume, telefon: c.telefon, ...pentruCrm(c), utm: c.utm ?? {} }),
      signal: AbortSignal.timeout(ms),
    });
    if (!r.ok) return null;
    const corp = (await r.json()) as { id?: unknown };
    return typeof corp.id === "string" ? { id: corp.id } : null;
  } catch {
    return null;
  }
}
