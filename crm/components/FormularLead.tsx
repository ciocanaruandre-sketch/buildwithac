"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adaugaLead, type LeadDeMana } from "@/app/(app)/lead-uri/nou/actiuni";
import { ETICHETE, SERVICII, SURSE_MANUALE } from "@/lib/tipuri";

/** Formularul „Lead de mână”. Câmpurile rămân completate dacă ceva nu merge. */
export function FormularLead({ admin, productie }: { admin: boolean; productie: boolean }) {
  const router = useRouter();
  const [d, setD] = useState<LeadDeMana>({ nume: "", telefon: "", email: "", serviciu: "", sursa: "", nota: "", liber: false });
  const [eroare, setEroare] = useState<{ mesaj: string; idExistent?: string } | null>(null);
  const [lucreaza, porneste] = useTransition();
  const schimba = <K extends keyof LeadDeMana>(k: K, v: LeadDeMana[K]) => setD((x) => ({ ...x, [k]: v }));

  const trimite = (e: React.FormEvent) => {
    e.preventDefault();
    porneste(async () => {
      const r = await adaugaLead(d);
      if (!r.ok) return setEroare(r);
      router.push(`/lead-uri/${r.id}`);
    });
  };

  return (
    <form onSubmit={trimite} className="panel flex max-w-[560px] flex-col gap-3.5 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="lbl">Nume</span>
        <input className="camp" value={d.nume} onChange={(e) => schimba("nume", e.target.value)} placeholder="Ion Popescu · Cafeneaua Mică" maxLength={120} />
      </label>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="lbl">Telefon</span>
          <input className="camp" type="tel" value={d.telefon} onChange={(e) => schimba("telefon", e.target.value)} placeholder="0721 123 456" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="lbl">E-mail</span>
          <input className="camp" type="email" value={d.email} onChange={(e) => schimba("email", e.target.value)} />
        </label>
      </div>
      <p className="-mt-1.5 text-[12px] text-ink-3">Măcar unul din ele.</p>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="lbl">Serviciu</span>
          <select className="camp" value={d.serviciu} onChange={(e) => schimba("serviciu", e.target.value as LeadDeMana["serviciu"])}>
            <option value="">Alege…</option>
            {SERVICII.map((s) => (
              <option key={s} value={s}>{ETICHETE.serviciu[s]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="lbl">Sursă</span>
          <select className="camp" value={d.sursa} onChange={(e) => schimba("sursa", e.target.value as LeadDeMana["sursa"])}>
            <option value="">Alege…</option>
            {SURSE_MANUALE.map((s) => (
              <option key={s} value={s}>{ETICHETE.sursa[s]}</option>
            ))}
          </select>
        </label>
      </div>
      {productie && d.sursa === "cold_calling" && (
        <p role="note" className="rounded-r border border-[#5a4214] bg-[#2a2010] px-3 py-2 text-[13px] text-amber">
          Cold calling: verifică întâi regulile cu Andrei. Verificarea legală nu e gata.
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="lbl">Notiță (opțional)</span>
        <textarea className="camp min-h-20" value={d.nota} onChange={(e) => schimba("nota", e.target.value)} placeholder="Ce ați vorbit, când să revii" />
      </label>
      {admin && (
        <label className="flex items-center gap-2 text-[13px] text-ink-2">
          <input type="checkbox" checked={d.liber} onChange={(e) => schimba("liber", e.target.checked)} className="accent-[var(--amber)]" />
          Las-l liber (îl ia un caller din listă)
        </label>
      )}
      {eroare && (
        <p role="alert" className="text-[13px] text-[#ff7a66]">
          {eroare.mesaj}{" "}
          {eroare.idExistent && (
            <Link href={`/lead-uri/${eroare.idExistent}`} className="text-amber underline underline-offset-2">
              Deschide fișa lui
            </Link>
          )}
        </p>
      )}
      <div className="flex gap-2">
        <button className="btn pri" disabled={lucreaza}>{lucreaza ? "…" : "Adaugă lead-ul"}</button>
        <Link href="/lead-uri" className="btn">Renunță</Link>
      </div>
    </form>
  );
}
