"use client";

import { useState } from "react";
import { adaugaCont, stergeCont } from "@/app/(app)/clienti/[id]/actiuni-fisa";
import { ButonSterge, Mesaj, useActiune } from "@/components/fisa/comune";
import { AL_CUI, ETICHETE, UNDE_PAROLA, type AlCui, type UndeParola } from "@/lib/tipuri";

export type ContAfisat = { id: string; serviciu: string; cont: string; al_cui: AlCui; unde_parola: UndeParola };

const GOL = { serviciu: "", cont: "", alCui: "client" as string, undeParola: "nu_e_cazul" as string };

/** Tab-ul „Conturi”: ce cont e, al cui e și unde e parola. Parola însăși nu se scrie nicăieri. */
export function Conturi({ proiectId, conturi }: { proiectId: string; conturi: ContAfisat[] }) {
  const { fa, mesaj, lucreaza } = useActiune();
  const [d, setD] = useState(GOL);

  return (
    <div data-testid="conturi">
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-[180px] flex-1 flex-col gap-1">
          <span className="lbl">Serviciu</span>
          <input className="camp" placeholder="Vercel, domeniu, Google Business…" value={d.serviciu} onChange={(e) => setD({ ...d, serviciu: e.target.value })} />
        </label>
        <label className="flex min-w-[180px] flex-1 flex-col gap-1">
          <span className="lbl">Cont</span>
          <input className="camp" placeholder="numele contului sau adresa, nu parola" autoComplete="off" value={d.cont} onChange={(e) => setD({ ...d, cont: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="lbl">Al cui</span>
          <select className="camp !w-auto" value={d.alCui} onChange={(e) => setD({ ...d, alCui: e.target.value })}>
            {AL_CUI.map((x) => (
              <option key={x} value={x}>{ETICHETE.alCui[x]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="lbl">Unde e parola</span>
          <select className="camp !w-auto" value={d.undeParola} onChange={(e) => setD({ ...d, undeParola: e.target.value })}>
            {UNDE_PAROLA.map((x) => (
              <option key={x} value={x}>{ETICHETE.undeParola[x]}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn pri" disabled={lucreaza} onClick={() => fa(() => adaugaCont(proiectId, d), () => setD(GOL))}>
          Adaugă contul
        </button>
      </div>
      <div className="mb-3">
        <Mesaj text={mesaj} />
      </div>

      {conturi.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left">
                {["Serviciu", "Cont", "Al cui", "Parola", ""].map((t, i) => (
                  <th key={i} className="lbl px-2 py-2 font-semibold">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conturi.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-2 py-2">{c.serviciu}</td>
                  <td className="px-2 py-2 font-mono text-[12px] break-all">{c.cont}</td>
                  <td className="px-2 py-2">
                    <span className={`chip ${c.al_cui === "client" ? "green" : "amber"}`}>{ETICHETE.alCui[c.al_cui]}</span>
                  </td>
                  <td className="px-2 py-2 text-ink-2">{ETICHETE.undeParola[c.unde_parola]}</td>
                  <td className="px-2 py-2 text-right">
                    <ButonSterge oprit={lucreaza} sterge={() => fa(() => stergeCont(c.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 rounded-r border border-[#5a4214] bg-[#2a2010] px-3 py-2.5 text-[13px] text-ink-2">
        <b className="text-amber">Parolele</b> nu stau în CRM. Aici scrii doar ce cont e, al cui e și unde e parola.
      </p>
    </div>
  );
}
