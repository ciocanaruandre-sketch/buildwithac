import { escapa } from "@/lib/email";
import { ETICHETE, type Rol } from "@/lib/tipuri";

/** Rolurile pe care le poate da Adminul. Admin e doar Andrei. */
export const ROLURI_ECHIPA = ["caller", "closer", "constructor"] as const satisfies readonly Rol[];

/** E-mailul de invitație, de la Andrei, cu linkul spre alegerea parolei. */
export function construiesteInvitatie(nume: string, rol: Rol, link: string): { subiect: string; text: string; html: string } {
  const prenume = nume.trim().split(/\s+/)[0];
  const r = ETICHETE.rol[rol];
  const subiect = "Contul tău în CRM-ul buildwithac";
  const text = [
    `Salut, ${prenume}!`,
    "",
    `Ți-am făcut cont în CRM-ul buildwithac, ca ${r}.`,
    "Intră din linkul de mai jos și alege-ți o parolă. Linkul merge o singură dată.",
    "",
    link,
    "",
    "Dacă nu mai merge, scrie-mi și ți-l trimit din nou.",
    "Andrei",
  ].join("\n");
  const html = [
    `<p>Salut, ${escapa(prenume)}!</p>`,
    `<p>Ți-am făcut cont în CRM-ul buildwithac, ca ${escapa(r)}.<br>Intră din linkul de mai jos și alege-ți o parolă. Linkul merge o singură dată.</p>`,
    `<p><a href="${escapa(link)}">Alege-ți parola</a></p>`,
    "<p>Dacă nu mai merge, scrie-mi și ți-l trimit din nou.<br>Andrei</p>",
  ].join("\n");
  return { subiect, text, html };
}
