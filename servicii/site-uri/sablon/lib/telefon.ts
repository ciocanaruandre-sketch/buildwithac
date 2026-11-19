/**
 * Telefoanele din România, scrise oricum („0722 123 456”, „+40 722 123 456”, „0722.123.456”, „021 123 4567”),
 * aduse la forma +40 urmat de 9 cifre. Un număr greșit aruncă eroare, ca testele să-l prindă înainte de site.
 */
export function normalizeazaTelefon(text: string): string {
  let cifre = text.replace(/[\s.\-()]/g, "");
  if (cifre.startsWith("+40")) cifre = cifre.slice(3);
  else if (cifre.startsWith("0040")) cifre = cifre.slice(4);
  else if (cifre.startsWith("40") && cifre.length === 11) cifre = cifre.slice(2);
  else if (cifre.startsWith("0")) cifre = cifre.slice(1);
  if (!/^\d{9}$/.test(cifre)) throw new Error(`Telefon nevalid: ${text}`);
  return `+40${cifre}`;
}

/** Link-ul pentru butonul „Sună”: tel:+40… */
export function linkTelefon(text: string): string {
  return `tel:${normalizeazaTelefon(text)}`;
}

/** Link-ul pentru butonul „WhatsApp”, cu un mesaj scris dinainte, dacă vrei. */
export function linkWhatsapp(text: string, mesaj?: string): string {
  const link = `https://wa.me/${normalizeazaTelefon(text).slice(1)}`;
  return mesaj ? `${link}?text=${encodeURIComponent(mesaj)}` : link;
}
