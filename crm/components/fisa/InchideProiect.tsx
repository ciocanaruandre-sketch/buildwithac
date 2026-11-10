"use client";

import { inchideProiect } from "@/app/(app)/clienti/[id]/actiuni";
import { Mesaj, useActiune } from "@/components/fisa/comune";

/** Doar pentru Admin: „Închide proiectul” când colaborarea s-a terminat; „Redeschide proiectul” dacă se reia. */
export function InchideProiect({ proiectId, inchis }: { proiectId: string; inchis: boolean }) {
  const { fa, mesaj, lucreaza } = useActiune();
  return (
    <>
      <button type="button" className="btn mt-3 !px-2 !py-1 text-[11px]" disabled={lucreaza} onClick={() => fa(() => inchideProiect(proiectId, !inchis))}>
        {inchis ? "Redeschide proiectul" : "Închide proiectul"}
      </button>
      <Mesaj text={mesaj} />
    </>
  );
}
