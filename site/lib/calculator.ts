import { cuDe, mii } from "@/lib/numere";

export type Intrari = { clienti: number; programari: number; leiPeClient: number; minute: number };

/** Cursoarele calculatorului de pe homepage. */
export const LIMITE: Record<keyof Intrari, { min: number; max: number; pas: number; start: number }> = {
  clienti: { min: 0, max: 15, pas: 1, start: 1 },
  programari: { min: 0, max: 20, pas: 1, start: 2 },
  leiPeClient: { min: 50, max: 5000, pas: 50, start: 200 },
  minute: { min: 0, max: 240, pas: 5, start: 45 },
};

const ZILE_LUCRATOARE = 250;
const ORE_PE_ZI = 8;
const peLuna = (peSaptamana: number, lei: number) => Math.round((peSaptamana * 52 * lei) / 12);

export function calcul({ clienti, programari, leiPeClient, minute }: Intrari) {
  const dinRaspuns = peLuna(clienti, leiPeClient);
  const dinProgramari = peLuna(programari, leiPeClient);
  // totalul se adună din rândurile rotunjite, ca bonul să dea la socoteală
  return { dinRaspuns, dinProgramari, leiPeLuna: dinRaspuns + dinProgramari, zile: Math.floor((minute * ZILE_LUCRATOARE) / 60 / ORE_PE_ZI) };
}

/** Ce ajunge în câmpul „Descriere” al formularului; gol dacă toate sunt pe zero. */
export function textCalcul(v: Intrari): string {
  const { leiPeLuna, zile } = calcul(v);
  const intrari = [
    v.clienti && `${cuDe(v.clienti, "client", "clienți")} în plus pe săptămână cu răspuns la timp`,
    v.programari && `${cuDe(v.programari, "programare", "programări")} pe săptămână la care nu vine nimeni`,
    leiPeLuna && `${cuDe(v.leiPeClient, "leu", "lei")} pe client`,
    v.minute && `${cuDe(v.minute, "minut", "minute")} pe zi de muncă repetată`,
  ].filter(Boolean);
  if (!intrari.length) return "";
  const castig = [leiPeLuna && `${mii(leiPeLuna)} lei pe lună`, zile && `${cuDe(zile, "zi", "zile")} pe an`].filter(Boolean);
  return `Din calculator: ${intrari.join(", ")}. Pot câștiga până la ${castig.join(" și ")}.`;
}
