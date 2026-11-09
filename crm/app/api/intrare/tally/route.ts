import { eFaraContact, primesteCerere } from "@/lib/intrare";
import { trimiteNotificare } from "@/lib/notificare";
import { admin } from "@/lib/supabase/admin";
import { dinTally, verificaSemnaturaTally } from "@/lib/tally";

/**
 * Webhook-ul celor 3 formulare Tally. Tally reîncearcă de 5 ori (până la o zi) dacă nu primește 2xx în 10 s:
 * eroarea de bază de date dă 500 ca să reîncerce; un formular care nu e al nostru dă 200 ca să nu mai insiste.
 */
export async function POST(cerere: Request) {
  const corpBrut = await cerere.text();
  if (!verificaSemnaturaTally(corpBrut, cerere.headers.get("tally-signature"), process.env.TALLY_SECRET ?? "")) {
    return Response.json({ eroare: "semnatura" }, { status: 401 });
  }
  let corp: unknown;
  try {
    corp = JSON.parse(corpBrut);
  } catch {
    return Response.json({ eroare: "invalid" }, { status: 400 });
  }
  const c = dinTally(corp);
  if (!c) return Response.json({ ignorat: true });

  try {
    const r = await primesteCerere(c, admin());
    if (r.decizie !== "duplicat") {
      await trimiteNotificare({ id: r.id, nume: c.nume, telefon: c.telefon, serviciu: c.serviciu, sursa: c.sursa }, r.decizie);
    }
    return Response.json({ id: r.id, decizie: r.decizie });
  } catch (e) {
    if (eFaraContact(e)) {
      // n-avem cum să-l salvăm, dar nu-l pierdem în tăcere: îi spunem lui Andrei
      console.error("intrare/tally: fără telefon și e-mail", c.idExtern);
      await trimiteNotificare({ id: "", nume: `${c.nume} (fără telefon/e-mail, vezi Tally)`, telefon: null, serviciu: c.serviciu, sursa: c.sursa }, "lead_nou");
      return Response.json({ eroare: "fara_contact" }, { status: 200 });
    }
    console.error("intrare/tally", e);
    return Response.json({ eroare: "indisponibil" }, { status: 500 });
  }
}
