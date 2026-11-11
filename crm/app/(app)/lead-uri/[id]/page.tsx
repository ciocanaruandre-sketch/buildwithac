import { BaraSus } from "@/components/BaraSus";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButoaneActiuni } from "@/components/ButoaneActiuni";
import { ButoaneRand } from "@/components/ButoaneRand";
import { FormularNotita } from "@/components/FormularNotita";
import { MutaLa } from "@/components/MutaLa";
import { StergeLead } from "@/components/StergeLead";
import { Taburi } from "@/components/Taburi";
import { CULOARE_STARE, cand, candLung } from "@/lib/afisare";
import { cerRol } from "@/lib/eu";
import { descrieEveniment, type Eveniment } from "@/lib/parcurs";
import { actiuniPermise } from "@/lib/stari";
import { supabase } from "@/lib/supabase/server";
import { ETICHETE, type Stare } from "@/lib/tipuri";

type Lead = { stare: Stare; caller_id: string | null; callback_la: string | null; incercari: number; motiv: string | null };

/** Ce e de făcut acum, într-o frază. */
function urmeaza(l: Lead, acum: Date, discutie: string | null): string {
  if (!l.caller_id && l.stare === "nou") return "Lead liber: ia-l ca să-l suni.";
  switch (l.stare) {
    case "nou":
      return "Sună-l.";
    case "fara_raspuns":
      return `Sună-l din nou (încercarea ${l.incercari + 1}).`;
    case "a_raspuns":
      return "Programează discuția.";
    case "callback":
      return l.callback_la ? `Callback ${cand(l.callback_la, acum)}${new Date(l.callback_la) < acum ? " · întârziat" : ""}` : "Callback fără oră.";
    case "programat":
      return discutie ?? "Discuție programată.";
    case "oferta_trimisa":
      return "Așteaptă răspunsul la ofertă.";
    case "client":
      return "E client.";
    case "pierdut":
    case "descalificat":
      return `${ETICHETE.stare[l.stare]}${l.motiv ? `: ${l.motiv}` : ""}.`;
  }
}

export default async function FisaLead({ params }: PageProps<"/lead-uri/[id]">) {
  const om = await cerRol("admin", "caller", "closer");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await supabase();
  const acum = new Date();

  const [{ data: l }, { data: oameni }, { data: evenimente }, { data: cereri }, { data: notite }] = await Promise.all([
    db.from("lead_uri").select("*").eq("id", id).maybeSingle(),
    db.from("profiluri").select("id, nume, rol, activ"),
    db.from("evenimente").select("tip, detalii, la, autor_id").eq("lead_id", id).order("la", { ascending: false }).order("id", { ascending: false }),
    db.from("cereri").select("id, sursa, raspunsuri, utm, primita_la").eq("lead_id", id).order("primita_la", { ascending: false }),
    db.from("notite").select("id, text, link_vocal, la, autor_id").eq("lead_id", id).order("la", { ascending: false }),
  ]);
  if (!l) notFound();

  const numeDupaId = new Map((oameni ?? []).map((o) => [o.id, o.nume]));
  const nume = (x: unknown) => (typeof x === "string" ? numeDupaId.get(x) ?? "cineva" : "nimeni");
  const actiuni = actiuniPermise(l, om.rol, om.id);
  const utm = (cereri ?? []).map((c) => c.utm as Record<string, string>).find((u) => u && Object.keys(u).length);

  const { data: discutie } = await db.from("discutii").select("incepe_la, closer_id").eq("lead_id", id).gt("sfarseste_la", acum.toISOString()).order("incepe_la").limit(1).maybeSingle();
  const textDiscutie = discutie ? `Discuție programată: ${candLung(discutie.incepe_la)} cu ${nume(discutie.closer_id)}` : null;

  // fișa clientului o deschide doar Adminul (și constructorii de pe proiect, care nu ajung aici)
  const clientId = l.stare === "client" && om.rol === "admin" ? (await db.from("clienti").select("id").eq("lead_id", id).maybeSingle()).data?.id : undefined;

  const callerii = (oameni ?? []).filter((o) => o.activ && o.rol !== "constructor").map((o) => ({ id: o.id, nume: o.nume }));
  const closerii = (oameni ?? []).filter((o) => o.activ && (o.rol === "closer" || o.rol === "admin")).map((o) => ({ id: o.id, nume: o.nume }));

  const kv = (e: string, v: React.ReactNode) => (
    <div>
      <dt>{e}</dt>
      <dd>{v}</dd>
    </div>
  );

  return (
    <>
      <BaraSus cale={[{ eticheta: "Lead-uri", href: "/lead-uri" }, { eticheta: l.nume }]} />
      <div className="mb-[22px] flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] leading-tight sm:text-[30px]">{l.nume}</h1>
        <span data-testid="stare" className={`chip ${CULOARE_STARE[l.stare]}`}>{ETICHETE.stare[l.stare]}</span>
      </div>

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <div className="panel alerta px-4 py-3.5" data-testid="urmeaza">
            <p className="lbl">Acum / Urmează</p>
            <p className="mt-1.5 text-[15.5px] leading-snug font-semibold tracking-[-.01em]">{urmeaza(l, acum, textDiscutie)}</p>
            {clientId && (
              <Link href={`/clienti/${clientId}`} className="mt-1.5 inline-block text-[13px] text-amber">
                Deschide fișa clientului →
              </Link>
            )}
          </div>

          <div className="panel px-4 pt-3.5 pb-3.5">
            <p className="lbl">Contact</p>
            <dl className="kv mb-3">
              {kv("Telefon", <span className="num">{l.telefon ?? "—"}</span>)}
              {kv("E-mail", l.email ?? "—")}
            </dl>
            <ButoaneRand id={l.id} telefon={l.telefon} telefonNorm={l.telefon_norm} liber={!l.caller_id && actiuni.includes("ia_lead")} />
          </div>

          <div className="panel px-4 pt-3.5 pb-2">
            <p className="lbl">De unde vine</p>
            <dl className="kv">
              {kv("Serviciu", ETICHETE.serviciu[l.serviciu])}
              {kv("Sursă", ETICHETE.sursa[l.sursa])}
              {utm && kv("Reclamă", <span className="font-mono text-[12px]">{Object.entries(utm).map(([k, v]) => `${k.replace("utm_", "")}: ${v}`).join(" · ")}</span>)}
              {kv("Intrat", <span className="num">{cand(l.intrat_la, acum)}</span>)}
            </dl>
          </div>

          <div className="panel px-4 pt-3.5 pb-2">
            <p className="lbl">Oameni</p>
            <dl className="kv">
              {kv("Caller", om.rol === "admin" ? <MutaLa id={l.id} camp="caller_id" eticheta="Mută callerul la" actual={l.caller_id} oameni={callerii} /> : nume(l.caller_id))}
              {kv("Closer", om.rol === "admin" ? <MutaLa id={l.id} camp="closer_id" eticheta="Mută closerul la" actual={l.closer_id} oameni={closerii} /> : nume(l.closer_id))}
            </dl>
          </div>

          {om.rol === "admin" && l.stare !== "client" && <StergeLead id={l.id} />}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <ButoaneActiuni id={l.id} actiuni={actiuni} />
          <Taburi
            taburi={[
              {
                cheie: "parcurs",
                eticheta: "Parcurs",
                numar: evenimente?.length ?? 0,
                continut: (
                  <ol data-testid="parcurs" className="relative flex flex-col pl-[22px] before:absolute before:top-2 before:bottom-5 before:left-[5px] before:w-0.5 before:rounded-full before:bg-seg">
                    {(evenimente ?? []).map((e, i) => (
                      <li
                        key={i}
                        className={`relative pt-1 pb-3.5 text-[13.5px] before:absolute before:top-2 before:-left-[22px] before:h-3 before:w-3 before:rounded-full before:border-2 ${
                          i === 0 ? "before:border-amber before:bg-amber" : "before:border-ink-3 before:bg-bg-3"
                        }`}
                      >
                        <p className="text-[12px] text-ink-3">
                          {cand(e.la, acum)} · {e.autor_id ? nume(e.autor_id) : "automat"}
                        </p>
                        <p>{descrieEveniment(e as Eveniment, nume)}</p>
                      </li>
                    ))}
                  </ol>
                ),
              },
              {
                cheie: "raspunsuri",
                eticheta: "Răspunsuri",
                numar: cereri?.length ?? 0,
                continut: (cereri ?? []).length ? (
                  <div className="flex flex-col gap-4">
                    {(cereri ?? []).map((c) => (
                      <div key={c.id}>
                        <p className="lbl mb-2">{ETICHETE.sursa[c.sursa]} · {cand(c.primita_la, acum)}</p>
                        <dl className="flex flex-col gap-2 text-[13.5px]">
                          {(c.raspunsuri as { intrebare: string; raspuns: string }[]).map((r, i) => (
                            <div key={i}>
                              <dt className="text-ink-3">{r.intrebare}</dt>
                              <dd className="whitespace-pre-wrap">{r.raspuns}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-3">Adăugat de mână: n-are răspunsuri din formular.</p>
                ),
              },
              {
                cheie: "notite",
                eticheta: "Notițe",
                numar: notite?.length ?? 0,
                continut: (
                  <div data-testid="notite">
                    {(actiuni.length > 0 || om.rol === "admin") && <FormularNotita id={l.id} />}
                    {(notite ?? []).map((n) => (
                      <div key={n.id} className="border-b border-line py-3 text-[13.5px] last:border-0">
                        <p className="mb-1 text-[12px] text-ink-3">
                          <span>{nume(n.autor_id)}</span> · {cand(n.la, acum)}
                        </p>
                        <p className="whitespace-pre-wrap">{n.text}</p>
                        {n.link_vocal && (
                          <a href={n.link_vocal} target="_blank" rel="noreferrer" className="mt-1 inline-block text-amber">
                            Notă vocală
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                cheie: "detalii",
                eticheta: "Detalii",
                continut: (
                  <dl className="kv">
                    {kv("Nume", l.nume)}
                    {kv("Telefon", l.telefon ?? "—")}
                    {kv("E-mail", l.email ?? "—")}
                    {kv("Serviciu", ETICHETE.serviciu[l.serviciu])}
                    {kv("Sursă", ETICHETE.sursa[l.sursa])}
                    {kv("Stare", ETICHETE.stare[l.stare])}
                    {kv("Încercări", String(l.incercari))}
                    {kv("Callback", l.callback_la ? cand(l.callback_la, acum) : "—")}
                    {kv("Motiv", l.motiv ?? "—")}
                    {kv("Caller", nume(l.caller_id))}
                    {kv("Closer", nume(l.closer_id))}
                    {kv("Intrat", cand(l.intrat_la, acum))}
                    {kv("Adăugat de", l.creat_de ? nume(l.creat_de) : "formular")}
                  </dl>
                ),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
