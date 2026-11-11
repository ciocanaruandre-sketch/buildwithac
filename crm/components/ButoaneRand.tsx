"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { iaLead } from "@/app/(app)/lead-uri/actiuni";
import { linkTelefon, linkWhatsApp } from "@/lib/telefon";

/** Acțiunile de pe rândul unui lead: WhatsApp, Sună, Copiază, „Îmi iau lead-ul”. */
export function ButoaneRand({ id, telefon, telefonNorm, liber }: { id: string; telefon: string | null; telefonNorm: string | null; liber: boolean }) {
  const router = useRouter();
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();
  const [copiat, setCopiat] = useState(false);

  const ia = () =>
    porneste(async () => {
      const r = await iaLead(id);
      if (!r.ok) setMesaj(r.mesaj);
      router.refresh();
    });
  const copiaza = async () => {
    try {
      await navigator.clipboard.writeText(telefon ?? "");
      setCopiat(true);
      setTimeout(() => setCopiat(false), 1500);
    } catch {
      setMesaj("Nu pot copia: copiază numărul de mână.");
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {telefonNorm && (
        <>
          <a className="btn !px-2 !py-1 text-[11px]" href={linkWhatsApp(telefonNorm)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className="btn !px-2 !py-1 text-[11px]" href={linkTelefon(telefonNorm)}>
            Sună
          </a>
          <button type="button" className="btn !px-2 !py-1 text-[11px]" onClick={copiaza} aria-label="Copiază numărul">
            {copiat ? "Copiat" : "Copiază"}
          </button>
        </>
      )}
      {liber && (
        <button type="button" className="btn pri !px-2 !py-1 text-[11px]" onClick={ia} disabled={lucreaza}>
          Îmi iau lead-ul
        </button>
      )}
      {mesaj && (
        <span role="alert" className="text-[12px] text-red-t">
          {mesaj}
        </span>
      )}
    </div>
  );
}
