import { cand, candLung } from "@/lib/afisare";
import { ETICHETE, type Stare, type Sursa } from "@/lib/tipuri";

export type Eveniment = { tip: string; detalii: Record<string, unknown>; la: string; autor_id: string | null };

/** Un eveniment din Parcurs, ca o frază scurtă. `nume` traduce id-urile oamenilor. */
export function descrieEveniment(e: Eveniment, nume: (id: unknown) => string): string {
  const d = e.detalii;
  switch (e.tip) {
    case "creat":
      return `A intrat în CRM · ${ETICHETE.sursa[d.sursa as Sursa] ?? "sursă necunoscută"}`;
    case "stare":
      return `Stare: ${ETICHETE.stare[d.de as Stare]} → ${ETICHETE.stare[d.in as Stare]}${d.motiv ? ` · ${String(d.motiv)}` : ""}`;
    case "incercare":
      return `Nu a răspuns · încercarea ${String(d.nr)}`;
    case "caller":
      return `Caller: ${nume(d.de)} → ${nume(d.in)}`;
    case "closer":
      return `Closer: ${nume(d.de)} → ${nume(d.in)}`;
    case "callback":
      return `Callback setat: ${cand(String(d.la))}`;
    case "cerere_noua":
      return `A trimis o cerere nouă · ${ETICHETE.sursa[d.sursa as Sursa] ?? ""}`;
    case "redeschis":
      return `Redeschis: a revenit cu o cerere nouă · ${ETICHETE.sursa[d.sursa as Sursa] ?? ""}`;
    case "programat":
      return `Discuție programată cu ${nume(d.closer)}: ${candLung(String(d.la))}`;
    default:
      return e.tip;
  }
}
