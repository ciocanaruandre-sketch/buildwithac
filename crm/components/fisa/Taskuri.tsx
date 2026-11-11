"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adaugaTask, bifeazaTask, schimbaTask, stergeTask, type DateTask, type Rezultat } from "@/app/(app)/clienti/[id]/actiuni-taskuri";

type Om = { id: string; nume: string };
export type TaskAfisat = { id: string; titlu: string; om_id: string | null; termen: string | null; gata: boolean; cine: string; cand: string; intarziat: boolean };

const GOL: DateTask = { titlu: "", omId: "", termen: "" };

/** Căsuța de bifat a unui task; folosită și în „Task-urile mele”. */
export function BifaTask({ id, titlu, gata }: { id: string; titlu: string; gata: boolean }) {
  const router = useRouter();
  const [lucreaza, porneste] = useTransition();
  const [bifat, setBifat] = useState(gata);
  return (
    <input
      type="checkbox"
      className="h-4 w-4 flex-none accent-[var(--amber)]"
      aria-label={`Gata: ${titlu}`}
      checked={bifat}
      disabled={lucreaza}
      onChange={(e) => {
        const nou = e.target.checked;
        setBifat(nou);
        porneste(async () => {
          const r = await bifeazaTask(id, nou);
          if (!r.ok) setBifat(!nou);
          router.refresh();
        });
      }}
    />
  );
}

/** Tab-ul „Task-uri”: lista (gata sortată de server), formularul de adăugat, „Schimbă” și „Șterge” pe fiecare rând. */
export function Taskuri({ proiectId, taskuri, oameni }: { proiectId: string; taskuri: TaskAfisat[]; oameni: Om[] }) {
  const router = useRouter();
  const [nou, setNou] = useState<DateTask>(GOL);
  const [schimb, setSchimb] = useState<{ id: string; d: DateTask } | null>(null);
  const [deSters, setDeSters] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  const fa = (actiune: () => Promise<Rezultat>, dupa: () => void) =>
    porneste(async () => {
      const r = await actiune();
      if (!r.ok) return setMesaj(r.mesaj);
      setMesaj(null);
      dupa();
      router.refresh();
    });

  const listaOameni = (
    <>
      <option value="">— nimeni —</option>
      {oameni.map((o) => (
        <option key={o.id} value={o.id}>{o.nume}</option>
      ))}
    </>
  );

  return (
    <div data-testid="taskuri">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1">
          <span className="lbl">Ce e de făcut</span>
          <input className="camp" value={nou.titlu} onChange={(e) => setNou({ ...nou, titlu: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="lbl">Cine</span>
          <select className="camp !w-auto" value={nou.omId} onChange={(e) => setNou({ ...nou, omId: e.target.value })}>
            {listaOameni}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="lbl">Termen</span>
          <input className="camp !w-auto" type="date" value={nou.termen} onChange={(e) => setNou({ ...nou, termen: e.target.value })} />
        </label>
        <button type="button" className="btn pri" disabled={lucreaza} onClick={() => fa(() => adaugaTask(proiectId, nou), () => setNou(GOL))}>
          Adaugă task-ul
        </button>
      </div>
      {mesaj && <p role="alert" className="mb-3 text-[13px] text-red-t">{mesaj}</p>}

      {taskuri.length === 0 ? (
        <p className="text-[13px] text-ink-3">Niciun task încă. Scrie-l pe primul mai sus.</p>
      ) : (
        <ul className="flex flex-col">
          {taskuri.map((t) =>
            schimb?.id === t.id ? (
              <li key={t.id} className="flex flex-wrap items-center gap-2 border-b border-line py-2 last:border-0">
                <input className="camp min-w-[220px] flex-1 !py-1.5" aria-label="Titlul task-ului" value={schimb.d.titlu} onChange={(e) => setSchimb({ id: t.id, d: { ...schimb.d, titlu: e.target.value } })} />
                <select className="camp !w-auto !py-1.5" aria-label="Cine face task-ul" value={schimb.d.omId} onChange={(e) => setSchimb({ id: t.id, d: { ...schimb.d, omId: e.target.value } })}>
                  {listaOameni}
                </select>
                <input className="camp !w-auto !py-1.5" type="date" aria-label="Termenul task-ului" value={schimb.d.termen} onChange={(e) => setSchimb({ id: t.id, d: { ...schimb.d, termen: e.target.value } })} />
                <button type="button" className="btn pri !px-2 !py-1 text-[11px]" disabled={lucreaza} onClick={() => fa(() => schimbaTask(t.id, schimb.d), () => setSchimb(null))}>
                  Salvează
                </button>
                <button type="button" className="btn !px-2 !py-1 text-[11px]" disabled={lucreaza} onClick={() => setSchimb(null)}>
                  Renunță
                </button>
              </li>
            ) : (
              <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2 text-[13px] last:border-0">
                <BifaTask key={`${t.id}|${t.gata}`} id={t.id} titlu={t.titlu} gata={t.gata} />
                <span className={`min-w-[160px] flex-1 ${t.gata ? "text-ink-3 line-through" : ""}`}>{t.titlu}</span>
                <span className={`flex-none font-mono text-[11px] ${t.intarziat ? "text-red-t" : "text-ink-3"}`}>
                  {[t.cine, t.cand, t.intarziat ? "întârziat" : ""].filter(Boolean).join(" · ")}
                </span>
                <button type="button" className="btn flex-none !px-2 !py-1 text-[11px]" disabled={lucreaza} onClick={() => setSchimb({ id: t.id, d: { titlu: t.titlu, omId: t.om_id ?? "", termen: t.termen ?? "" } })}>
                  Schimbă
                </button>
                {deSters === t.id ? (
                  <button type="button" className="btn mic pericol flex-none" disabled={lucreaza} onClick={() => fa(() => stergeTask(t.id), () => setDeSters(null))}>
                    Sigur?
                  </button>
                ) : (
                  <button type="button" className="btn flex-none !px-2 !py-1 text-[11px]" disabled={lucreaza} onClick={() => setDeSters(t.id)}>
                    Șterge
                  </button>
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
