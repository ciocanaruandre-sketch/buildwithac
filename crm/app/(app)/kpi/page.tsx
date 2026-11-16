import Link from "next/link";
import { Ascuns } from "@/components/Ascuns";
import { BaraSus } from "@/components/BaraSus";
import { BareLuni } from "@/components/kpi/BareLuni";
import { CardOm, type Mini } from "@/components/kpi/CardOm";
import { ListaBare } from "@/components/kpi/ListaBare";
import { Palnie } from "@/components/kpi/Palnie";
import { Panou, Placa, Placi, Sageata } from "@/components/kpi/Placa";
import { TabelOameni } from "@/components/kpi/TabelOameni";
import { eu } from "@/lib/eu";
import {
  afiseaza,
  comparatie,
  durata,
  ETICHETA_PERIOADA,
  FATA_DE,
  lei,
  numar,
  parsezaPerioada,
  PERIOADE,
  rata,
  sectiuniPentru,
  TITLU_SECTIUNE,
  zile,
  type Perioada,
  type Sectiune,
} from "@/lib/kpi";
import { citesteKpi, type DateKpi, type KpiApeluri, type KpiInchideri, type KpiProiecte, type OmKpi } from "@/lib/kpi-date";
import { ETICHETA_MOTIV, type MotivCategorie } from "@/lib/motive";
import { supabase } from "@/lib/supabase/server";
import { ETICHETE, type Sursa } from "@/lib/tipuri";

const LUNA = new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", month: "short" });
const numarIntreg = (n: number) => String(Math.round(n));
const sumaLei = (n: number | null) => (n === null ? "—" : <Ascuns>{lei(n)}</Ascuns>);

/** Rândul unui om (sau totalul, la `null`) din rezultatul unei funcții. */
function rand<T extends { om_id: string | null }>(r: T[], om: string | null): T | null {
  return r.find((x) => x.om_id === om) ?? null;
}

// ───────────── plăcile secțiunilor ─────────────

function PlaciApeluri({ a, b, fataDe }: { a: KpiApeluri | null; b: KpiApeluri | null; fataDe: string }) {
  // pe răspunsurile perioadei: cine a răspuns acum și s-a programat (și după), ca să nu treacă de 100%
  const ra = a ? rata(a.programate_din_raspuns, a.au_raspuns) : null;
  const rb = b ? rata(b.programate_din_raspuns, b.au_raspuns) : null;
  return (
    <Placi>
      <Placa eticheta="Apeluri" valoare={a?.apeluri ?? 0} comparatie={comparatie(a?.apeluri ?? 0, b?.apeluri ?? 0, "sus", "procent")} fataDe={fataDe} />
      <Placa eticheta="Discuții programate" valoare={a?.programate ?? 0} comparatie={comparatie(a?.programate ?? 0, b?.programate ?? 0, "sus", "procent")} fataDe={fataDe} />
      <Placa
        eticheta="Rata de programare"
        valoare={afiseaza(ra, numarIntreg)}
        unitate={ra === null ? undefined : "%"}
        comparatie={comparatie(ra, rb, "sus", "pp")}
        fataDe={fataDe}
        explicatie={`${a?.programate_din_raspuns ?? 0} din ${a?.au_raspuns ?? 0} care au răspuns s-au programat`}
      />
      <Placa
        eticheta="Timp până la primul apel"
        valoare={afiseaza(a?.minute_primul_apel, durata)}
        comparatie={comparatie(a?.minute_primul_apel ?? null, b?.minute_primul_apel ?? null, "jos", "valoare", durata)}
        fataDe={fataDe}
        explicatie="de la intrarea lead-ului; valoarea din mijlocul listei"
      />
      <Placa eticheta="Nesunate peste 24 h" valoare={a?.nesunate_24h ?? 0} comparatie={comparatie(a?.nesunate_24h ?? 0, b?.nesunate_24h ?? 0, "jos", "valoare")} fataDe={fataDe} />
      <Placa
        eticheta="Încercări până răspunde"
        valoare={afiseaza(a?.incercari_pana_raspunde, numar)}
        comparatie={comparatie(a?.incercari_pana_raspunde ?? null, b?.incercari_pana_raspunde ?? null, "jos", "valoare", numar)}
        fataDe={fataDe}
      />
    </Placi>
  );
}

function PlaciInchideri({ a, b, fataDe, cuBani }: { a: KpiInchideri | null; b: KpiInchideri | null; fataDe: string; cuBani: boolean }) {
  const pa = a ? rata(a.au_venit, a.programate) : null;
  const pb = b ? rata(b.au_venit, b.programate) : null;
  // pe discuțiile perioadei: câte s-au făcut clienți (și după perioadă), ca să nu treacă de 100%
  const ia = a ? rata(a.clienti_din_discutii, a.au_venit) : null;
  const ib = b ? rata(b.clienti_din_discutii, b.au_venit) : null;
  return (
    <Placi>
      <Placa eticheta="Discuții ținute" valoare={a?.au_venit ?? 0} comparatie={comparatie(a?.au_venit ?? 0, b?.au_venit ?? 0, "sus", "procent")} fataDe={fataDe} />
      <Placa
        eticheta="Rata de prezentare"
        valoare={afiseaza(pa, numarIntreg)}
        unitate={pa === null ? undefined : "%"}
        comparatie={comparatie(pa, pb, "sus", "pp")}
        fataDe={fataDe}
        explicatie={`${a?.au_venit ?? 0} ținute din ${a?.programate ?? 0} programate`}
      />
      <Placa
        eticheta="Rata de închidere"
        valoare={afiseaza(ia, numarIntreg)}
        unitate={ia === null ? undefined : "%"}
        comparatie={comparatie(ia, ib, "sus", "pp")}
        fataDe={fataDe}
        explicatie={`din ${a?.au_venit ?? 0} discuții ținute, ${a?.clienti_din_discutii ?? 0} s-au făcut clienți`}
      />
      {cuBani && (
        <Placa
          eticheta="Vândut"
          valoare={sumaLei(a?.vandut_lei ?? 0)}
          comparatie={comparatie(a?.vandut_lei ?? 0, b?.vandut_lei ?? 0, "sus", "procent")}
          fataDe={fataDe}
          explicatie={a?.fara_pret ? `${a.fara_pret} ${a.fara_pret === 1 ? "proiect" : "proiecte"} fără preț` : undefined}
        />
      )}
      <Placa
        eticheta="De la discuție la client"
        valoare={afiseaza(a?.zile_pana_la_client, zile)}
        comparatie={comparatie(a?.zile_pana_la_client ?? null, b?.zile_pana_la_client ?? null, "jos", "valoare", zile)}
        fataDe={fataDe}
      />
    </Placi>
  );
}

function PlaciProiecte({ a, b, fataDe }: { a: KpiProiecte | null; b: KpiProiecte | null; fataDe: string }) {
  const ra = a ? rata(a.livrari_refacute, a.livrari_trimise) : null;
  const rb = b ? rata(b.livrari_refacute, b.livrari_trimise) : null;
  const ta = a ? rata(a.taskuri_la_termen, a.taskuri_cu_termen) : null;
  const tb = b ? rata(b.taskuri_la_termen, b.taskuri_cu_termen) : null;
  return (
    <Placi>
      <Placa eticheta="Proiecte livrate" valoare={a?.livrate ?? 0} comparatie={comparatie(a?.livrate ?? 0, b?.livrate ?? 0, "sus", "procent")} fataDe={fataDe} />
      <Placa
        eticheta="Durata unui proiect"
        valoare={afiseaza(a?.zile_durata, zile)}
        comparatie={comparatie(a?.zile_durata ?? null, b?.zile_durata ?? null, "jos", "valoare", zile)}
        fataDe={fataDe}
        explicatie="de la proiect nou la livrat"
      />
      <Placa
        eticheta="Livrări de refăcut"
        valoare={afiseaza(ra, numarIntreg)}
        unitate={ra === null ? undefined : "%"}
        comparatie={comparatie(ra, rb, "jos", "pp")}
        fataDe={fataDe}
        explicatie={`${a?.livrari_refacute ?? 0} din ${a?.livrari_trimise ?? 0} trimise clientului`}
      />
      <Placa
        eticheta="Task-uri gata la termen"
        valoare={afiseaza(ta, numarIntreg)}
        unitate={ta === null ? undefined : "%"}
        comparatie={comparatie(ta, tb, "sus", "pp")}
        fataDe={fataDe}
        explicatie={`${a?.taskuri_la_termen ?? 0} din ${a?.taskuri_cu_termen ?? 0}`}
      />
    </Placi>
  );
}

// ───────────── cardurile echipei ─────────────

const miniSageata = (c: ReturnType<typeof comparatie>) => (c ? <Sageata c={c} /> : null);

function miniOm(d: DateKpi, om: OmKpi, cuBani: boolean): Mini[] {
  const m: Mini[] = [];
  const ap = rand(d.acum.apeluri, om.id);
  const apAnt = rand(d.ant.apeluri, om.id);
  const inc = rand(d.acum.inchideri, om.id);
  const pr = rand(d.acum.proiecte, om.id);
  const areApeluri = ap && (ap.apeluri || ap.programate || ap.minute_primul_apel !== null);
  const areInchideri = inc && (inc.programate || inc.clienti || inc.vandut_lei);
  const areProiecte = pr && (pr.livrate || pr.livrari_trimise || pr.taskuri_cu_termen);
  if (areApeluri) {
    const r = rata(ap.programate_din_raspuns, ap.au_raspuns);
    m.push(
      { eticheta: "Apeluri", valoare: ap.apeluri, nota: miniSageata(comparatie(ap.apeluri, apAnt?.apeluri ?? 0, "sus", "procent")) },
      { eticheta: "Programate", valoare: ap.programate, nota: r === null ? null : `${r}% din răspunsuri` },
      { eticheta: "Primul apel", valoare: afiseaza(ap.minute_primul_apel, durata) },
    );
  }
  if (areInchideri) {
    const p = rata(inc.au_venit, inc.programate);
    m.push(
      { eticheta: "Discuții ținute", valoare: p === null ? "—" : `${p}%`, nota: `${inc.au_venit} din ${inc.programate}` },
      { eticheta: "Clienți", valoare: inc.clienti },
    );
    if (cuBani) m.push({ eticheta: "Vândut", valoare: sumaLei(inc.vandut_lei) });
  }
  if (areProiecte) {
    const ref = rata(pr.livrari_refacute, pr.livrari_trimise);
    const ter = rata(pr.taskuri_la_termen, pr.taskuri_cu_termen);
    m.push(
      { eticheta: "Livrate", valoare: pr.livrate },
      { eticheta: "De refăcut", valoare: ref === null ? "—" : `${ref}%` },
      { eticheta: "La termen", valoare: ter === null ? "—" : `${ter}%` },
    );
  }
  return m;
}

/** Plăcile unui om, pe rolul lui (Adminul: tot ce are). */
function PanouOm({ d, om, fataDe, eticheta }: { d: DateKpi; om: OmKpi; fataDe: string; eticheta: string }) {
  const ap = rand(d.acum.apeluri, om.id);
  const inc = rand(d.acum.inchideri, om.id);
  const pr = rand(d.acum.proiecte, om.id);
  const arata = {
    apeluri: om.rol === "caller" || (om.rol === "admin" && ap),
    inchideri: om.rol === "closer" || (om.rol === "admin" && inc),
    proiecte: om.rol === "constructor" || (om.rol === "admin" && pr),
  };
  const sep = (t: string) => <p className="mt-4 mb-2 text-[11px] font-semibold tracking-[.06em] text-ink-3 uppercase">{t}</p>;
  return (
    <div data-testid="panou-om">
      <Panou titlu={`${om.nume} · ${eticheta.toLowerCase()}`} ce="Dă clic din nou pe card ca să închizi.">
        {arata.apeluri && (
          <>
            {sep("Apeluri")}
            <PlaciApeluri a={ap} b={rand(d.ant.apeluri, om.id)} fataDe={fataDe} />
          </>
        )}
        {arata.inchideri && (
          <>
            {sep("Discuții")}
            <PlaciInchideri a={inc} b={rand(d.ant.inchideri, om.id)} fataDe={fataDe} cuBani />
          </>
        )}
        {arata.proiecte && (
          <>
            {sep("Proiecte")}
            <PlaciProiecte a={pr} b={rand(d.ant.proiecte, om.id)} fataDe={fataDe} />
          </>
        )}
        {!arata.apeluri && !arata.inchideri && !arata.proiecte && <p className="text-[12.5px] text-ink-3">Nimic în perioada asta.</p>}
      </Panou>
    </div>
  );
}

// ───────────── secțiunile ─────────────

function Pierderi({ d }: { d: DateKpi }) {
  const lista = (stare: "pierdut" | "descalificat") =>
    d.acum.pierderi.filter((x) => x.stare === stare).map((x) => ({ eticheta: ETICHETA_MOTIV[x.categorie as MotivCategorie] ?? x.categorie, nr: x.nr }));
  const sep = (t: string) => <p className="mt-3 mb-1.5 text-[11px] font-semibold tracking-[.06em] text-ink-3 uppercase first:mt-0">{t}</p>;
  return (
    <>
      {sep("Pierdute")}
      <ListaBare randuri={lista("pierdut")} />
      {sep("Descalificate")}
      <ListaBare randuri={lista("descalificat")} />
    </>
  );
}

function Sectiunea({ s, d, rol, eu: omul, fataDe, numeOm }: { s: Sectiune; d: DateKpi; rol: OmKpi["rol"]; eu: OmKpi; fataDe: string; numeOm: Map<string, OmKpi> }) {
  const admin = rol === "admin";
  const cine = admin ? null : omul.id;
  const pe = (r: { om_id: string | null }[]) =>
    r.flatMap((x) => (x.om_id && numeOm.get(x.om_id) ? [numeOm.get(x.om_id)!] : [])).sort((a, b) => a.nume.localeCompare(b.nume, "ro"));

  switch (s) {
    case "palnie": {
      const p = d.acum.palnie;
      const pasi = [
        { eticheta: "Lead-uri noi", nr: p?.intrari ?? 0 },
        { eticheta: "Sunate", nr: p?.sunate ?? 0 },
        { eticheta: "Au răspuns", nr: p?.au_raspuns ?? 0 },
        { eticheta: "Discuție programată", nr: p?.programate ?? 0 },
        { eticheta: "Discuții ținute", nr: p?.au_venit ?? 0 },
        { eticheta: "Ofertă trimisă", nr: p?.oferta ?? 0 },
        { eticheta: "Clienți", nr: p?.clienti ?? 0 },
      ];
      return (
        <div className="grid gap-3.5 lg:grid-cols-[1.7fr_1fr]">
          <Panou ce="Ce s-a întâmplat cu lead-urile intrate în perioadă.">
            <Palnie pasi={pasi} />
          </Panou>
          <Panou titlu="Clienți noi pe lună" ce="Ultimele 6 luni.">
            <BareLuni luni={(d.luni ?? []).map((l) => ({ eticheta: LUNA.format(new Date(`${l.luna}T00:00:00Z`)).replace(".", ""), valoare: l.clienti_noi, text: l.clienti_noi }))} />
          </Panou>
        </div>
      );
    }
    case "apeluri": {
      const t = rand(d.acum.apeluri, cine);
      return (
        <div className="flex flex-col gap-3.5">
          <PlaciApeluri a={t} b={rand(d.ant.apeluri, cine)} fataDe={fataDe} />
          {admin && (
            <Panou titlu="Pe oameni">
              <TabelOameni
                coloane={["Cine sună", "Lead-uri luate", "Apeluri", "Programate", "Rata", "Primul apel", "Nesunate 24 h"]}
                randuri={pe(d.acum.apeluri).map((o) => {
                  const r = rand(d.acum.apeluri, o.id)!;
                  return { ...o, celule: [r.luate, r.apeluri, r.programate, afiseaza(rata(r.programate, r.au_raspuns), (n) => `${n}%`), afiseaza(r.minute_primul_apel, durata), r.nesunate_24h] };
                })}
                total={t && [t.luate, t.apeluri, t.programate, afiseaza(rata(t.programate, t.au_raspuns), (n) => `${n}%`), afiseaza(t.minute_primul_apel, durata), t.nesunate_24h]}
              />
            </Panou>
          )}
        </div>
      );
    }
    case "inchideri": {
      const t = rand(d.acum.inchideri, cine);
      return (
        <div className="flex flex-col gap-3.5">
          <PlaciInchideri a={t} b={rand(d.ant.inchideri, cine)} fataDe={fataDe} cuBani={admin} />
          {admin && (
            <Panou titlu="Pe oameni">
              <TabelOameni
                coloane={["Cine închide", "Programate", "Discuții ținute", "Clienți", "Vândut"]}
                randuri={pe(d.acum.inchideri).map((o) => {
                  const r = rand(d.acum.inchideri, o.id)!;
                  return { ...o, celule: [r.programate, `${r.au_venit} · ${afiseaza(rata(r.au_venit, r.programate), (n) => `${n}%`)}`, r.clienti, sumaLei(r.vandut_lei)] };
                })}
                total={t && [t.programate, `${t.au_venit} · ${afiseaza(rata(t.au_venit, t.programate), (n) => `${n}%`)}`, t.clienti, sumaLei(t.vandut_lei)]}
              />
            </Panou>
          )}
        </div>
      );
    }
    case "pierderi":
      return admin ? (
        <div className="grid gap-3.5 lg:grid-cols-2">
          <Panou titlu="De ce pierzi" ce="Motivele de la „Pierdut” și „Descalificat”, cele mai dese primele.">
            <Pierderi d={d} />
          </Panou>
          <Panou titlu="De unde vin" ce="Lead-uri pe sursă, cu clienții ieșiți din ele.">
            <ListaBare
              randuri={d.acum.surse.map((x) => ({
                eticheta: ETICHETE.sursa[x.sursa as Sursa] ?? x.sursa,
                nr: x.intrari,
                nota: `${x.clienti} ${x.clienti === 1 ? "client" : "clienți"}`,
              }))}
            />
          </Panou>
        </div>
      ) : (
        <Panou ce="Motivele de la „Pierdut”, doar la lead-urile tale.">
          <Pierderi d={d} />
        </Panou>
      );
    case "proiecte": {
      const t = rand(d.acum.proiecte, cine);
      return (
        <div className="flex flex-col gap-3.5">
          <PlaciProiecte a={t} b={rand(d.ant.proiecte, cine)} fataDe={fataDe} />
          {admin && (
            <Panou titlu="Pe oameni">
              <TabelOameni
                coloane={["Cine construiește", "Livrate", "Durata", "De refăcut", "La termen"]}
                randuri={pe(d.acum.proiecte).map((o) => {
                  const r = rand(d.acum.proiecte, o.id)!;
                  return {
                    ...o,
                    celule: [r.livrate, afiseaza(r.zile_durata, zile), afiseaza(rata(r.livrari_refacute, r.livrari_trimise), (n) => `${n}%`), afiseaza(rata(r.taskuri_la_termen, r.taskuri_cu_termen), (n) => `${n}%`)],
                  };
                })}
                total={
                  t && [t.livrate, afiseaza(t.zile_durata, zile), afiseaza(rata(t.livrari_refacute, t.livrari_trimise), (n) => `${n}%`), afiseaza(rata(t.taskuri_la_termen, t.taskuri_cu_termen), (n) => `${n}%`)]
                }
              />
            </Panou>
          )}
        </div>
      );
    }
    case "bani": {
      const a = d.acum.bani;
      const b = d.ant.bani;
      return (
        <div className="flex flex-col gap-3.5">
          <Placi>
            <Placa eticheta="Încasat" valoare={sumaLei(a?.incasat_lei ?? 0)} comparatie={comparatie(a?.incasat_lei ?? 0, b?.incasat_lei ?? 0, "sus", "procent")} fataDe={fataDe} />
            <Placa
              eticheta="Mentenanță pe lună"
              valoare={sumaLei(a?.mentenanta_lei ?? 0)}
              comparatie={comparatie(a?.mentenanta_lei ?? 0, b?.mentenanta_lei ?? 0, "sus", "procent")}
              fataDe={fataDe}
              explicatie="venitul care se repetă lunar"
            />
            <Placa
              eticheta="Valoarea medie a unui proiect"
              valoare={sumaLei(a?.valoare_medie_lei ?? null)}
              comparatie={comparatie(a?.valoare_medie_lei ?? null, b?.valoare_medie_lei ?? null, "sus", "procent")}
              fataDe={fataDe}
            />
            <Placa
              eticheta="Tranșe întârziate"
              valoare={a?.transe_intarziate ?? 0}
              explicatie={a?.intarziat_lei ? <>{sumaLei(a.intarziat_lei)} de încasat, acum</> : "acum"}
            />
          </Placi>
          <Panou titlu="Încasat pe lună" ce="Ultimele 6 luni.">
            <BareLuni luni={(d.luni ?? []).map((l) => ({ eticheta: LUNA.format(new Date(`${l.luna}T00:00:00Z`)).replace(".", ""), valoare: l.incasat_lei, text: sumaLei(l.incasat_lei) }))} />
          </Panou>
        </div>
      );
    }
  }
}

// ───────────── pagina ─────────────

export default async function Kpi({ searchParams }: PageProps<"/kpi">) {
  const omul = await eu();
  const q = await searchParams;
  const p: Perioada = parsezaPerioada(typeof q.p === "string" ? q.p : undefined);
  const admin = omul.rol === "admin";
  const db = await supabase();
  const d = await citesteKpi(db, omul.rol, omul, p, new Date());
  const numeOm = new Map(d.oameni.map((o) => [o.id, o]));
  // `om` din link contează doar la Admin și doar pentru un om activ
  const ales = admin && typeof q.om === "string" ? numeOm.get(q.om) ?? null : null;
  const fataDe = FATA_DE[p];
  const link = (x: { p?: Perioada; om?: string | null }) => {
    const s = new URLSearchParams();
    const per = x.p ?? p;
    if (per !== "luna") s.set("p", per);
    const om = x.om === undefined ? ales?.id : x.om;
    if (om) s.set("om", om);
    const t = s.toString();
    return t ? `/kpi?${t}` : "/kpi";
  };
  const titluSectiune = (s: Sectiune) => (admin ? TITLU_SECTIUNE[s].admin : TITLU_SECTIUNE[s].eu);
  const sep = (t: string) => <h2 className="mt-7 mb-2.5 text-[12px] font-semibold tracking-[.06em] text-ink-3 uppercase">{t}</h2>;

  const ap = rand(d.acum.apeluri, null);
  const apAnt = rand(d.ant.apeluri, null);
  const inc = rand(d.acum.inchideri, null);
  const incAnt = rand(d.ant.inchideri, null);
  const prez = inc ? rata(inc.au_venit, inc.programate) : null;
  const prezAnt = incAnt ? rata(incAnt.au_venit, incAnt.programate) : null;
  const pal = d.acum.palnie;
  const palAnt = d.ant.palnie;

  return (
    <>
      <BaraSus cale={[{ eticheta: "KPI" }]} />
      <h1 className="text-[26px] leading-tight sm:text-[30px]">KPI</h1>
      <p className="mt-1 mb-4 text-[13.5px] text-ink-3">{admin ? "Cum merge firma, pe perioadă și pe om." : "Cifrele tale. Le vezi doar tu și Adminul."}</p>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <nav aria-label="Perioada" className="flex gap-0.5 rounded-full bg-seg p-[3px]">
          {PERIOADE.map((x) => (
            <Link
              key={x}
              href={link({ p: x })}
              scroll={false}
              aria-current={x === p ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium whitespace-nowrap ${x === p ? "bg-sel text-ink" : "text-ink-3 hover:text-ink"}`}
            >
              {ETICHETA_PERIOADA[x]}
            </Link>
          ))}
        </nav>
        <span className="text-[12px] text-ink-3">Săgețile: {fataDe}.</span>
      </div>

      {admin ? (
        <>
          <Placi testId="cifre-cheie">
            <Placa mare eticheta="Lead-uri noi" valoare={pal?.intrari ?? 0} comparatie={comparatie(pal?.intrari ?? 0, palAnt?.intrari ?? 0, "sus", "procent")} fataDe={fataDe} />
            <Placa
              mare
              eticheta="Clienți noi"
              valoare={inc?.clienti ?? 0}
              comparatie={comparatie(inc?.clienti ?? 0, incAnt?.clienti ?? 0, "sus", "procent")}
              fataDe={fataDe}
              explicatie="semnați în perioadă"
            />
            <Placa
              mare
              eticheta="Timp până la primul apel"
              valoare={afiseaza(ap?.minute_primul_apel, durata)}
              comparatie={comparatie(ap?.minute_primul_apel ?? null, apAnt?.minute_primul_apel ?? null, "jos", "valoare", durata)}
              fataDe={fataDe}
            />
            <Placa mare eticheta="Rata de prezentare" valoare={afiseaza(prez, numarIntreg)} unitate={prez === null ? undefined : "%"} comparatie={comparatie(prez, prezAnt, "sus", "pp")} fataDe={fataDe} />
            <Placa
              mare
              eticheta="Încasat"
              valoare={sumaLei(d.acum.bani?.incasat_lei ?? 0)}
              comparatie={comparatie(d.acum.bani?.incasat_lei ?? 0, d.ant.bani?.incasat_lei ?? 0, "sus", "procent")}
              fataDe={fataDe}
            />
          </Placi>

          <p className="mt-7 mb-2.5 text-[12px] font-semibold tracking-[.06em] text-ink-3 uppercase">Echipa · dă clic pe un om</p>
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(270px,1fr))]">
            {d.oameni.map((o) => (
              <CardOm key={o.id} nume={o.nume} rol={o.rol} mini={miniOm(d, o, true)} href={link({ om: ales?.id === o.id ? null : o.id })} ales={ales?.id === o.id} />
            ))}
          </div>
          {ales && (
            <div className="mt-3">
              <PanouOm d={d} om={ales} fataDe={fataDe} eticheta={ETICHETA_PERIOADA[p]} />
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(270px,1fr))]">
          <CardOm nume={omul.nume} rol={omul.rol} mini={miniOm(d, omul, false)} />
        </div>
      )}

      {sectiuniPentru(omul.rol).map((s) => (
        <section key={s}>
          {sep(titluSectiune(s))}
          <Sectiunea s={s} d={d} rol={omul.rol} eu={omul} fataDe={fataDe} numeOm={numeOm} />
        </section>
      ))}
    </>
  );
}
