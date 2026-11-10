"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { salveazaProiect } from "@/app/(app)/clienti/[id]/actiuni";

/** Doar pentru Admin: „Schimbă” titlul, prețul, încasatul și termenul de predare. */
export function DateProiect({ proiectId, titlu, pretLei, incasatLei, termen }: { proiectId: string; titlu: string; pretLei: number | null; incasatLei: number; termen: string | null }) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [d, setD] = useState({ titlu, pretLei: pretLei === null ? "" : String(pretLei), incasatLei: String(incasatLei), termen: termen ?? "" });
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  if (!deschis) {
    return (
      <button type="button" className="btn mt-3 !px-2 !py-1 text-[11px]" onClick={() => setDeschis(true)}>
        Schimbă
      </button>
    );
  }

  const camp = (eticheta: string, cheie: keyof typeof d, tip = "text") => (
    <label className="flex flex-col gap-1">
      <span className="lbl">{eticheta}</span>
      <input className="camp" type={tip} inputMode={tip === "text" && cheie !== "titlu" ? "numeric" : undefined} value={d[cheie]} onChange={(e) => setD({ ...d, [cheie]: e.target.value })} />
    </label>
  );

  return (
    <div className="mt-3 flex w-full flex-col gap-2 border-t border-line pt-3">
      {camp("Titlu", "titlu")}
      {camp("Preț (lei)", "pretLei")}
      {camp("Încasat (lei)", "incasatLei")}
      {camp("Termen de predare", "termen", "date")}
      {mesaj && <p role="alert" className="text-[13px] text-[#ff7a66]">{mesaj}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn pri"
          disabled={lucreaza}
          onClick={() =>
            porneste(async () => {
              const r = await salveazaProiect(proiectId, d);
              if (!r.ok) return setMesaj(r.mesaj);
              setMesaj(null);
              setDeschis(false);
              router.refresh();
            })
          }
        >
          Salvează
        </button>
        <button type="button" className="btn" disabled={lucreaza} onClick={() => setDeschis(false)}>
          Renunță
        </button>
      </div>
    </div>
  );
}
