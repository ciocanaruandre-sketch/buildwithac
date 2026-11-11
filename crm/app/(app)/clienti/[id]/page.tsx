import Link from "next/link";
import { notFound } from "next/navigation";
import { BaraSus } from "@/components/BaraSus";
import { ContactClient } from "@/components/fisa/ContactClient";
import { Conturi } from "@/components/fisa/Conturi";
import { DateProiect } from "@/components/fisa/DateProiect";
import { Livrari } from "@/components/fisa/Livrari";
import { Materiale } from "@/components/fisa/Materiale";
import { Notite } from "@/components/fisa/Notite";
import { InchideProiect } from "@/components/fisa/InchideProiect";
import { OameniProiect } from "@/components/fisa/OameniProiect";
import { ProiectNou } from "@/components/fisa/ProiectNou";
import { Stadiu } from "@/components/fisa/Stadiu";
import { StergeClient } from "@/components/fisa/StergeClient";
import { Taskuri } from "@/components/fisa/Taskuri";
import { Taburi } from "@/components/Taburi";
import { cand, initiale, termenLung, termenScurt, ziScurta } from "@/lib/afisare";
import { cerRol } from "@/lib/eu";
import { desfaCalea, etichetaFisier, marimeCitibila } from "@/lib/fisiere";
import { descrieEveniment, descrieEvenimentProiect, type Eveniment } from "@/lib/parcurs";
import { comision, lei, ordoneazaTaskuri, progres, textIntarziere, urmatorulTask, zileIntarziere } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";
import { linkWhatsApp, normalizeazaTelefon } from "@/lib/telefon";
import { ziuaRomaniei } from "@/lib/timp";
import { ETICHETE, STADII } from "@/lib/tipuri";

const procentCitibil = (p: number) => `${String(p).replace(".", ",")}%`;

/** Fișa clientului (varianta A din prototip). O deschid Adminul și constructorii puși pe un proiect al clientului; ce vede fiecare hotărăște RLS. */
export default async function FisaClient({ params, searchParams }: PageProps<"/clienti/[id]">) {
  const om = await cerRol("admin", "constructor");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const cerut = (await searchParams).proiect;
  const db = await supabase();
  const acum = new Date();
  const azi = ziuaRomaniei(acum);
  const eAdmin = om.rol === "admin";

  const [{ data: c }, { data: proiecte }, { data: profiluri }] = await Promise.all([
    db.from("clienti").select("*").eq("id", id).maybeSingle(),
    db.from("proiecte").select("*").eq("client_id", id).order("creat_la"),
    db.from("profiluri").select("id, nume, rol, activ"),
  ]);
  if (!c) notFound();

  const numeDupaId = new Map((profiluri ?? []).map((o) => [o.id, o.nume]));
  const nume = (x: unknown) => (typeof x === "string" ? numeDupaId.get(x) ?? "cineva" : "nimeni");
  const toate = proiecte ?? [];
  const p = toate.find((x) => x.id === cerut) ?? toate.find((x) => !x.inchis_la) ?? toate[0];

  const antet = <BaraSus cale={[{ eticheta: "Clienți", href: "/clienti" }, { eticheta: c.nume }]} />;
  if (!p) {
    return (
      <>
        {antet}
        <h1 className="mb-4 text-[30px] leading-tight">{c.nume}</h1>
        <p className="panel px-4 py-6 text-[14px] text-ink-2">Clientul n-are încă niciun proiect.</p>
      </>
    );
  }

  const [{ data: taskuri }, { data: evProiect }, { data: randuri }, { data: colegi }, { data: notite }, { data: livrari }, { data: conturi }, { data: materiale }] = await Promise.all([
    db.from("taskuri").select("id, titlu, om_id, termen, gata, gata_la, creat_la").eq("proiect_id", p.id),
    db.from("evenimente_proiect").select("tip, detalii, la, autor_id").eq("proiect_id", p.id),
    // Adminul le vede pe toate; constructorul doar rândul lui, cu procentul lui
    db.from("proiect_oameni").select("om_id, procent").eq("proiect_id", p.id),
    db.rpc("oameni_proiect", { p: p.id }),
    db.from("notite_proiect").select("id, autor_id, text, la").eq("proiect_id", p.id).order("la", { ascending: false }),
    db.from("livrari").select("id, titlu, link, nota, stare, adaugat_la").eq("proiect_id", p.id).order("adaugat_la", { ascending: false }),
    db.from("conturi").select("id, serviciu, cont, al_cui, unde_parola").eq("proiect_id", p.id).order("adaugat_la"),
    db.from("materiale").select("id, titlu, nota, url, cale, marime, adaugat_de, adaugat_la").eq("proiect_id", p.id).order("adaugat_la", { ascending: false }),
  ]);
  const evLead = eAdmin && c.lead_id ? (await db.from("evenimente").select("tip, detalii, la, autor_id").eq("lead_id", c.lead_id)).data ?? [] : [];

  const t = taskuri ?? [];
  const pr = progres(t);
  const urmator = urmatorulTask(t);
  const intarziat = urmator ? textIntarziere(zileIntarziere(urmator.termen, azi)) : "";

  const peProiect = (colegi ?? []).map((r) => r.om_id);
  const oameni = (randuri ?? []).map((r) => ({ id: r.om_id, nume: nume(r.om_id), procent: r.procent })).sort((a, b) => a.nume.localeCompare(b.nume, "ro"));
  const deAdaugat = (profiluri ?? []).filter((o) => o.rol === "constructor" && o.activ && !peProiect.includes(o.id)).map((o) => ({ id: o.id, nume: o.nume }));
  const procentulMeu = (randuri ?? []).find((r) => r.om_id === om.id)?.procent ?? null;
  const comisionulMeu = comision(p.incasat_lei, procentulMeu);
  const poateStadiu = !p.inchis_la || eAdmin;

  // task-urile se dau Adminilor și oamenilor de pe proiect (la fel verifică și baza de date)
  const potPrimiTask = (profiluri ?? [])
    .filter((o) => o.activ && (o.rol === "admin" || peProiect.includes(o.id)))
    .map((o) => ({ id: o.id, nume: o.nume }))
    .sort((a, b) => a.nume.localeCompare(b.nume, "ro"));
  const taskuriAfisate = ordoneazaTaskuri(t).map((x) => ({
    id: x.id,
    titlu: x.titlu,
    om_id: x.om_id,
    termen: x.termen,
    gata: x.gata,
    cine: x.om_id ? nume(x.om_id) : "",
    cand: x.termen ? termenScurt(x.termen) : "",
    intarziat: !x.gata && zileIntarziere(x.termen, azi) > 0,
  }));

  const materialeAfisate = (materiale ?? []).map((m) => ({
    id: m.id,
    titlu: m.titlu,
    nota: m.nota,
    eticheta: m.cale ? etichetaFisier(desfaCalea(m.cale)?.nume ?? "") : "URL",
    // fișierul se descarcă prin ruta noastră (link semnat de 60 s); link-ul se deschide direct
    href: m.cale ? `/materiale/${m.id}` : m.url ?? "#",
    eFisier: Boolean(m.cale),
    cine: m.adaugat_de ? nume(m.adaugat_de) : "cineva",
    cand: ziScurta(m.adaugat_la),
    marime: m.cale && m.marime !== null ? marimeCitibila(m.marime) : null,
  }));

  const parcurs = [
    ...(evProiect ?? []).map((e) => ({ la: e.la, autor_id: e.autor_id, text: descrieEvenimentProiect(e as Eveniment, nume) })),
    ...evLead.map((e) => ({ la: e.la, autor_id: e.autor_id, text: descrieEveniment(e as Eveniment, nume) })),
  ].sort((a, b) => b.la.localeCompare(a.la));

  // clientul a trimis iar formularul de pe site: cererea e mai nouă decât cel mai nou proiect (doar Adminul vede cererile)
  const ultimaCerere = eAdmin && c.lead_id ? (await db.from("cereri").select("primita_la").eq("lead_id", c.lead_id).order("primita_la", { ascending: false }).limit(1).maybeSingle()).data?.primita_la : undefined;
  const celMaiNouProiect = toate.reduce((max, x) => (x.creat_la > max ? x.creat_la : max), "");
  const cerereNoua = ultimaCerere && new Date(ultimaCerere) > new Date(celMaiNouProiect) ? ultimaCerere : null;

  const telefonNorm = c.telefon ? normalizeazaTelefon(c.telefon) : null;
  const kv = (e: string, v: React.ReactNode, testid?: string) => (
    <div>
      <dt>{e}</dt>
      <dd data-testid={testid}>{v}</dd>
    </div>
  );
  const nrStadiu = STADII.indexOf(p.stadiu);

  return (
    <>
      {antet}
      <div className="mb-[22px] flex items-center gap-4">
        <div aria-hidden className="grid h-[60px] w-[60px] flex-none place-items-center rounded-[18px] bg-amber/15 text-[21px] font-semibold tracking-[-.02em] text-amber">
          {initiale(c.nume)}
        </div>
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight sm:text-[30px]">{c.nume}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip blue">{p.titlu}</span>
            <span data-testid="stadiu" className="chip amber">
              <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
              {ETICHETE.stadiu[p.stadiu]}
            </span>
            {p.inchis_la && <span data-testid="inchis" className="chip red">Închis</span>}
            <span className="chip">Client din {ziScurta(c.creat_la)}</span>
          </div>
        </div>
      </div>

      {cerereNoua && c.lead_id && (
        <div data-testid="cerere-noua" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 alerta px-3.5 py-2.5 text-[13px]">
          <b className="text-amber">Cerere nouă · {cand(cerereNoua, acum)}.</b>
          <span className="text-ink-2">Clientul a trimis iar formularul. Răspunsurile sunt în fișa de lead; dacă e alt proiect, adaugă-l cu „+ Proiect nou”.</span>
          <Link href={`/lead-uri/${c.lead_id}`} className="text-amber">
            Fișa de lead →
          </Link>
        </div>
      )}

      {(toate.length > 1 || eAdmin) && (
        <nav aria-label="Proiecte" className="mb-4 flex flex-wrap items-center gap-2">
          <span className="lbl">Proiecte</span>
          {toate.map((x) => (
            <Link
              key={x.id}
              href={{ pathname: `/clienti/${c.id}`, query: { proiect: x.id } }}
              aria-current={x.id === p.id ? "page" : undefined}
              className={`chip ${x.id === p.id ? "amber" : ""}`}
            >
              {x.titlu}
              {x.inchis_la ? " · închis" : ""}
            </Link>
          ))}
          {eAdmin && <ProiectNou clientId={c.id} />}
        </nav>
      )}

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <div className="panel alerta px-4 py-3.5" data-testid="urmeaza">
            <p className="lbl">Urmează</p>
            {urmator ? (
              <>
                <p className="mt-1.5 mb-0.5 text-[15.5px] leading-snug font-semibold tracking-[-.01em]">{urmator.titlu}</p>
                <p className="text-[12.5px] text-ink-3">
                  {urmator.termen ? `Termen: ${termenLung(urmator.termen)}` : "Fără termen"}
                  {intarziat && <span className="text-red-t"> · {intarziat}</span>}
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-[15.5px] font-semibold tracking-[-.01em]">{pr.total ? "Toate task-urile sunt gata." : "Niciun task încă."}</p>
            )}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-seg" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pr.procent} aria-label="Progresul proiectului">
              <i className="block h-full rounded-full" style={{ width: `${pr.procent}%`, background: "var(--grad)" }} />
            </div>
            <p className="num mt-1.5 text-[12px] text-ink-3">
              {pr.gata} din {pr.total} task-uri gata
            </p>
          </div>

          <div className="panel px-4 pt-3.5 pb-2" data-testid="contact">
            <p className="lbl">Contact</p>
            <dl className="kv">
              {kv("Telefon", <span className="num">{c.telefon ?? "—"}</span>)}
              {kv("E-mail", c.email ?? "—")}
              {telefonNorm &&
                kv(
                  "WhatsApp",
                  <a className="text-amber" href={linkWhatsApp(telefonNorm)} target="_blank" rel="noreferrer">
                    deschide →
                  </a>,
                )}
            </dl>
            {eAdmin && (
              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3 pb-1.5">
                <ContactClient key={`${c.nume}|${c.telefon}|${c.email}`} clientId={c.id} nume={c.nume} telefon={c.telefon} email={c.email} />
                {c.lead_id && (
                  <Link href={`/lead-uri/${c.lead_id}`} className="text-[13px] text-amber">
                    Fișa de lead →
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="panel px-4 pt-3.5 pb-2" data-testid="proiect">
            <p className="lbl">Proiectul</p>
            <div aria-hidden className="mt-2 mb-1.5 grid grid-cols-6 gap-1">
              {STADII.map((s, i) => (
                <i key={s} className={`h-1.5 rounded-full ${i < nrStadiu ? "bg-amber/45" : i === nrStadiu ? "bg-amber" : "bg-seg"}`} />
              ))}
            </div>
            <p className="num text-[12.5px] text-ink-3">
              {ETICHETE.stadiu[p.stadiu]} · stadiul {nrStadiu + 1} din {STADII.length}
            </p>
            <dl className="kv">
              {kv("Serviciu", ETICHETE.serviciu[p.serviciu])}
              {kv("Stadiu", <Stadiu key={`${p.id}|${p.stadiu}`} proiectId={p.id} stadiu={p.stadiu} poate={poateStadiu} />)}
              {kv("Preț", <span className="num">{lei(p.pret_lei)}</span>)}
              {kv("Încasat", <span className="num">{lei(p.incasat_lei)}</span>)}
              {kv("Predare", p.termen ? <span className="num">{termenLung(p.termen)}</span> : "—")}
              {kv(
                "Lucrează",
                eAdmin ? (
                  <OameniProiect key={p.id} proiectId={p.id} oameni={oameni} deAdaugat={deAdaugat} />
                ) : (
                  peProiect.map((x) => nume(x)).sort((a, b) => a.localeCompare(b, "ro")).join(", ") || "—"
                ),
                "lucreaza",
              )}
              {!eAdmin &&
                kv(
                  "Comisionul tău",
                  procentulMeu === null || comisionulMeu === null ? (
                    <span className="text-ink-3">nestabilit încă</span>
                  ) : (
                    <span className="num">
                      {procentCitibil(procentulMeu)} · {lei(comisionulMeu)} din ce s-a încasat
                    </span>
                  ),
                )}
              {kv("A venit din", ETICHETE.sursa[c.sursa])}
            </dl>
            {eAdmin && (
              <div className="flex flex-wrap items-start gap-x-2 border-t border-line pt-3 pb-1.5">
                <DateProiect key={`${p.id}|${p.titlu}|${p.pret_lei}|${p.incasat_lei}|${p.termen}`} proiectId={p.id} titlu={p.titlu} pretLei={p.pret_lei} incasatLei={p.incasat_lei} termen={p.termen} />
                <InchideProiect proiectId={p.id} inchis={Boolean(p.inchis_la)} />
              </div>
            )}
          </div>

          {eAdmin && <StergeClient clientId={c.id} />}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Taburi
            key={p.id}
            taburi={[
              {
                cheie: "taskuri",
                eticheta: "Task-uri",
                numar: t.length,
                continut: <Taskuri proiectId={p.id} taskuri={taskuriAfisate} oameni={potPrimiTask} />,
              },
              {
                cheie: "materiale",
                eticheta: "Materiale",
                numar: materiale?.length ?? 0,
                continut: <Materiale proiectId={p.id} materiale={materialeAfisate} />,
              },
              {
                cheie: "conturi",
                eticheta: "Conturi",
                numar: conturi?.length ?? 0,
                continut: <Conturi proiectId={p.id} conturi={conturi ?? []} />,
              },
              {
                cheie: "livrat",
                eticheta: "Livrat",
                numar: livrari?.length ?? 0,
                continut: <Livrari proiectId={p.id} livrari={(livrari ?? []).map((l) => ({ id: l.id, titlu: l.titlu, link: l.link, nota: l.nota, stare: l.stare, cand: ziScurta(l.adaugat_la) }))} />,
              },
              {
                cheie: "notite",
                eticheta: "Notițe",
                numar: notite?.length ?? 0,
                continut: (
                  <Notite
                    proiectId={p.id}
                    poateSterge={eAdmin}
                    notite={(notite ?? []).map((n) => ({ id: n.id, autor: n.autor_id ? nume(n.autor_id) : "cineva", cand: cand(n.la, acum), text: n.text }))}
                  />
                ),
              },
              {
                cheie: "parcurs",
                eticheta: "Parcurs",
                continut: (
                  <ol data-testid="parcurs" className="relative flex flex-col pl-[22px] before:absolute before:top-2 before:bottom-5 before:left-[5px] before:w-0.5 before:rounded-full before:bg-seg">
                    {parcurs.map((e, i) => (
                      <li
                        key={i}
                        className={`relative pt-1 pb-3.5 text-[13.5px] before:absolute before:top-2 before:-left-[22px] before:h-3 before:w-3 before:rounded-full before:border-2 ${
                          i === 0 ? "before:border-amber before:bg-amber" : "before:border-ink-3 before:bg-bg-3"
                        }`}
                      >
                        <p className="text-[12px] text-ink-3">
                          {cand(e.la, acum)} · {e.autor_id ? nume(e.autor_id) : "automat"}
                        </p>
                        <p>{e.text}</p>
                      </li>
                    ))}
                  </ol>
                ),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
