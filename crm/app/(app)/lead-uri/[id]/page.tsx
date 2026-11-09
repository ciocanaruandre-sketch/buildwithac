import Link from "next/link";
import { notFound } from "next/navigation";
import { ButoaneActiuni } from "@/components/ButoaneActiuni";
import { ButoaneRand } from "@/components/ButoaneRand";
import { FormularNotita } from "@/components/FormularNotita";
import { MutaLa } from "@/components/MutaLa";
import { TaburiLead } from "@/components/TaburiLead";
import { CULOARE_STARE, cand } from "@/lib/afisare";
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
      return "E client. Fișa completă vine în etapa 2.";
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

  const textDiscutie: string | null = null;

  const callerii = (oameni ?? []).filter((o) => o.activ && o.rol !== "constructor").map((o) => ({ id: o.id, nume: o.nume }));
  const closerii = (oameni ?? []).filter((o) => o.activ && (o.rol === "closer" || o.rol === "admin")).map((o) => ({ id: o.id, nume: o.nume }));

  const kv = (e: string, v: React.ReactNode) => (
    <>
      <dt className="text-ink-3">{e}</dt>
      <dd className="min-w-0 break-words">{v}</dd>
    </>
  );

  return (
    <>
      <p className="lbl mb-1.5">
        <Link href="/lead-uri" className="hover:text-ink">Lead-uri</Link> / fișa
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold">{l.nume}</h1>
        <span data-testid="stare" className={`chip ${CULOARE_STARE[l.stare]}`}>{ETICHETE.stare[l.stare]}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="panel p-3.5" data-testid="urmeaza">
            <p className="lbl mb-1.5">Acum / Urmează</p>
            <p className="text-[15px] font-medium">{urmeaza(l, acum, textDiscutie)}</p>
          </div>

          <div className="panel p-3.5">
            <p className="lbl mb-2">Contact</p>
            <dl className="mb-3 grid grid-cols-[88px_1fr] gap-x-2.5 gap-y-1.5 text-[13px]">
              {kv("Telefon", <span className="font-mono">{l.telefon ?? "—"}</span>)}
              {kv("E-mail", l.email ?? "—")}
            </dl>
            <ButoaneRand id={l.id} telefon={l.telefon} telefonNorm={l.telefon_norm} liber={!l.caller_id && actiuni.includes("ia_lead")} />
          </div>

          <div className="panel p-3.5">
            <p className="lbl mb-2">De unde vine</p>
            <dl className="grid grid-cols-[88px_1fr] gap-x-2.5 gap-y-1.5 text-[13px]">
              {kv("Serviciu", ETICHETE.serviciu[l.serviciu])}
              {kv("Sursă", ETICHETE.sursa[l.sursa])}
              {utm && kv("Reclamă", <span className="font-mono text-[12px]">{Object.entries(utm).map(([k, v]) => `${k.replace("utm_", "")}: ${v}`).join(" · ")}</span>)}
              {kv("Intrat", <span className="font-mono text-[12px]">{cand(l.intrat_la, acum)}</span>)}
            </dl>
          </div>

          <div className="panel p-3.5">
            <p className="lbl mb-2">Oameni</p>
            <dl className="grid grid-cols-[88px_1fr] items-center gap-x-2.5 gap-y-2 text-[13px]">
              {kv("Caller", om.rol === "admin" ? <MutaLa id={l.id} camp="caller_id" eticheta="Mută callerul la" actual={l.caller_id} oameni={callerii} /> : nume(l.caller_id))}
              {kv("Closer", om.rol === "admin" ? <MutaLa id={l.id} camp="closer_id" eticheta="Mută closerul la" actual={l.closer_id} oameni={closerii} /> : nume(l.closer_id))}
            </dl>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <ButoaneActiuni id={l.id} actiuni={actiuni} />
          <TaburiLead
            taburi={[
              {
                cheie: "parcurs",
                eticheta: "Parcurs",
                numar: evenimente?.length ?? 0,
                continut: (
                  <ol data-testid="parcurs" className="relative flex flex-col gap-2.5 pl-[18px] before:absolute before:top-1.5 before:bottom-1.5 before:left-1 before:w-px before:bg-line-2">
                    {(evenimente ?? []).map((e, i) => (
                      <li key={i} className="relative text-[13px] before:absolute before:top-[5px] before:-left-[18px] before:h-[9px] before:w-[9px] before:rounded-full before:border before:border-ink-3 before:bg-bg">
                        <p>{descrieEveniment(e as Eveniment, nume)}</p>
                        <p className="font-mono text-[11px] text-ink-3">
                          {cand(e.la, acum)} · {e.autor_id ? nume(e.autor_id) : "automat"}
                        </p>
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
                        <dl className="flex flex-col gap-2 text-[13px]">
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
                      <div key={n.id} className="mb-2 border-l-2 border-line-2 bg-[#18181c] px-3 py-2.5 text-[13px]">
                        <p className="mb-1 font-mono text-[11px] text-ink-3">
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
                  <dl className="grid grid-cols-[140px_1fr] gap-x-2.5 gap-y-1.5 text-[13px]">
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
