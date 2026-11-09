/** Telefonul ca șir de cifre, cu prefixul țării: „0721 123 456” și „+40 721 123 456” devin același „40721123456”. */
export function normalizeazaTelefon(t: string): string | null {
  let cifre = (t ?? "").replace(/\D/g, "");
  if (cifre.startsWith("00")) cifre = cifre.slice(2);
  // număr românesc scris fără prefix: 07xx xxx xxx
  else if (cifre.length === 10 && cifre.startsWith("0")) cifre = "40" + cifre.slice(1);
  if (cifre.length < 7 || cifre.length > 15) return null;
  return cifre;
}

export function normalizeazaEmail(e: string | null | undefined): string | null {
  const curat = (e ?? "").trim().toLowerCase();
  return curat.includes("@") ? curat : null;
}

export const linkWhatsApp = (telefonNorm: string) => `https://wa.me/${telefonNorm}`;
export const linkTelefon = (telefonNorm: string) => `tel:+${telefonNorm}`;
