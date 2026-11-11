"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adaugaNotita } from "@/app/(app)/lead-uri/[id]/actiuni";

export function FormularNotita({ id }: { id: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  const trimite = () =>
    porneste(async () => {
      const r = await adaugaNotita(id, text, link);
      if (!r.ok) return setMesaj(r.mesaj);
      setText("");
      setLink("");
      setMesaj(null);
      router.refresh();
    });

  return (
    <div className="mb-4 flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="lbl">Notiță nouă</span>
        <textarea className="camp min-h-20" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <input className="camp !w-auto flex-1" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link de notă vocală (opțional)" aria-label="Link de notă vocală" />
        <button type="button" className="btn pri" disabled={lucreaza || !text.trim()} onClick={trimite}>
          Adaugă notița
        </button>
      </div>
      {mesaj && <p role="alert" className="text-[13px] text-red-t">{mesaj}</p>}
    </div>
  );
}
