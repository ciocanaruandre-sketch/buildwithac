"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { stergeLead } from "@/app/(app)/lead-uri/[id]/actiuni";

/** „Șterge lead-ul”, doar pentru Admin. Cere o confirmare, pentru că nu se poate anula. */
export function StergeLead({ id }: { id: string }) {
  const router = useRouter();
  const [sigur, setSigur] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  const sterge = () =>
    porneste(async () => {
      const r = await stergeLead(id);
      if (!r.ok) return setMesaj(r.mesaj);
      router.push("/lead-uri");
    });

  return (
    <div className="panel p-3.5">
      <p className="lbl mb-2">Ștergere</p>
      {sigur ? (
        <>
          <p className="mb-2.5 text-[13px] text-ink-2">Se șterge definitiv, cu notițele și parcursul lui. Nu se poate anula.</p>
          <div className="flex gap-2">
            <button type="button" className="btn !border-[#7a2a20] !text-[#ff7a66]" disabled={lucreaza} onClick={sterge}>
              {lucreaza ? "…" : "Da, șterge-l"}
            </button>
            <button type="button" className="btn" disabled={lucreaza} onClick={() => setSigur(false)}>Renunță</button>
          </div>
        </>
      ) : (
        <button type="button" className="btn" onClick={() => setSigur(true)}>Șterge lead-ul</button>
      )}
      {mesaj && <p role="alert" className="mt-2 text-[13px] text-[#ff7a66]">{mesaj}</p>}
    </div>
  );
}
