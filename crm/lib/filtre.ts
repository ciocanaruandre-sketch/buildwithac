import { laOraRomaniei, ziuaPeste, ziuaRomaniei } from "@/lib/timp";
import { SERVICII, STARI, SURSE, type Serviciu, type Stare, type Sursa } from "@/lib/tipuri";

export const PERIOADE = ["azi", "ieri", "7zile", "luna", "tot"] as const;
export const SCURTATURI = ["callback_azi", "callback_intarziat", "nesunate", "ale_mele"] as const;
export type Perioada = (typeof PERIOADE)[number];
export type Scurtatura = (typeof SCURTATURI)[number];
export type Filtru = { q?: string; perioada: Perioada; stare?: Stare; sursa?: Sursa; serviciu?: Serviciu; om?: string; scurtatura?: Scurtatura; pagina: number };

export const ETICHETE_PERIOADA: Record<Perioada, string> = { azi: "Azi", ieri: "Ieri", "7zile": "7 zile", luna: "Luna asta", tot: "Tot" };
export const ETICHETE_SCURTATURA: Record<Scurtatura, string> = {
  callback_azi: "Callback azi",
  callback_intarziat: "Callback întârziat",
  nesunate: "Nesunate",
  ale_mele: "Ale mele",
};

type Parametri = Record<string, string | string[] | undefined>;
const primul = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const din = <T extends string>(lista: readonly T[], v: string | undefined): T | undefined => (lista as readonly string[]).includes(v ?? "") ? (v as T) : undefined;

/** Parametrii din URL → filtrul listei. Ce nu recunoaștem se ignoră. */
export function dinParametri(p: Parametri): Filtru {
  const f: Filtru = { perioada: din(PERIOADE, primul(p.perioada)) ?? "tot", pagina: Math.max(1, Math.floor(Number(primul(p.pagina))) || 1) };
  const q = primul(p.q)?.slice(0, 80);
  if (q) f.q = q;
  const stare = din(STARI, primul(p.stare));
  if (stare) f.stare = stare;
  const sursa = din(SURSE, primul(p.sursa));
  if (sursa) f.sursa = sursa;
  const serviciu = din(SERVICII, primul(p.serviciu));
  if (serviciu) f.serviciu = serviciu;
  const om = primul(p.om);
  // „liber” sau id-ul unui om; pagina îl caută în lista oamenilor
  if (om && /^([0-9a-f-]{36}|liber)$/.test(om)) f.om = om;
  const scurtatura = din(SCURTATURI, primul(p.scurtatura));
  if (scurtatura) f.scurtatura = scurtatura;
  return f;
}

/** Filtrul → „?stare=nou&…”, fără valorile implicite. Cu `schimbari` se fac linkurile filtrelor. */
export function spreParametri(f: Filtru, schimbari: Partial<Record<keyof Filtru, string | number | undefined>> = {}): string {
  const tot = { ...f, ...schimbari } as Record<string, string | number | undefined>;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(tot)) {
    if (v === undefined || v === "" || (k === "perioada" && v === "tot") || (k === "pagina" && Number(v) === 1)) continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Marginile perioadei, cu zilele numărate în ora României. */
export function intervalPerioada(p: Perioada, acum: Date): { de?: Date; pana?: Date } {
  const azi = ziuaRomaniei(acum);
  switch (p) {
    case "azi":
      return { de: laOraRomaniei(azi, "00:00") };
    case "ieri":
      return { de: laOraRomaniei(ziuaPeste(acum, -1), "00:00"), pana: laOraRomaniei(azi, "00:00") };
    case "7zile":
      return { de: laOraRomaniei(ziuaPeste(acum, -6), "00:00") };
    case "luna":
      return { de: laOraRomaniei(`${azi.slice(0, 7)}-01`, "00:00") };
    case "tot":
      return {};
  }
}

/** Ce scrie omul în căutare → bucata de telefon din bază („0700 000 0” → „407000000”). Sub 3 cifre → null. */
export function cautareTelefon(q: string): string | null {
  if (/[a-zA-ZăâîșțĂÂÎȘȚ@]/.test(q)) return null;
  let cifre = q.replace(/\D/g, "");
  if (cifre.length < 3) return null;
  if (cifre.startsWith("00")) cifre = cifre.slice(2);
  else if (cifre.startsWith("0")) cifre = "40" + cifre.slice(1);
  return cifre;
}
