"use client";

import { useState } from "react";
import { adaugaReclama } from "@/app/(app)/reclame/actiuni";
import { useActiune } from "@/components/finante/useActiune";

/** „+ Reclamă”: o reclamă care n-a adus încă lead-uri, ca banii ei să intre în total. */
export function AdaugaReclama() {
  const [deschis, setDeschis] = useState(false);
  const [platforma, setPlatforma] = useState<"meta" | "tiktok">("meta");
  const { mesaj, setMesaj, lucreaza, fa } = useActiune();

  if (!deschis) {
    return (
      <button type="button" className="btn pri" onClick={() => setDeschis(true)}>
        + Reclamă
      </button>
    );
  }

  const inchide = () => {
    setDeschis(false);
    setMesaj(null);
  };

  return (
    <form
      className="panel flex w-full flex-col gap-3 p-4"
      aria-label="Reclamă nouă"
      onSubmit={(e) => {
        e.preventDefault();
        const date = new FormData(e.currentTarget);
        date.set("platforma", platforma);
        fa(() => adaugaReclama(date), inchide);
      }}
    >
      <p className="text-[13px] text-ink-3">
        Scrie campania și numele reclamei exact ca în Ads Manager, cu aceleași litere și spații. Când vine primul lead din ea,
        se leagă singur de reclama asta. Dacă una diferă, apare o reclamă nouă, pe care o poți uni cu asta.
      </p>
      <div className="seg" role="group" aria-label="Platforma">
        {(["meta", "tiktok"] as const).map((p) => (
          <button key={p} type="button" aria-pressed={platforma === p} onClick={() => setPlatforma(p)}>
            {p === "meta" ? "Meta" : "TikTok"}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="lbl">Campania</span>
          <input className="camp" name="campanie" maxLength={120} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="lbl">Numele reclamei</span>
          <input className="camp" name="nume" maxLength={120} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="lbl">Cheltuit până acum (lei, opțional)</span>
          <input className="camp num" name="cheltuit" inputMode="numeric" />
        </label>
      </div>
      {mesaj && (
        <p role="alert" className="text-[13px] text-red-t">
          {mesaj}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn pri mic" disabled={lucreaza}>
          Adaugă
        </button>
        <button type="button" className="btn mic" disabled={lucreaza} onClick={inchide}>
          Renunță
        </button>
      </div>
    </form>
  );
}
