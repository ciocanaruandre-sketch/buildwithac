import Link from "next/link";
import { Ascuns } from "@/components/Ascuns";
import { Incaseaza } from "@/components/finante/Incaseaza";
import { termenScurt } from "@/lib/afisare";
import { coloaneIncasari, incasatNet, LUNI, textZile, type Transa } from "@/lib/finante";
import { lei, zileIntarziere } from "@/lib/proiecte";

export type TransaCuClient = Transa & { clientId: string; client: string };

type Cheie = "intarzie" | "urmeaza" | "incasate";

function Card({ t, cheie, azi }: { t: TransaCuClient; cheie: Cheie; azi: string }) {
  const incasata = cheie === "incasate";
  return (
    <div data-testid="card-transa" className="border-b border-line last:border-0">
      <Link href={{ pathname: `/clienti/${t.clientId}`, query: { proiect: t.proiect_id } }} className="block px-3.5 pt-2.5 pb-2 hover:bg-sel">
        <div className="flex justify-between gap-2 text-[13px] font-semibold">
          <span className="min-w-0 truncate">
            <Ascuns>{t.client}</Ascuns>
          </span>
          <span className="num flex-none">{lei(incasata ? incasatNet(t) : t.suma_lei)}</span>
        </div>
        <div className="mt-0.5 flex justify-between gap-2 text-[12px] text-ink-3">
          <span className="min-w-0 truncate">{t.eticheta}</span>
          {cheie === "intarzie" ? (
            <span className="num flex-none text-red-t">{textZile(zileIntarziere(t.scadenta, azi))}</span>
          ) : (
            <span className="num flex-none">{termenScurt(incasata ? t.incasata_la! : t.scadenta)}</span>
          )}
        </div>
      </Link>
      {!incasata && (
        <div className="flex justify-end px-3.5 pb-2.5 [&:has(input)]:justify-start">
          <Incaseaza transaId={t.id} suma={t.suma_lei} auriu={cheie === "intarzie"} eticheta="✓ Am încasat" />
        </div>
      )}
    </div>
  );
}

function Coloana({ cheie, titlu, culoare, total, transe, azi }: { cheie: Cheie; titlu: string; culoare?: string; total: number; transe: TransaCuClient[]; azi: string }) {
  return (
    <section data-testid={`coloana-${cheie}`} className="panel min-w-0 self-start overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-3">
        <span className={`lbl ${culoare ?? ""}`}>{titlu}</span>
        <span className="num ml-auto text-[12.5px] font-semibold text-ink-3">{lei(total)}</span>
      </div>
      {transe.length ? transe.map((t) => <Card key={t.id} t={t} cheie={cheie} azi={azi} />) : <p className="px-3.5 py-4 text-[13px] text-ink-3">Nimic aici.</p>}
    </section>
  );
}

/** Tab-ul „Încasări” (varianta B, coloanele): cele trei cifre ale lunii, apoi Întârzie · Urmează · Încasate. */
export function Incasari({ transe, azi }: { transe: TransaCuClient[]; azi: string }) {
  const { intarzie, urmeaza, incasate, cifre } = coloaneIncasari(transe, azi);
  const luna = LUNI[Number(azi.slice(5, 7)) - 1];
  const umplut = cifre.programatLuna ? Math.min(100, Math.round((cifre.incasatLuna / cifre.programatLuna) * 100)) : 0;
  const suma = (l: TransaCuClient[]) => l.reduce((s, x) => s + x.suma_lei, 0);
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="panel col-span-2 px-3.5 py-3 sm:col-span-1">
          <small className="text-[12px] text-ink-3">Încasat în {luna}</small>
          <b className="num mt-0.5 block text-[19px] font-semibold tracking-[-.02em] text-green sm:text-[21px]">{lei(cifre.incasatLuna)}</b>
          <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-seg">
            <i className="block h-full" style={{ width: `${umplut}%`, background: "var(--grad)" }} />
          </div>
          <small className="mt-1 block text-[12px] text-ink-3">din {lei(cifre.programatLuna)} programați luna asta</small>
        </div>
        <div className="panel px-3.5 py-3">
          <small className="text-[12px] text-ink-3">Urmează în {luna}</small>
          <b className="num mt-0.5 block text-[17px] font-semibold tracking-[-.02em] sm:text-[21px]">{lei(cifre.urmeazaLuna)}</b>
        </div>
        <div className="panel px-3.5 py-3">
          <small className="text-[12px] text-ink-3">Întârziate</small>
          <b className={`num mt-0.5 block text-[17px] font-semibold tracking-[-.02em] sm:text-[21px] ${cifre.intarziate ? "text-red-t" : ""}`}>{lei(cifre.intarziate)}</b>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Coloana cheie="intarzie" titlu="Întârzie" culoare="text-red-t" total={suma(intarzie)} transe={intarzie} azi={azi} />
        <Coloana cheie="urmeaza" titlu="Urmează · 30 de zile" total={suma(urmeaza)} transe={urmeaza} azi={azi} />
        <Coloana cheie="incasate" titlu={`Încasate · ${luna}`} culoare="text-green" total={cifre.incasatLuna} transe={incasate} azi={azi} />
      </div>
    </>
  );
}
