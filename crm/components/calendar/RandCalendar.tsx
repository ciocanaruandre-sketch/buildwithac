"use client";

import { useState, useTransition } from "react";
import { reincearcaCalendar } from "@/app/(app)/lead-uri/[id]/actiuni";
import type { StareRand } from "@/lib/calendar/coada";

/** Sub discuția viitoare: a ajuns sau nu în Google Calendar-ul closerului. */
export function RandCalendar({ discutieId, stare, closerNume }: { discutieId: string; stare: StareRand; closerNume: string }) {
  const [lucreaza, porneste] = useTransition();
  const [mesaj, setMesaj] = useState<string | null>(null);

  const reincearca = () =>
    porneste(async () => {
      const r = await reincearcaCalendar(discutieId);
      setMesaj(r.ok ? null : r.mesaj);
    });

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2" data-testid="rand-calendar">
      {stare === "ok" && (
        <>
          <span className="chip green">✓ În Google Calendar</span>
          <span className="text-[12.5px] text-ink-3">la {closerNume}</span>
        </>
      )}
      {stare === "neconectat" && <span className="chip">{closerNume} n-are Google Calendar conectat</span>}
      {stare === "eroare" && (
        <>
          <span className="chip red">N-a ajuns în calendar</span>
          <button type="button" className="btn mic" disabled={lucreaza} onClick={reincearca}>
            {lucreaza ? "…" : "Reîncearcă"}
          </button>
        </>
      )}
      {mesaj && <p role="alert" className="basis-full text-[12.5px] text-red-t">{mesaj}</p>}
    </div>
  );
}
