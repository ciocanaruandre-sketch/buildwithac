"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { schimbaStadiu } from "@/app/(app)/clienti/[id]/actiuni";
import { ETICHETE, STADII, type Stadiu as TipStadiu } from "@/lib/tipuri";

/** Stadiul proiectului: o listă de ales pentru cine lucrează la el, text simplu pentru ceilalți. */
export function Stadiu({ proiectId, stadiu, poate }: { proiectId: string; stadiu: TipStadiu; poate: boolean }) {
  const router = useRouter();
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();
  // ce a ales omul rămâne pe ecran cât se salvează; la refuz revine la ce e în bază
  const [ales, setAles] = useState(stadiu);

  if (!poate) return <>{ETICHETE.stadiu[stadiu]}</>;
  return (
    <>
      <select
        className="camp !w-auto !py-1 text-[12px]"
        aria-label="Stadiu"
        value={ales}
        disabled={lucreaza}
        onChange={(e) => {
          const nou = e.target.value as TipStadiu;
          setAles(nou);
          porneste(async () => {
            const r = await schimbaStadiu(proiectId, nou);
            setMesaj(r.ok ? null : r.mesaj);
            if (!r.ok) setAles(stadiu);
            router.refresh();
          });
        }}
      >
        {STADII.map((s) => (
          <option key={s} value={s}>{ETICHETE.stadiu[s]}</option>
        ))}
      </select>
      {mesaj && <span role="alert" className="mt-1 block text-[12px] text-red-t">{mesaj}</span>}
    </>
  );
}
