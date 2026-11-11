"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { adaugaLink, confirmaFisier, pregatesteIncarcare, stergeMaterial } from "@/app/(app)/clienti/[id]/actiuni-fisa";
import { ButonSterge, Mesaj, useActiune } from "@/components/fisa/comune";
import { BUCKET, MARIME_MAXIMA } from "@/lib/fisiere";
import { supabaseBrowser } from "@/lib/supabase/browser";

export type MaterialAfisat = { id: string; titlu: string; nota: string | null; eticheta: string; href: string; eFisier: boolean; cine: string; cand: string; marime: string | null };

const GOL = { titlu: "", url: "", nota: "" };
const PREA_MARE = "Fișierul are peste 25 MB. Pune-l pe Drive și adaugă link-ul.";
const N_A_AJUNS = "Fișierul n-a ajuns. Încearcă din nou.";

/** Tab-ul „Materiale”: link-urile (Drive, Figma, răspunsurile din formular) și fișierele proiectului. */
export function Materiale({ proiectId, materiale }: { proiectId: string; materiale: MaterialAfisat[] }) {
  const router = useRouter();
  const { fa, mesaj, lucreaza } = useActiune();
  const [d, setD] = useState(GOL);
  const [seIncarca, setSeIncarca] = useState(false);
  const [mesajFisier, setMesajFisier] = useState<string | null>(null);
  const alegere = useRef<HTMLInputElement>(null);

  /** Fișierul urcă direct din browser în Supabase, cu un link semnat făcut de server; apoi serverul îl trece la Materiale. */
  async function incarca(f: File) {
    if (f.size > MARIME_MAXIMA) return setMesajFisier(PREA_MARE);
    setSeIncarca(true);
    setMesajFisier(null);
    try {
      const pregatit = await pregatesteIncarcare(proiectId, f.name, f.size);
      if (!pregatit.ok) return setMesajFisier(pregatit.mesaj);
      const { error } = await supabaseBrowser().storage.from(BUCKET).uploadToSignedUrl(pregatit.cale, pregatit.token, f, { contentType: f.type || "application/octet-stream" });
      if (error) return setMesajFisier(N_A_AJUNS);
      const r = await confirmaFisier(proiectId, { titlu: f.name, cale: pregatit.cale, nota: "" });
      if (!r.ok) return setMesajFisier(r.mesaj);
      router.refresh();
    } catch {
      setMesajFisier(N_A_AJUNS);
    } finally {
      setSeIncarca(false);
      if (alegere.current) alegere.current.value = "";
    }
  }

  const camp = (eticheta: string, cheie: keyof typeof GOL, loc?: string) => (
    <label className="flex min-w-[180px] flex-1 flex-col gap-1">
      <span className="lbl">{eticheta}</span>
      <input className="camp" placeholder={loc} value={d[cheie]} onChange={(e) => setD({ ...d, [cheie]: e.target.value })} />
    </label>
  );

  return (
    <div data-testid="materiale">
      <div className="mb-3 flex flex-wrap items-end gap-2">
        {camp("Titlu", "titlu")}
        {camp("Link", "url", "https://…")}
        {camp("Notă (opțional)", "nota")}
        <button type="button" className="btn pri" disabled={lucreaza} onClick={() => fa(() => adaugaLink(proiectId, d), () => setD(GOL))}>
          Adaugă link-ul
        </button>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className={`btn ${seIncarca ? "pointer-events-none opacity-50" : ""}`}>
          {seIncarca ? "Se încarcă…" : "+ Fișier"}
          <input
            ref={alegere}
            type="file"
            className="sr-only"
            aria-label="Încarcă un fișier"
            disabled={seIncarca}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void incarca(f);
            }}
          />
        </label>
        <span className="text-[12px] text-ink-3">cel mult 25 MB; ce e mai mare, pe Drive, ca link</span>
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <Mesaj text={mesaj} />
        <Mesaj text={mesajFisier} />
      </div>

      {materiale.length === 0 ? (
        <p className="text-[13px] text-ink-3">Niciun material încă. Pune aici link-urile de Drive sau Figma, răspunsurile din formular și fișierele de la client.</p>
      ) : (
        <ul className="flex flex-col">
          {materiale.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2.5 text-[13px] last:border-0">
              <span className="grid h-7 w-9 flex-none place-items-center rounded-r border border-line-2 text-[10.5px] font-semibold text-ink-3">{m.eticheta}</span>
              <div className="min-w-[160px] flex-1">
                <span className="font-medium break-words">{m.titlu}</span>
                {m.nota && <p className="text-[12px] text-ink-3">{m.nota}</p>}
              </div>
              {m.marime && <span className="flex-none num text-[12px] text-ink-3">{m.marime}</span>}
              <span className="flex-none text-[12px] text-ink-3">
                {m.cine} · {m.cand}
              </span>
              {m.eFisier ? (
                // un fișier se descarcă: fără filă nouă
                <a href={m.href} className="flex-none text-amber">
                  deschide
                </a>
              ) : (
                <a href={m.href} target="_blank" rel="noreferrer" className="flex-none text-amber">
                  deschide
                </a>
              )}
              <ButonSterge oprit={lucreaza} sterge={() => fa(() => stergeMaterial(m.id))} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
