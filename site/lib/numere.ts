/** 3250 → „3.250”. Scris de mână, nu cu `toLocaleString`: serverul și browserul pot da rezultate diferite. */
export const mii = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Numărul cu substantivul: „1 ghid”, „6 ghiduri”, „20 de ghiduri”, „101 ghiduri”. */
export function cuDe(n: number, singular: string, plural: string): string {
  if (n === 1) return `1 ${singular}`;
  const rest = n % 100;
  return `${mii(n)} ${n === 0 || (rest >= 1 && rest <= 19) ? "" : "de "}${plural}`;
}
