import { cuDe } from "@/lib/numere";

export type Intrari = { cereri: number; programari: number; leiPeClient: number; minute: number };

/** Cursoarele calculatorului de pe homepage. */
export const LIMITE: Record<keyof Intrari, { min: number; max: number; pas: number; start: number }> = {
  cereri: { min: 0, max: 10, pas: 1, start: 3 },
  programari: { min: 0, max: 10, pas: 1, start: 2 },
  leiPeClient: { min: 50, max: 500, pas: 10, start: 150 },
  minute: { min: 0, max: 120, pas: 5, start: 30 },
};

// Presupunerile sunt scrise și pe bon. Sunt prudente dinadins: nicio sumă de aici nu trebuie să pară o promisiune.
const UNA_DIN_CERERI = 10;
/** Mesajele de reamintire scad absențele cu cam un sfert (BMJ Open 2016, 26 de articole medicale: 21% → 15%). */
const UNA_DIN_PROGRAMARI = 4;
const PARTE_DIN_TIMP = 0.5;
const ZILE_LUCRATOARE = 250;
const ORE_PE_ZI = 8;

/** Pe lună, rotunjit în jos la 10 lei. Împărțirea vine ultima, ca zecimalele să nu strice rotunjirea. */
const peLuna = (peSaptamana: number, unaDin: number, lei: number) => Math.floor((peSaptamana * 52 * lei) / (12 * unaDin * 10)) * 10;

export function calcul({ cereri, programari, leiPeClient, minute }: Intrari) {
  const dinCereri = peLuna(cereri, UNA_DIN_CERERI, leiPeClient);
  const dinProgramari = peLuna(programari, UNA_DIN_PROGRAMARI, leiPeClient);
  return { dinCereri, dinProgramari, leiPeLuna: dinCereri + dinProgramari, zile: Math.floor((minute * ZILE_LUCRATOARE * PARTE_DIN_TIMP) / 60 / ORE_PE_ZI) };
}

/** Ce ajunge în câmpul „Descriere” al formularului; gol dacă toate sunt pe zero. */
export function textCalcul(v: Intrari): string {
  const { leiPeLuna, zile } = calcul(v);
  const intrari = [
    v.cereri && `${cuDe(v.cereri, "cerere", "cereri")} pe săptămână la care răspund târziu sau deloc`,
    v.programari && `${cuDe(v.programari, "programare", "programări")} pe săptămână la care nu vine nimeni`,
    leiPeLuna && `${cuDe(v.leiPeClient, "leu", "lei")} pe client`,
    v.minute && `${cuDe(v.minute, "minut", "minute")} pe zi de muncă repetată`,
  ].filter(Boolean);
  if (!intrari.length) return "";
  const castig = [leiPeLuna && `${cuDe(leiPeLuna, "leu", "lei")} pe lună`, zile && `${cuDe(zile, "zi", "zile")} pe an`].filter(Boolean);
  return `Din calculator: ${intrari.join(", ")}. Estimare prudentă: până la ${castig.join(" și ")}.`;
}
