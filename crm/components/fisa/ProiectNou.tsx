"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adaugaProiect } from "@/app/(app)/clienti/[id]/actiuni";
import { ETICHETE, SERVICII, type Serviciu } from "@/lib/tipuri";

/** Doar pentru Admin: „+ Proiect nou” pentru același client. Fișa se deschide apoi pe proiectul nou. */
export function ProiectNou({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [titlu, setTitlu] = useState("");
  const [serviciu, setServiciu] = useState<Serviciu>("site");
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  if (!deschis) {
    return (
      <button type="button" className="btn !px-2 !py-1 text-[11px]" onClick={() => setDeschis(true)}>
        + Proiect nou
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <input className="camp !w-[220px] !py-1 text-[13px]" aria-label="Titlul proiectului nou" placeholder="Titlul proiectului" value={titlu} onChange={(e) => setTitlu(e.target.value)} />
      <select className="camp !w-auto !py-1 text-[13px]" aria-label="Serviciul proiectului nou" value={serviciu} onChange={(e) => setServiciu(e.target.value as Serviciu)}>
        {SERVICII.map((s) => (
          <option key={s} value={s}>{ETICHETE.serviciu[s]}</option>
        ))}
      </select>
      <button
        type="button"
        className="btn pri !px-2 !py-1 text-[11px]"
        disabled={lucreaza}
        onClick={() =>
          porneste(async () => {
            const r = await adaugaProiect(clientId, { titlu, serviciu });
            if (!r.ok) return setMesaj(r.mesaj);
            setMesaj(null);
            setDeschis(false);
            setTitlu("");
            router.push(`/clienti/${clientId}?proiect=${r.id}`);
          })
        }
      >
        Adaugă proiectul
      </button>
      <button type="button" className="btn !px-2 !py-1 text-[11px]" disabled={lucreaza} onClick={() => setDeschis(false)}>
        Renunță
      </button>
      {mesaj && <span role="alert" className="text-[12px] text-red-t">{mesaj}</span>}
    </span>
  );
}
