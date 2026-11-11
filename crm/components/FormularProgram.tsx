"use client";

import { useState, useTransition } from "react";
import { salveazaProgram } from "@/app/(app)/program/actiuni";
import type { ZiProgram } from "@/lib/sloturi";

const ZILE = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];
type Rand = { activ: boolean; de_la: string; pana_la: string };

export function FormularProgram({ closerId, program, durata }: { closerId: string; program: ZiProgram[]; durata: number }) {
  const [randuri, setRanduri] = useState<Rand[]>(() =>
    ZILE.map((_, i) => {
      const p = program.find((x) => x.zi === i + 1);
      return { activ: Boolean(p), de_la: p?.de_la.slice(0, 5) ?? "10:00", pana_la: p?.pana_la.slice(0, 5) ?? "18:00" };
    }),
  );
  const [min, setMin] = useState(durata);
  const [mesaj, setMesaj] = useState<{ ok: boolean; text: string } | null>(null);
  const [lucreaza, porneste] = useTransition();
  const schimba = (i: number, s: Partial<Rand>) => setRanduri((r) => r.map((x, j) => (j === i ? { ...x, ...s } : x)));

  const salveaza = () =>
    porneste(async () => {
      const zile = randuri.flatMap((r, i) => (r.activ ? [{ zi: (i + 1) as ZiProgram["zi"], de_la: r.de_la, pana_la: r.pana_la }] : []));
      const rez = await salveazaProgram(closerId, zile, min);
      setMesaj(rez.ok ? { ok: true, text: "Programul e salvat." } : { ok: false, text: rez.mesaj });
    });

  return (
    <div className="panel max-w-xl p-4">
      <div className="flex flex-col gap-2">
        {randuri.map((r, i) => (
          <div key={ZILE[i]} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line pb-2.5 last:border-0 last:pb-0">
            <label className="flex w-full items-center gap-2.5 text-[13.5px] sm:w-36">
              <input type="checkbox" className="comutator" checked={r.activ} onChange={(e) => schimba(i, { activ: e.target.checked })} aria-label={ZILE[i]} />
              {ZILE[i]}
            </label>
            <input type="time" className="camp min-w-0 flex-1 sm:!w-auto sm:flex-none" value={r.de_la} disabled={!r.activ} onChange={(e) => schimba(i, { de_la: e.target.value })} aria-label={`${ZILE[i]}, de la`} />
            <span className="text-ink-3">–</span>
            <input type="time" className="camp min-w-0 flex-1 sm:!w-auto sm:flex-none" value={r.pana_la} disabled={!r.activ} onChange={(e) => schimba(i, { pana_la: e.target.value })} aria-label={`${ZILE[i]}, până la`} />
          </div>
        ))}
      </div>
      <label className="mt-4 flex items-center gap-2 text-[13px]">
        <span className="lbl">O discuție durează</span>
        <select className="camp !w-auto" value={min} onChange={(e) => setMin(Number(e.target.value))}>
          {[15, 30, 45, 60].map((m) => (
            <option key={m} value={m}>{m} min</option>
          ))}
        </select>
      </label>
      <button type="button" className="btn pri mt-4" disabled={lucreaza} onClick={salveaza}>
        Salvează programul
      </button>
      {mesaj && (
        <p role={mesaj.ok ? "status" : "alert"} className={`mt-2 text-[13px] ${mesaj.ok ? "text-green" : "text-red-t"}`}>
          {mesaj.text}
        </p>
      )}
    </div>
  );
}
