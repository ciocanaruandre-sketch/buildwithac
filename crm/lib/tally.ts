import { createHmac, timingSafeEqual } from "node:crypto";
import { CRM } from "@/lib/config";
import type { CerereNoua } from "@/lib/intrare-tipuri";

const egal = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * Antetul `Tally-Signature` = base64(HMAC-SHA256(secret, JSON.stringify(corp))) (tally.so/help/webhooks, 2026-11-09).
 * Tally semnează JSON-ul re-serializat, deci verificăm și textul primit, și forma lui re-serializată.
 */
export function verificaSemnaturaTally(corpBrut: string, semnatura: string | null, secret: string): boolean {
  if (!semnatura || !secret) return false;
  const semn = (s: string) => createHmac("sha256", secret).update(s).digest("base64");
  if (egal(semn(corpBrut), semnatura)) return true;
  try {
    return egal(semn(JSON.stringify(JSON.parse(corpBrut))), semnatura);
  } catch {
    return false;
  }
}

type CampTally = { key?: string; label?: string; type?: string; value?: unknown; options?: { id: string; text: string }[] };

const fara = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Valoarea unui câmp ca text: opțiunile alese cu textul lor, fișierele cu numele lor. Gol → null. */
function caText(c: CampTally): string | null {
  const v = c.value;
  if (v === null || v === undefined || v === "" || typeof v === "boolean") return null;
  if (Array.isArray(v)) {
    const parti = v
      .map((x) => {
        if (typeof x === "string") return c.options?.find((o) => o.id === x)?.text ?? x;
        if (x && typeof x === "object" && "name" in x) return String((x as { name: unknown }).name);
        return String(x);
      })
      .filter(Boolean);
    return parti.length ? parti.join(", ") : null;
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v).trim() || null;
}

/** Răspunsul Tally → cererea pentru CRM. null dacă formularul nu e unul de-al nostru sau corpul e ciudat. */
export function dinTally(corp: unknown): CerereNoua | null {
  const data = (corp as { data?: { formId?: unknown; responseId?: unknown; fields?: unknown } } | null)?.data;
  if (!data || typeof data.formId !== "string" || !Array.isArray(data.fields)) return null;
  const formular = CRM.formulareTally[data.formId as keyof typeof CRM.formulareTally];
  if (!formular) return null;

  const campuri = data.fields as CampTally[];
  // sub-câmpurile de la bife („Întrebare (Opțiune)”: true/false) nu sunt răspunsuri
  const reale = campuri.filter((c) => typeof c.value !== "boolean");

  const utm: Record<string, string> = {};
  const raspunsuri: { intrebare: string; raspuns: string }[] = [];
  for (const c of reale) {
    const eticheta = (c.label ?? "").trim();
    const text = caText(c);
    if (c.type === "HIDDEN_FIELDS") {
      if (/^utm_/.test(eticheta) && text) utm[eticheta] = text.slice(0, 200);
      continue;
    }
    if (text) raspunsuri.push({ intrebare: eticheta || "Fără titlu", raspuns: text });
  }

  const text = reale.filter((c) => c.type === "INPUT_TEXT");
  const campNume = text.find((c) => fara(c.label ?? "").includes("nume")) ?? text[0];
  return {
    nume: (campNume && caText(campNume)) || "Fără nume",
    telefon: caText(reale.find((c) => c.type === "INPUT_PHONE_NUMBER") ?? {}),
    email: caText(reale.find((c) => c.type === "INPUT_EMAIL") ?? {}),
    serviciu: formular.serviciu,
    sursa: formular.sursa,
    raspunsuri,
    utm,
    idExtern: typeof data.responseId === "string" ? data.responseId : null,
  };
}
