"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { salveazaContact } from "@/app/(app)/clienti/[id]/actiuni";

/** Doar pentru Admin: „Schimbă” numele, telefonul și e-mailul clientului. În modul filmare, câmpurile (deja completate) sunt blurate. */
export function ContactClient({ clientId, nume, telefon, email }: { clientId: string; nume: string; telefon: string | null; email: string | null }) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [d, setD] = useState({ nume, telefon: telefon ?? "", email: email ?? "" });
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  if (!deschis) {
    return (
      <button type="button" className="btn !px-2 !py-1 text-[11px]" onClick={() => setDeschis(true)}>
        Schimbă
      </button>
    );
  }

  const camp = (eticheta: string, cheie: keyof typeof d) => (
    <label className="flex flex-col gap-1">
      <span className="lbl">{eticheta}</span>
      <input className="camp ascuns-camp" value={d[cheie]} onChange={(e) => setD({ ...d, [cheie]: e.target.value })} />
    </label>
  );

  return (
    <div className="flex w-full flex-col gap-2 border-t border-line pt-3">
      {camp("Nume", "nume")}
      {camp("Telefon", "telefon")}
      {camp("E-mail", "email")}
      {mesaj && <p role="alert" className="text-[13px] text-red-t">{mesaj}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn pri"
          disabled={lucreaza}
          onClick={() =>
            porneste(async () => {
              const r = await salveazaContact(clientId, d);
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
