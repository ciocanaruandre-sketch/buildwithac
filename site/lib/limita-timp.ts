/** Semnal care oprește o cerere după `ms`. Safari 15 și mai vechi (iPhone 6s/7/SE) n-au AbortSignal.timeout: acolo cererea merge fără limită, în loc să pice mereu. */
export const limitaTimp = (ms: number): AbortSignal | undefined =>
  typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(ms) : undefined;
