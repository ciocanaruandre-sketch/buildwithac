export const FUS = "Europe/Bucharest";

const ZI = new Intl.DateTimeFormat("en-CA", { timeZone: FUS, year: "numeric", month: "2-digit", day: "2-digit" });
const DECALAJ = new Intl.DateTimeFormat("en-US", { timeZone: FUS, timeZoneName: "longOffset" });

/** Ziua din România, ca „2026-10-25”. */
export const ziuaRomaniei = (d: Date): string => ZI.format(d);

/** Decalajul României față de UTC, în minute, la momentul `d` (120 iarna, 180 vara). */
function decalajMinute(d: Date): number {
  const nume = DECALAJ.formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = nume.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/** Momentul la care ceasul din România arată `zi` `ora`. */
export function laOraRomaniei(zi: string, ora: string): Date {
  const [a, l, z] = zi.split("-").map(Number);
  const [h, min] = ora.split(":").map(Number);
  const caUtc = Date.UTC(a, l - 1, z, h, min);
  // prima aproximare cu decalajul de la acel moment, apoi corectat (granița schimbării orei)
  let t = caUtc - decalajMinute(new Date(caUtc)) * 60_000;
  t = caUtc - decalajMinute(new Date(t)) * 60_000;
  return new Date(t);
}

/** Ziua din România peste `n` zile, ca „2026-10-26”. */
export function ziuaPeste(acum: Date, n: number): string {
  const [a, l, z] = ziuaRomaniei(acum).split("-").map(Number);
  return new Date(Date.UTC(a, l - 1, z + n)).toISOString().slice(0, 10);
}

export type ScurtaturaCallback = "o_ora" | "trei_ore" | "maine_10" | "maine_16" | "doua_zile";

export const ETICHETE_CALLBACK: Record<ScurtaturaCallback, string> = {
  o_ora: "Peste o oră",
  trei_ore: "Peste 3 ore",
  maine_10: "Mâine, 10:00",
  maine_16: "Mâine, 16:00",
  doua_zile: "Poimâine, 10:00",
};

export function scurtaturaCallback(s: ScurtaturaCallback, acum: Date): Date {
  switch (s) {
    case "o_ora":
      return new Date(acum.getTime() + 3_600_000);
    case "trei_ore":
      return new Date(acum.getTime() + 3 * 3_600_000);
    case "maine_10":
      return laOraRomaniei(ziuaPeste(acum, 1), "10:00");
    case "maine_16":
      return laOraRomaniei(ziuaPeste(acum, 1), "16:00");
    case "doua_zile":
      return laOraRomaniei(ziuaPeste(acum, 2), "10:00");
  }
}
