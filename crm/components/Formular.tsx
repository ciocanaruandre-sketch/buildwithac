"use client";

import { useActionState } from "react";
import type { StareFormular } from "@/app/(cont)/actiuni";

type Camp = { nume: string; eticheta: string; tip: string; autocomplete?: string };

/** Formularele mici de cont: câmpuri, un buton, eroarea sau mesajul sub ele. */
export function Formular({ actiune, campuri, buton }: { actiune: (s: StareFormular, f: FormData) => Promise<StareFormular>; campuri: Camp[]; buton: string }) {
  const [stare, trimite, lucreaza] = useActionState(actiune, undefined);
  return (
    <form action={trimite} className="flex flex-col gap-3">
      {campuri.map((c) => (
        <label key={c.nume} className="flex flex-col gap-1.5">
          <span className="lbl">{c.eticheta}</span>
          <input className="camp" name={c.nume} type={c.tip} autoComplete={c.autocomplete} required />
        </label>
      ))}
      {stare?.eroare && <p role="alert" className="text-[13px] text-[#ff7a66]">{stare.eroare}</p>}
      {stare?.mesaj && <p role="status" className="text-[13px] text-ink-2">{stare.mesaj}</p>}
      <button className="btn pri mt-1 justify-center" disabled={lucreaza}>{lucreaza ? "…" : buton}</button>
    </form>
  );
}
