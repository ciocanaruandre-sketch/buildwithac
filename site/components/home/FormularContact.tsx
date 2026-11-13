"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SERVICII_CONTACT, serviciuDinLink, verificaCerere, type CampContact, type CheieServiciu } from "@/lib/contact";
import { SITE } from "@/lib/config";
import { useHidratat } from "@/lib/hidratat";
import { limitaTimp } from "@/lib/limita-timp";
import { CHEIE_STOCARE_UTM } from "@/lib/utm";
import "./formular-contact.css";

const GRESELI: Record<CampContact, string> = {
  nume: "Scrie-mi cum te cheamă.",
  telefon: "Numărul nu pare complet. Verifică-l o dată.",
  serviciu: "Alege ce te interesează.",
  descriere: "Descrierea e prea lungă.",
};

/** Cardul „Vrei să colaborăm?” din secțiunea Contact. Cardurile de servicii aleg pastila prin evenimentul „contact:serviciu”. */
/** Din ce link a venit omul (ținut minte de PastreazaUtm). Fără stocare → {}. */
function utmPastrat(): unknown {
  try {
    return JSON.parse(sessionStorage.getItem(CHEIE_STOCARE_UTM) ?? "{}");
  } catch {
    return {};
  }
}

const nimic = () => () => {};

export function FormularContact() {
  const [ales, setServiciu] = useState<CheieServiciu | null>(null);
  // linkul unei reclame poate aduce serviciul deja ales (`?serviciu=`); un clic pe altă pastilă câștigă
  const dinLink = useSyncExternalStore(nimic, () => serviciuDinLink(location.search), () => null);
  const serviciu = ales ?? dinLink;
  const [greseli, setGreseli] = useState<CampContact[]>([]);
  const [stare, setStare] = useState<"trimite" | "ok" | "esec" | null>(null);
  const hidratat = useHidratat();
  const seTrimite = useRef(false);
  const campuri = useRef<Partial<Record<CampContact, HTMLElement | null>>>({});
  const mesajOk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alege = (e: Event) => setServiciu((e as CustomEvent<CheieServiciu>).detail);
    window.addEventListener("contact:serviciu", alege);
    return () => window.removeEventListener("contact:serviciu", alege);
  }, []);

  useEffect(() => { if (stare === "ok") mesajOk.current?.focus(); }, [stare]);

  const arata = (lista: CampContact[]) => {
    setGreseli(lista);
    if (lista.length) campuri.current[lista[0]]?.focus();
  };
  const curata = (camp: CampContact) => setGreseli((g) => g.filter((x) => x !== camp));

  async function trimite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (seTrimite.current) return;
    // citim din câmpuri, nu din stare: pe un telefon lent omul poate scrie înainte ca pagina să fie gata
    const f = new FormData(e.currentTarget);
    const date = { nume: f.get("nume"), telefon: f.get("telefon"), serviciu, descriere: f.get("descriere") ?? "", website: f.get("website") ?? "", utm: utmPastrat() };
    const verificata = verificaCerere(date);
    if ("greseli" in verificata) return arata(verificata.greseli);
    arata([]);
    seTrimite.current = true;
    setStare("trimite");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(date), signal: limitaTimp(20000) });
      const corp = (await r.json()) as { stare?: string; camp?: CampContact };
      if (corp.stare === "ok") return setStare("ok");
      if (corp.stare === "invalid" && corp.camp && GRESELI[corp.camp]) { setStare(null); return arata([corp.camp]); }
      setStare("esec");
    } catch {
      setStare("esec");
    } finally {
      seTrimite.current = false;
    }
  }

  const camp = (c: CampContact) => ({
    "aria-invalid": greseli.includes(c) || undefined,
    "aria-describedby": greseli.includes(c) ? `contact-greseala-${c}` : undefined,
  });
  const greseala = (c: CampContact) =>
    greseli.includes(c) ? <p className="greseala" id={`contact-greseala-${c}`}>{GRESELI[c]}</p> : null;

  return (
    <div className={`fcard${stare === "ok" ? " sent" : ""}`} id="formular">
      {stare === "ok" ? (
        <div className="ok" role="status" tabIndex={-1} ref={mesajOk}>
          <div className="big">Am primit.{" "}<span className="serif gtxt">Mersi!</span></div>
          <div className="hand">te contactez în 1–2 zile</div>
        </div>
      ) : (
        <>
          <h3>Vrei să <span className="serif gtxt">colaborăm?</span></h3>
          <p className="sub">Lasă-mi numele și telefonul, iar eu revin în cel mai scurt timp posibil.</p>
          <form onSubmit={trimite} noValidate>
            <div className="fgrid">
              <div className="fld">
                <label htmlFor="contact-nume">Numele tău</label>
                <input id="contact-nume" name="nume" placeholder="ex. Maria Popescu" autoComplete="name" maxLength={80}
                  ref={(el) => { campuri.current.nume = el; }} onInput={() => curata("nume")} {...camp("nume")} />
                {greseala("nume")}
              </div>
              <div className="fld">
                <label htmlFor="contact-telefon">Telefon</label>
                <input id="contact-telefon" name="telefon" type="tel" inputMode="tel" placeholder="07xx xxx xxx" autoComplete="tel"
                  ref={(el) => { campuri.current.telefon = el; }} onInput={() => curata("telefon")} {...camp("telefon")} />
                {greseala("telefon")}
              </div>
              <div className="fld full">
                <span className="lb" id="contact-serviciu">Serviciu dorit</span>
                <div className="chips" role="group" aria-labelledby="contact-serviciu" {...camp("serviciu")}>
                  {SERVICII_CONTACT.map((s, i) => (
                    <button key={s.cheie} type="button" className="chip" aria-pressed={serviciu === s.cheie}
                      ref={i === 0 ? (el) => { campuri.current.serviciu = el; } : undefined}
                      onClick={() => { setServiciu(s.cheie); curata("serviciu"); }}>
                      {s.eticheta}
                    </button>
                  ))}
                </div>
                {greseala("serviciu")}
              </div>
              <div className="fld full">
                <label htmlFor="contact-descriere">Descriere <span className="opt">(opțional)</span></label>
                <textarea id="contact-descriere" name="descriere" maxLength={1000}
                  placeholder={serviciu === "altceva" ? "Spune-mi ce ai în minte." : "Ce firmă ai și ce ți-ar plăcea să rezolvi."}
                  ref={(el) => { campuri.current.descriere = el; }} onInput={() => curata("descriere")} {...camp("descriere")} />
                {greseala("descriere")}
              </div>
            </div>
            {/* câmp-capcană pentru roboți: ascuns pentru oameni și pentru cititoarele de ecran */}
            <input className="capcana" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="frow">
              <p className="legal">
                Folosesc numele și telefonul doar ca să te contactez despre cererea ta. Detalii în <Link href="/confidentialitate">politica de confidențialitate</Link>.
              </p>
              <button className="btn" type="submit" disabled={!hidratat || stare === "trimite"}>{stare === "trimite" ? "Se trimite…" : "Trimite"}</button>
            </div>
            <p className="mesaj" role="status" aria-live="polite">
              {stare === "esec" && <>Acum nu merge trimiterea. Încearcă puțin mai târziu sau <a href={SITE.instagram.url} target="_blank" rel="noopener">scrie-mi pe Instagram</a>.</>}
            </p>
          </form>
        </>
      )}
    </div>
  );
}
