"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Rezultat = { ok: true } | { ok: false; mesaj: string };

/** Tiparul formularelor mici din fișă: rulează acțiunea, arată mesajul la refuz, reîmprospătează pagina la reușită. */
export function useActiune() {
  const router = useRouter();
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();
  const fa = (actiune: () => Promise<Rezultat>, dupa?: () => void) =>
    porneste(async () => {
      const r = await actiune();
      if (!r.ok) return setMesaj(r.mesaj);
      setMesaj(null);
      dupa?.();
      router.refresh();
    });
  return { fa, mesaj, lucreaza };
}

export const Mesaj = ({ text }: { text: string | null }) => (text ? <p role="alert" className="text-[13px] text-red-t">{text}</p> : null);

/** „Șterge”, în doi pași: al doilea click („Sigur?”) șterge. */
export function ButonSterge({ sterge, oprit }: { sterge: () => void; oprit: boolean }) {
  const [sigur, setSigur] = useState(false);
  return sigur ? (
    <button type="button" className="btn mic pericol flex-none" disabled={oprit} onClick={sterge} onBlur={() => setSigur(false)}>
      Sigur?
    </button>
  ) : (
    <button type="button" className="btn flex-none !px-2 !py-1 text-[11px]" disabled={oprit} onClick={() => setSigur(true)}>
      Șterge
    </button>
  );
}
