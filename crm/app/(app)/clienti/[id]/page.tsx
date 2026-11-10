import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactClient } from "@/components/fisa/ContactClient";
import { DateProiect } from "@/components/fisa/DateProiect";
import { OameniProiect } from "@/components/fisa/OameniProiect";
import { Stadiu } from "@/components/fisa/Stadiu";
import { Taskuri } from "@/components/fisa/Taskuri";
import { Taburi } from "@/components/Taburi";
import { cand, termenLung, termenScurt, ziScurta } from "@/lib/afisare";
import { cerRol } from "@/lib/eu";
import { descrieEveniment, descrieEvenimentProiect, type Eveniment } from "@/lib/parcurs";
import { comision, lei, ordoneazaTaskuri, progres, textIntarziere, urmatorulTask, zileIntarziere } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";
import { linkWhatsApp, normalizeazaTelefon } from "@/lib/telefon";
import { ziuaRomaniei } from "@/lib/timp";
import { ETICHETE } from "@/lib/tipuri";

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

  const antet = (
    <p className="lbl mb-1.5">
      <Link href="/clienti" className="hover:text-ink">Clienți</Link> / fișa
    </p>
  );
  if (!p) {
    return (
      <>
        {antet}
        <h1 className="mb-4 text-[26px] font-bold">{c.nume}</h1>
        <p className="panel px-4 py-6 text-[14px] text-ink-2">Clientul n-are încă niciun proiect.</p>
      </>
    );
  }

  const [{ data: taskuri }, { data: evProiect }, { data: randuri }, { data: colegi }] = await Promise.all([
    db.from("taskuri").select("id, titlu, om_id, termen, gata, gata_la, creat_la").eq("proiect_id", p.id),
    db.from("evenimente_proiect").select("tip, detalii, la, autor_id").eq("proiect_id", p.id),
    // Adminul le vede pe toate; constructorul doar rândul lui, cu procentul lui
    db.from("proiect_oameni").select("om_id, procent").eq("proiect_id", p.id),
    db.rpc("oameni_proiect", { p: p.id }),
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

  const parcurs = [
    ...(evProiect ?? []).map((e) => ({ la: e.la, autor_id: e.autor_id, text: descrieEvenimentProiect(e as Eveniment, nume) })),
    ...evLead.map((e) => ({ la: e.la, autor_id: e.autor_id, text: descrieEveniment(e as Eveniment, nume) })),
  ].sort((a, b) => b.la.localeCompare(a.la));

  const telefonNorm = c.telefon ? normalizeazaTelefon(c.telefon) : null;
  const kv = (e: string, v: React.ReactNode, testid?: string) => (
    <>
      <dt className="text-ink-3">{e}</dt>
      <dd className="min-w-0 break-words" data-testid={testid}>{v}</dd>
    </>
  );

  return (
    <>
      {antet}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold">{c.nume}</h1>
        <span className="chip blue">{p.titlu}</span>
        <span data-testid="stadiu" className="chip amber">{ETICHETE.stadiu[p.stadiu]}</span>
        {p.inchis_la && <span className="chip red">Închis</span>}
        <span className="chip">Client din {ziScurta(c.creat_la)}</span>
      </div>

      {toate.length > 1 && (
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
        </nav>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="panel p-3.5" data-testid="urmeaza">
            <p className="lbl mb-1.5 !text-amber">Urmează</p>
            {urmator ? (
              <>
                <p className="text-[15px] font-medium">{urmator.titlu}</p>
                <p className="text-[12.5px] text-ink-3">
                  {urmator.termen ? `Termen: ${termenLung(urmator.termen)}` : "Fără termen"}
                  {intarziat && <span className="text-[#ff7a66]"> · {intarziat}</span>}
                </p>
              </>
            ) : (
              <p className="text-[15px] font-medium">{pr.total ? "Toate task-urile sunt gata." : "Niciun task încă."}</p>
            )}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pr.procent} aria-label="Progresul proiectului">
              <i className="block h-full" style={{ width: `${pr.procent}%`, background: "var(--grad)" }} />
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-ink-3">
              {pr.gata} din {pr.total} task-uri gata
            </p>
          </div>

          <div className="panel p-3.5" data-testid="contact">
            <p className="lbl mb-2">Contact</p>
            <dl className="mb-3 grid grid-cols-[88px_1fr] gap-x-2.5 gap-y-1.5 text-[13px]">
              {kv("Telefon", <span className="font-mono">{c.telefon ?? "—"}</span>)}
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
              <div className="flex flex-wrap items-center gap-3">
                <ContactClient key={`${c.nume}|${c.telefon}|${c.email}`} clientId={c.id} nume={c.nume} telefon={c.telefon} email={c.email} />
                {c.lead_id && (
                  <Link href={`/lead-uri/${c.lead_id}`} className="text-[13px] text-amber">
                    Fișa de lead →
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="panel p-3.5" data-testid="proiect">
            <p className="lbl mb-2">Proiectul</p>
            <dl className="grid grid-cols-[88px_1fr] items-center gap-x-2.5 gap-y-1.5 text-[13px]">
              {kv("Serviciu", ETICHETE.serviciu[p.serviciu])}
              {kv("Stadiu", <Stadiu key={`${p.id}|${p.stadiu}`} proiectId={p.id} stadiu={p.stadiu} poate={poateStadiu} />)}
              {kv("Preț", <span className="font-mono">{lei(p.pret_lei)}</span>)}
              {kv("Încasat", <span className="font-mono">{lei(p.incasat_lei)}</span>)}
              {kv("Predare", p.termen ? <span className="font-mono text-[12px]">{termenLung(p.termen)}</span> : "—")}
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
                    <span className="font-mono text-[12px]">
                      {procentCitibil(procentulMeu)} · {lei(comisionulMeu)} din ce s-a încasat
                    </span>
                  ),
                )}
              {kv("A venit din", ETICHETE.sursa[c.sursa])}
            </dl>
            {eAdmin && <DateProiect key={`${p.id}|${p.titlu}|${p.pret_lei}|${p.incasat_lei}|${p.termen}`} proiectId={p.id} titlu={p.titlu} pretLei={p.pret_lei} incasatLei={p.incasat_lei} termen={p.termen} />}
          </div>
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
                cheie: "parcurs",
                eticheta: "Parcurs",
                continut: (
                  <ol data-testid="parcurs" className="relative flex flex-col gap-2.5 pl-[18px] before:absolute before:top-1.5 before:bottom-1.5 before:left-1 before:w-px before:bg-line-2">
                    {parcurs.map((e, i) => (
                      <li key={i} className="relative text-[13px] before:absolute before:top-[5px] before:-left-[18px] before:h-[9px] before:w-[9px] before:rounded-full before:border before:border-ink-3 before:bg-bg">
                        <p>{e.text}</p>
                        <p className="font-mono text-[11px] text-ink-3">
                          {cand(e.la, acum)} · {e.autor_id ? nume(e.autor_id) : "automat"}
                        </p>
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
