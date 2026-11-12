"use client";

import Link from "next/link";
import { platesteTot } from "@/app/(app)/finante/actiuni";
import { Ascuns } from "@/components/Ascuns";
import { BulinaComision } from "@/components/fisa/FinanteActiuni";
import { useActiune } from "@/components/finante/useActiune";
import { initiale } from "@/lib/afisare";
import { dePlatitOm } from "@/lib/finante";
import { lei } from "@/lib/proiecte";

export type RandComision = {
  id: string;
  tip: string;
  procent: number | null;
  suma_lei: number | null;
  platit_la: string | null;
  eticheta: string;
  client: { id: string; nume: string; proiectId: string } | null;
};
export type OmDePlatit = { id: string; nume: string; rol: string; randuri: RandComision[] };

const procentText = (p: number | null) => (p === null ? "" : ` (${String(p).replace(".", ",")}%)`);

function Rand({ r }: { r: RandComision }) {
  const minus = r.tip === "minus";
  const cine = r.client ? (
    <Link href={{ pathname: `/clienti/${r.client.id}`, query: { proiect: r.client.proiectId } }} className="hover:text-amber">
      <Ascuns>{r.client.nume}</Ascuns>
    </Link>
  ) : (
    <span className="text-ink-3">client șters</span>
  );
  return (
    <div className="flex items-center gap-2.5 border-b border-line py-2 text-[13px] last:border-0">
      <span className="min-w-0 flex-1 text-ink-2">
        {cine} · {r.eticheta}
        {minus ? " · returnare" : procentText(r.procent)}
      </span>
      <b className={`num flex-none font-semibold ${minus ? "text-red-t" : ""}`}>{r.suma_lei === null ? "" : lei(r.suma_lei).replace(/^-/, "−")}</b>
      {!minus && (
        <span className="flex-none">
          <BulinaComision id={r.id} platitLa={r.platit_la} stabilit={r.suma_lei !== null} />
        </span>
      )}
    </div>
  );
}

function Om({ om }: { om: OmDePlatit }) {
  const { total, poatePlati } = dePlatitOm(om.randuri);
  const { mesaj, lucreaza, fa } = useActiune();
  const comisioane = om.randuri.filter((r) => r.tip !== "minus").length;
  return (
    <div data-testid="de-platit-om" className="border-b border-line px-4 py-3.5 last:border-0">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[var(--btn)] text-[11px] font-semibold text-ink-2">
          {initiale(om.nume)}
        </span>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[14px] font-semibold">{om.nume}</b>
          <span className="text-[12px] text-ink-3">{om.rol}</span>
        </div>
        <div className="flex-none text-right">
          <b className={`num block text-[15px] font-semibold ${total < 0 ? "text-red-t" : "text-amber"}`}>{lei(total).replace(/^-/, "−")}</b>
          <small className="text-[12px] text-ink-3">{comisioane === 1 ? "un comision" : `${comisioane} comisioane`}</small>
        </div>
      </div>
      <div className="mt-2">
        {om.randuri.map((r) => (
          <Rand key={r.id} r={r} />
        ))}
      </div>
      {poatePlati ? (
        <button type="button" className="btn pri mic mt-2.5" disabled={lucreaza} onClick={() => fa(() => platesteTot(om.id))}>
          Am plătit tot
        </button>
      ) : (
        total < 0 && <p className="mt-2.5 text-[13px] text-ink-3">Îți datorează {lei(-total)}: se scad din comisioanele următoare.</p>
      )}
      {mesaj && <p role="alert" className="mt-1.5 text-[13px] text-red-t">{mesaj}</p>}
    </div>
  );
}

/** Tab-ul „De plătit echipei”: pe fiecare om, comisioanele din banii deja încasați, încă neplătite (și minusurile nestinse). */
export function DePlatitEchipei({ oameni }: { oameni: OmDePlatit[] }) {
  return (
    <>
      <p className="mb-3 text-[13px] text-ink-3">Comisioanele din banii deja încasați, pe care încă nu le-ai dat.</p>
      {oameni.length ? (
        <div className="panel max-w-[660px]">
          {oameni.map((o) => (
            <Om key={o.id} om={o} />
          ))}
        </div>
      ) : (
        <p className="panel max-w-[660px] px-4 py-6 text-[14px] text-ink-2">Nu datorezi nimic nimănui.</p>
      )}
    </>
  );
}
