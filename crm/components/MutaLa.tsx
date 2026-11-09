"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mutaLead } from "@/app/(app)/lead-uri/[id]/actiuni";

/** Doar pentru Admin: „Mută la…” un alt caller sau closer. */
export function MutaLa({ id, camp, eticheta, actual, oameni }: { id: string; camp: "caller_id" | "closer_id"; eticheta: string; actual: string | null; oameni: { id: string; nume: string }[] }) {
  const router = useRouter();
  const [la, setLa] = useState(actual ?? "");
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();
  return (
    <div className="flex items-center gap-1.5">
      <select className="camp !w-auto !py-1 text-[12px]" aria-label={eticheta} value={la} onChange={(e) => setLa(e.target.value)}>
        <option value="">Nimeni</option>
        {oameni.map((o) => (
          <option key={o.id} value={o.id}>{o.nume}</option>
        ))}
      </select>
      <button
        type="button"
        className="btn !px-2 !py-1 text-[11px]"
        disabled={lucreaza || la === (actual ?? "")}
        onClick={() =>
          porneste(async () => {
            const r = await mutaLead(id, camp, la || null);
            setMesaj(r.ok ? null : r.mesaj);
            router.refresh();
          })
        }
      >
        Mută
      </button>
      {mesaj && <span role="alert" className="text-[12px] text-[#ff7a66]">{mesaj}</span>}
    </div>
  );
}
