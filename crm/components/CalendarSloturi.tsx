"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { programeaza } from "@/app/(app)/lead-uri/[id]/actiuni";

/** Orele libere ale closerului, pe zile. Un click programează. */
export function CalendarSloturi({ leadId, closerId, zile }: { leadId: string; closerId: string; zile: { zi: string; sloturi: { la: string; ora: string }[] }[] }) {
  const router = useRouter();
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  const alege = (la: string) =>
    porneste(async () => {
      const r = await programeaza(leadId, closerId, la);
      if (r.ok) return router.push(`/lead-uri/${leadId}`);
      setMesaj(r.mesaj);
      router.refresh();
    });

  if (!zile.length) return <p className="text-[13px] text-ink-3">Closerul n-are ore libere în următoarele 14 zile. Alege alt closer sau roagă-l să-și completeze programul.</p>;

  return (
    <>
      {mesaj && (
        <p role="alert" className="mb-3 text-[13px] text-red-t">
          {mesaj}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {zile.map((z) => (
          <div key={z.zi} className="panel p-3">
            <p className="lbl mb-2">{z.zi}</p>
            <div className="flex flex-wrap gap-1.5">
              {z.sloturi.map((s) => (
                <button key={s.la} type="button" data-testid="slot" data-la={s.la} className="btn !px-2 !py-1 font-mono text-[12px]" disabled={lucreaza} onClick={() => alege(s.la)}>
                  {s.ora}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
