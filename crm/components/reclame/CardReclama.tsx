"use client";

import { useState } from "react";
import { stergeReclama } from "@/app/(app)/reclame/actiuni";
import { useActiune } from "@/components/finante/useActiune";
import { Cheltuit } from "@/components/reclame/Cheltuit";
import { UnesteCu, type AltaReclama } from "@/components/reclame/UnesteCu";
import { lei } from "@/lib/proiecte";
import { castig, verdict, type CifreReclama } from "@/lib/reclame";

const TON = { green: "text-green", red: "text-red-t", amber: "text-amber" } as const;

/** O bară a pâlniei, scalată după reclama cu cele mai multe lead-uri. */
function Bara({ eticheta, n, max }: { eticheta: string; n: number; max: number }) {
  return (
    <div className="grid grid-cols-[72px_1fr_28px] items-center gap-2 text-[12px] text-ink-2">
      <span>{eticheta}</span>
      <i className="block h-2 min-w-[3px] rounded-full" style={{ width: `${Math.max(2, (n / max) * 100)}%`, background: "var(--grad)" }} />
      <b className="num text-right text-[12.5px] font-semibold text-ink">{n}</b>
    </div>
  );
}

/** Varianta B a machetei: pâlnia, banii și o propoziție care spune dacă merită. */
export function CardReclama({ r, max, alte }: { r: CifreReclama; max: number; alte: AltaReclama[] }) {
  const [meniu, setMeniu] = useState<"inchis" | "deschis" | "uneste" | "sterge">("inchis");
  const { mesaj, setMesaj, lucreaza, fa } = useActiune();
  const v = verdict(r);
  const c = castig(r);
  const inchide = () => {
    setMeniu("inchis");
    setMesaj(null);
  };

  return (
    <article className="panel flex flex-col p-3.5" data-testid="card-reclama">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[14.5px] leading-snug font-semibold [overflow-wrap:anywhere]">{r.nume}</h2>
          {r.campanie && <small className="block text-[12px] text-ink-3 [overflow-wrap:anywhere]">{r.campanie}</small>}
        </div>
        <div className="flex flex-none items-center gap-1">
          <span className={`chip ${r.platforma === "meta" ? "blue" : "turcoaz"}`}>{r.platforma === "meta" ? "Meta" : "TikTok"}</span>
          <button
            type="button"
            aria-label={`Mai mult pentru ${r.nume}`}
            aria-expanded={meniu !== "inchis"}
            className="grid h-7 w-7 place-items-center rounded-full text-ink-3 hover:bg-[var(--btn)] hover:text-ink"
            onClick={() => (meniu === "inchis" ? setMeniu("deschis") : inchide())}
          >
            <span aria-hidden className="text-[16px] leading-none">⋯</span>
          </button>
        </div>
      </div>

      {meniu === "deschis" && (
        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" className="btn mic" onClick={() => setMeniu("uneste")}>
            Unește cu…
          </button>
          <button type="button" className="btn mic pericol" onClick={() => setMeniu("sterge")}>
            Șterge
          </button>
        </div>
      )}
      {meniu === "uneste" && <UnesteCu id={r.id} nume={r.nume} alte={alte} inchide={inchide} />}
      {meniu === "sterge" && (
        <div className="flex flex-col gap-2 pt-2">
          {mesaj ? (
            <p role="alert" className="text-[13px] text-red-t">
              {mesaj}
            </p>
          ) : (
            <p className="text-[13px] text-ink-2">Ștergi reclama „{r.nume}”? Nu se mai poate aduce înapoi.</p>
          )}
          <div className="flex gap-2">
            {!mesaj && (
              <button type="button" className="btn mic pericol" disabled={lucreaza} onClick={() => fa(() => stergeReclama(r.id))}>
                Da, șterge
              </button>
            )}
            <button type="button" className="btn mic" disabled={lucreaza} onClick={inchide}>
              Renunță
            </button>
          </div>
        </div>
      )}

      <div className="mt-3.5 mb-3 flex flex-col gap-1.5">
        <Bara eticheta="Lead-uri" n={r.lead_uri} max={max} />
        <Bara eticheta="Discuții" n={r.discutii} max={max} />
        <Bara eticheta="Clienți" n={r.clienti} max={max} />
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3">
        <div className="min-w-0">
          <small className="block text-[11.5px] text-ink-3">Cheltuit</small>
          <Cheltuit id={r.id} suma={r.cheltuit_lei} nume={r.nume} />
        </div>
        <div className="min-w-0">
          <small className="block text-[11.5px] text-ink-3">Încasat</small>
          <b className="num block py-1 text-[15px] font-semibold">{r.incasat_lei ? lei(r.incasat_lei) : "0"}</b>
          {r.mai_vin_lei > 0 && <small className="num block text-[11.5px] text-ink-3">+ {lei(r.mai_vin_lei)} mai vin</small>}
        </div>
        <div className="min-w-0">
          <small className="block text-[11.5px] text-ink-3">Câștig</small>
          <b className={`num block py-1 text-[15px] font-semibold ${c === null ? "text-ink-3" : c >= 0 ? "text-green" : "text-red-t"}`}>
            {c === null ? "—" : `${c >= 0 ? "+" : "−"}${lei(Math.abs(c))}`}
          </b>
        </div>
      </div>

      <p className={`mt-3 rounded-[10px] bg-seg px-2.5 py-2 text-[12.5px] font-medium ${TON[v.ton]}`} data-testid="verdict">
        {v.text}
      </p>
    </article>
  );
}
