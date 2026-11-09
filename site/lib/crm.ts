import type { CerereContact } from "@/lib/contact";

/**
 * Trimite cererea și în CRM (crm.buildwithac.ro). Nu aruncă niciodată: orice eșec, inclusiv timpul depășit, e `null`,
 * iar e-mailul către Andrei spune atunci că lead-ul trebuie adăugat de mână.
 */
export async function trimiteLaCrm(c: CerereContact, mediu: { url: string; secret: string }, f: typeof fetch = fetch, ms = 4000): Promise<{ id: string } | null> {
  try {
    const r = await f(`${mediu.url}/api/intrare/site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mediu.secret}` },
      body: JSON.stringify({ nume: c.nume, telefon: c.telefon, serviciu: c.serviciu, descriere: c.descriere, utm: c.utm ?? {} }),
      signal: AbortSignal.timeout(ms),
    });
    if (!r.ok) return null;
    const corp = (await r.json()) as { id?: unknown };
    return typeof corp.id === "string" ? { id: corp.id } : null;
  } catch {
    return null;
  }
}
