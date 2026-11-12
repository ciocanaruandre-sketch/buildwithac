"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Rezultat = { ok: true } | { ok: false; mesaj: string };

/** Rulează o acțiune de server: mesajul de eroare rămâne pe ecran, iar la reușită pagina se reîmprospătează. */
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
  return { mesaj, setMesaj, lucreaza, fa };
}
