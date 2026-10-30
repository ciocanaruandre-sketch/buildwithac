export type StareAbonare = "ok" | "invalid" | "indisponibil";
export type MediuKit = { cheie?: string; formular?: string };

const API = "https://api.kit.com/v4";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Abonează o adresă la newsletter: creează abonatul ca „inactive” (devine activ când confirmă),
 * apoi îl adaugă la formular. Dubla confirmare se pornește din setările formularului în Kit.
 */
export async function aboneaza(email: string, mediu: MediuKit, f: typeof fetch = fetch, ms = 8000): Promise<StareAbonare> {
  const adresa = email.trim().toLowerCase();
  if (!EMAIL.test(adresa)) return "invalid";
  if (!mediu.cheie || !mediu.formular) return "indisponibil";

  const trimite = (cale: string, corp: object) =>
    f(`${API}${cale}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kit-Api-Key": mediu.cheie! },
      body: JSON.stringify(corp),
      // dacă Kit nu răspunde, omul primește „indisponibil” în câteva secunde, nu un buton care se învârte
      signal: AbortSignal.timeout(ms),
    });

  try {
    const abonat = await trimite("/subscribers", { email_address: adresa, state: "inactive" });
    if (abonat.status === 422) return "invalid";
    if (!abonat.ok) return "indisponibil";
    const formular = await trimite(`/forms/${mediu.formular}/subscribers`, { email_address: adresa });
    return formular.ok ? "ok" : "indisponibil";
  } catch {
    return "indisponibil";
  }
}
