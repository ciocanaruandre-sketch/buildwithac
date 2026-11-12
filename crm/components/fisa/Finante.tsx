import { Abonament, type AbonamentFisa } from "@/components/fisa/Abonament";
import { AdaugaTransa, BulinaComision, Returnare, TransaActiuni } from "@/components/fisa/FinanteActiuni";
import { PlanPlata, SchimbaPlan } from "@/components/fisa/PlanPlata";
import { Incaseaza } from "@/components/finante/Incaseaza";
import { initiale, termenScurt } from "@/lib/afisare";
import { incasatNet, stareTransa, textZile, totaluriProiect, type Transa } from "@/lib/finante";
import { lei, zileIntarziere } from "@/lib/proiecte";

export type ComisionFisa = { id: string; transa_id: string | null; om_id: string; procent: number | null; suma_lei: number | null; platit_la: string | null; tip: string };
type OmProcent = { id: string; nume: string; procent: number | null };

const procentText = (p: number | null) => (p === null ? "" : `${String(p).replace(".", ",")}%`);

/** Ce comisioane vor apărea la încasare: „Radu 30% (600 lei)”. */
function laIncasare(suma: number, oameni: OmProcent[]): string {
  const cu = oameni.filter((o) => o.procent !== 0);
  if (!cu.length) return "";
  return cu.map((o) => (o.procent === null ? `${o.nume} (procent nestabilit)` : `${o.nume} ${procentText(o.procent)} (${lei(Math.round((suma * o.procent) / 100))})`)).join(" · ");
}

function CardTransa({ t, azi, comisioane, nume, oameni }: { t: Transa; azi: string; comisioane: ComisionFisa[]; nume: (id: string) => string; oameni: OmProcent[] }) {
  const s = stareTransa(t, azi);
  const incasata = Boolean(t.incasata_la);
  const ale = comisioane.filter((k) => k.transa_id === t.id).sort((a, b) => (a.tip === b.tip ? nume(a.om_id).localeCompare(nume(b.om_id), "ro") : a.tip === "minus" ? 1 : -1));
  const nota = s === "intarziata" ? laIncasare(t.suma_lei, oameni) : "";
  return (
    <div data-testid="transa" className={`rounded-r border px-3.5 py-3 ${s === "intarziata" ? "border-red-t/40" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <b className={`text-[14px] font-semibold tracking-[-.01em] ${s === "urmeaza" ? "text-ink-2" : ""}`}>
          {t.eticheta} · <span className="num">{lei(incasata ? t.incasat_lei : t.suma_lei)}</span>
        </b>
        <span className="text-[12.5px] text-ink-3">{incasata ? `încasată pe ${termenScurt(t.incasata_la!)}` : `scadentă pe ${termenScurt(t.scadenta)}`}</span>
        <span className="ml-auto">
          {s === "incasata" && <span className="chip green">Încasată</span>}
          {s === "returnata" && <span className="chip red">Returnat {lei(t.returnat_lei)}</span>}
          {s === "intarziata" && <span className="chip red">Întârzie {textZile(zileIntarziere(t.scadenta, azi))}</span>}
          {s === "urmeaza" && <span className="chip">Urmează</span>}
        </span>
      </div>

      {ale.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-2.5">
          {ale.map((k) => (
            <div key={k.id} className="flex items-center gap-2.5 text-[13px]">
              <span aria-hidden className="grid h-6 w-6 flex-none place-items-center rounded-full bg-[var(--btn)] text-[10px] font-semibold text-ink-2">
                {initiale(nume(k.om_id))}
              </span>
              <span className="min-w-0 truncate text-ink-2">{nume(k.om_id)}</span>
              <span className="text-[12px] text-ink-3">{k.tip === "minus" ? "returnare" : procentText(k.procent)}</span>
              <span className="ml-auto flex items-center gap-2.5">
                <b className="num min-w-[62px] text-right font-semibold">{k.suma_lei === null ? "—" : lei(k.suma_lei).replace(/^-/, "−")}</b>
                {k.tip === "minus" ? (
                  <span className={`chip text-[11.5px] ${k.platit_la ? "green" : "red"}`}>{k.platit_la ? `Scăzut ${termenScurt(k.platit_la)}` : "Se scade la plată"}</span>
                ) : (
                  <BulinaComision id={k.id} platitLa={k.platit_la} stabilit={k.suma_lei !== null} />
                )}
              </span>
            </div>
          ))}
        </div>
      )}
      {nota && <p className="mt-2.5 border-t border-line pt-2 text-[12px] text-ink-3">Comisioanele apar când o bifezi ca încasată: {nota}.</p>}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {!incasata && <Incaseaza transaId={t.id} suma={t.suma_lei} auriu={s === "intarziata"} eticheta={s === "intarziata" ? "Am încasat-o" : "Am încasat"} />}
        {s !== "returnata" && <TransaActiuni key={`${t.id}|${t.suma_lei}|${t.scadenta}|${t.eticheta}`} id={t.id} incasata={incasata} eticheta={t.eticheta} suma={t.suma_lei} scadenta={t.scadenta} />}
      </div>
    </div>
  );
}

const ordine = (a: Transa, b: Transa) => a.scadenta.localeCompare(b.scadenta) || a.eticheta.localeCompare(b.eticheta, "ro");

/** Tab-ul „Finanțe” de pe fișa clientului (varianta A, cronologia), doar pentru Admin. */
export function Finante({
  proiectId,
  pret,
  transe,
  comisioane,
  nume,
  oameni,
  abonament,
  constructori,
  azi,
}: {
  proiectId: string;
  pret: number | null;
  transe: Transa[];
  comisioane: ComisionFisa[];
  nume: (id: string) => string;
  oameni: OmProcent[];
  abonament: AbonamentFisa | null;
  constructori: { id: string; nume: string }[];
  azi: string;
}) {
  const plan = transe.filter((t) => !t.abonament_id).sort(ordine);
  const mentenanta = transe.filter((t) => t.abonament_id).sort(ordine);
  const tot = totaluriProiect(transe);
  const ramas = (pret ?? 0) - tot.incasat;
  // din mentenanță: cele neîncasate și ultimele două încasate
  const deAratat = [...mentenanta.filter((t) => t.incasata_la).slice(-2), ...mentenanta.filter((t) => !t.incasata_la)];
  const incasatMentenanta = mentenanta.reduce((s, t) => s + (t.incasata_la ? incasatNet(t) : 0), 0);
  const oameniAbonament = (abonament?.oameni ?? []).map((o) => ({ id: o.id, nume: o.nume, procent: o.procent }));
  const incasari = transe.filter((t) => t.incasata_la && incasatNet(t) > 0).map((t) => ({ id: t.id, eticheta: t.eticheta, disponibil: incasatNet(t) }));

  const cifra = (eticheta: string, v: number | null, verde = false) => (
    <div className="rounded-r border border-line px-3 py-2.5">
      <small className="block text-[12px] text-ink-3">{eticheta}</small>
      <b className={`num text-[17px] font-semibold tracking-[-.01em] ${verde ? "text-green" : ""}`}>{lei(v)}</b>
    </div>
  );

  return (
    <div className="flex flex-col gap-3" data-testid="finante">
      <div className="grid grid-cols-3 gap-2">
        {cifra("Preț", pret)}
        {cifra("Încasat", tot.incasat, true)}
        {cifra("De încasat", tot.deIncasat)}
      </div>
      {pret !== null && plan.length > 0 && tot.sumaTranse !== pret && (
        <p className="alerta px-3 py-2 text-[12.5px] text-ink-2">
          Tranșele fac {lei(tot.sumaTranse).replace(" lei", "")} din {lei(pret)}.
        </p>
      )}

      {plan.length === 0 &&
        (pret ? (
          <div className="flex flex-col gap-3 rounded-r border border-line p-3.5">
            <p className="text-[14px] text-ink-2">Proiectul n-are încă un plan de plată.</p>
            <PlanPlata proiectId={proiectId} pret={pret} />
          </div>
        ) : (
          <p className="text-[14px] text-ink-2">Proiectul n-are încă un plan de plată. Pune întâi prețul proiectului (din „Schimbă”, la Proiectul).</p>
        ))}

      {plan.map((t) => (
        <CardTransa key={t.id} t={t} azi={azi} comisioane={comisioane} nume={nume} oameni={oameni} />
      ))}

      <Abonament key={abonament ? `${abonament.id}|${abonament.suma_lei}|${abonament.zi}` : "fara"} proiectId={proiectId} abonament={abonament} constructori={constructori} incasat={incasatMentenanta}>
        {deAratat.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {deAratat.map((t) => (
              <CardTransa key={t.id} t={t} azi={azi} comisioane={comisioane} nume={nume} oameni={oameniAbonament} />
            ))}
          </div>
        )}
      </Abonament>

      <div className="flex flex-wrap gap-2">
        <AdaugaTransa proiectId={proiectId} />
        {plan.length > 0 && ramas > 0 && <SchimbaPlan proiectId={proiectId} ramas={ramas} />}
        <Returnare incasari={incasari} />
      </div>
    </div>
  );
}
