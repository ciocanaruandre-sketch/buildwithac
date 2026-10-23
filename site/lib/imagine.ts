import type { Ghid } from "./ghiduri";

/** Calea publică a unei imagini a ghidului (din public/ghiduri/<dosar>/). */
export const imagineGhid = (g: Pick<Ghid, "dosar">, fisier: string) => `/ghiduri/${g.dosar}/${fisier}`;
