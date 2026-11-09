import { FUS, ziuaPeste, ziuaRomaniei } from "@/lib/timp";
import type { Stare } from "@/lib/tipuri";

const ORA = new Intl.DateTimeFormat("ro-RO", { timeZone: FUS, hour: "2-digit", minute: "2-digit" });
const ZI = new Intl.DateTimeFormat("ro-RO", { timeZone: FUS, day: "numeric", month: "short" });
const ZI_SAPT = new Intl.DateTimeFormat("ro-RO", { timeZone: FUS, weekday: "long", day: "numeric", month: "short" });

/** „azi, 16:00”, „mâine, 10:00”, „ieri, 09:12” sau „25 oct., 10:00”, în ora României. */
export function cand(d: Date | string, acum = new Date()): string {
  const x = typeof d === "string" ? new Date(d) : d;
  const zi = ziuaRomaniei(x);
  const ora = ORA.format(x);
  if (zi === ziuaRomaniei(acum)) return `azi, ${ora}`;
  if (zi === ziuaPeste(acum, 1)) return `mâine, ${ora}`;
  if (zi === ziuaPeste(acum, -1)) return `ieri, ${ora}`;
  return `${ZI.format(x)}, ${ora}`;
}

/** „joi, 12 nov., 14:00”. */
export const candLung = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${ZI_SAPT.format(x)}, ${ORA.format(x)}`;
};

/** Culoarea pastilei de stare (clasele .chip din tema.css). */
export const CULOARE_STARE: Record<Stare, "" | "amber" | "green" | "red" | "blue"> = {
  nou: "amber",
  fara_raspuns: "",
  a_raspuns: "blue",
  callback: "amber",
  programat: "blue",
  oferta_trimisa: "blue",
  client: "green",
  pierdut: "red",
  descalificat: "red",
};
