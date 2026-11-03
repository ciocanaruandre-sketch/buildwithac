// browserul trimite mereu Origin la un POST din pagină; un script de pe alt site sau fără Origin nu trece
export function dinSite(cerere: Request): boolean {
  const origine = cerere.headers.get("origin");
  const gazda = cerere.headers.get("x-forwarded-host") ?? cerere.headers.get("host");
  if (!origine || !gazda) return false;
  try { return new URL(origine).host === gazda; } catch { return false; }
}
