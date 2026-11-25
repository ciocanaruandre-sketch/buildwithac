import { cuDe, mii } from "@/lib/numere";

export type Timp = { minute: number; leiPeOra: number };
export type Clienti = { cereri: number; dinZece: number; leiPeClient: number };

/** Cursoarele calculatorului de pe homepage. */
export const LIMITE: Record<keyof Timp | keyof Clienti, { min: number; max: number; pas: number; start: number }> = {
  minute: { min: 10, max: 240, pas: 5, start: 45 },
  leiPeOra: { min: 20, max: 300, pas: 10, start: 50 },
  cereri: { min: 1, max: 30, pas: 1, start: 5 },
  dinZece: { min: 1, max: 10, pas: 1, start: 3 },
  leiPeClient: { min: 50, max: 5000, pas: 50, start: 500 },
};

export const ZILE_LUCRATOARE = 250;

export function calculTimp({ minute, leiPeOra }: Timp) {
  const ore = (minute * ZILE_LUCRATOARE) / 60;
  return { ore: Math.floor(ore), lei: Math.round(ore * leiPeOra) };
}

export function calculClienti({ cereri, dinZece, leiPeClient }: Clienti) {
  return { leiPeLuna: Math.round((cereri * 52 * dinZece * leiPeClient) / 120) };
}

/** Ce ajunge în câmpul „Descriere” al formularului. */
export function textTimp(v: Timp): string {
  const { ore, lei } = calculTimp(v);
  return `Din calculator: ${cuDe(v.minute, "minut", "minute")} pe zi de muncă repetată, ${cuDe(v.leiPeOra, "leu", "lei")} ora. Cam ${cuDe(ore, "oră", "ore")} și ${mii(lei)} lei pe an.`;
}

export function textClienti(v: Clienti): string {
  return `Din calculator: ${cuDe(v.cereri, "cerere", "cereri")} pe săptămână fără răspuns, ${v.dinZece} din 10 cumpără, ${cuDe(v.leiPeClient, "leu", "lei")} pe client. Cam ${mii(calculClienti(v).leiPeLuna)} lei pe lună.`;
}
