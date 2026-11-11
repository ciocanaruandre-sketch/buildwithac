"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adaugaOm, scoateOm } from "@/app/(app)/clienti/[id]/actiuni";

type Om = { id: string; nume: string };

/** Doar pentru Admin: constructorii de pe proiect, cu procentul fiecăruia; „Scoate” și „Adaugă”. */
export function OameniProiect({ proiectId, oameni, deAdaugat }: { proiectId: string; oameni: (Om & { procent: number | null })[]; deAdaugat: Om[] }) {
  const router = useRouter();
  const [om, setOm] = useState("");
  const [procent, setProcent] = useState("");
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  const fa = (actiune: () => Promise<{ ok: true } | { ok: false; mesaj: string }>, dupa?: () => void) =>
    porneste(async () => {
      const r = await actiune();
      if (!r.ok) return setMesaj(r.mesaj);
      setMesaj(null);
      dupa?.();
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-1.5">
      {oameni.length === 0 && <span className="text-ink-3">doar tu, deocamdată</span>}
      {oameni.map((o) => (
        <div key={o.id} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate">
            {o.nume} <span className="font-mono text-[11px] text-ink-3">{o.procent === null ? "fără procent" : `${String(o.procent).replace(".", ",")}%`}</span>
          </span>
          <button type="button" className="btn !px-2 !py-1 text-[11px]" disabled={lucreaza} onClick={() => fa(() => scoateOm(proiectId, o.id))}>
            Scoate
          </button>
        </div>
      ))}
      {deAdaugat.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <select className="camp !py-1 text-[12px]" aria-label="Adaugă un om" value={om} onChange={(e) => setOm(e.target.value)}>
            <option value="">Adaugă un om…</option>
            {deAdaugat.map((o) => (
              <option key={o.id} value={o.id}>{o.nume}</option>
            ))}
          </select>
          <input className="camp !w-[58px] !px-2 !py-1 text-[12px]" aria-label="Procent" placeholder="%" inputMode="decimal" value={procent} onChange={(e) => setProcent(e.target.value)} />
          <button
            type="button"
            className="btn !px-2 !py-1 text-[11px]"
            disabled={lucreaza || !om}
            onClick={() =>
              fa(
                () => adaugaOm(proiectId, om, procent),
                () => {
                  setOm("");
                  setProcent("");
                },
              )
            }
          >
            Adaugă
          </button>
        </div>
      )}
      {mesaj && <span role="alert" className="text-[12px] text-red-t">{mesaj}</span>}
    </div>
  );
}
