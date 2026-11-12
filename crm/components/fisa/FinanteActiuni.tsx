"use client";

import { useState } from "react";
import { adaugaTransa, anuleazaIncasare, bifeazaComision, returneaza, schimbaTransa, stergeTransa } from "@/app/(app)/clienti/[id]/actiuni-finante";
import { useActiune } from "@/components/finante/useActiune";
import { termenScurt } from "@/lib/afisare";
import { lei } from "@/lib/proiecte";
import { ziuaRomaniei } from "@/lib/timp";

/** Bulina unui comision: „De plătit” (auriu) ↔ „Plătit <data>” (verde). Fără procent stabilit nu se poate bifa. */
export function BulinaComision({ id, platitLa, stabilit }: { id: string; platitLa: string | null; stabilit: boolean }) {
  const { mesaj, lucreaza, fa } = useActiune();
  if (!stabilit) return <span className="chip text-[11.5px]">procent nestabilit</span>;
  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        className={`chip cursor-pointer text-[11.5px] ${platitLa ? "green" : "amber"}`}
        disabled={lucreaza}
        title={platitLa ? "Apasă dacă bifa e greșită" : "Apasă când i-ai plătit"}
        onClick={() => fa(() => bifeazaComision(id, !platitLa))}
      >
        {platitLa ? `Plătit ${termenScurt(platitLa)}` : "De plătit"}
      </button>
      {mesaj && <span role="alert" className="text-[11.5px] text-red-t">{mesaj}</span>}
    </span>
  );
}

const Campuri = ({ d, setD, cuNume = true }: { d: { eticheta: string; suma: string; zi: string }; setD: (x: { eticheta: string; suma: string; zi: string }) => void; cuNume?: boolean }) => (
  <div className="flex flex-wrap gap-2">
    {cuNume && (
      <label className="flex min-w-[140px] flex-1 flex-col gap-1">
        <span className="lbl">Numele tranșei</span>
        <input className="camp" value={d.eticheta} maxLength={60} onChange={(e) => setD({ ...d, eticheta: e.target.value })} />
      </label>
    )}
    <label className="flex min-w-[110px] flex-1 flex-col gap-1">
      <span className="lbl">Suma (lei)</span>
      <input className="camp" inputMode="numeric" value={d.suma} onChange={(e) => setD({ ...d, suma: e.target.value })} />
    </label>
    <label className="flex min-w-[150px] flex-1 flex-col gap-1">
      <span className="lbl">Scadența</span>
      <input className="camp" type="date" value={d.zi} onChange={(e) => setD({ ...d, zi: e.target.value })} />
    </label>
  </div>
);

/** Pe o tranșă: „Schimbă” și „Șterge” cât nu e încasată; „Anulează încasarea” după. */
export function TransaActiuni({ id, incasata, eticheta, suma, scadenta }: { id: string; incasata: boolean; eticheta: string; suma: number; scadenta: string }) {
  const [mod, setMod] = useState<"" | "schimba" | "sterge" | "anuleaza">("");
  const [d, setD] = useState({ eticheta, suma: String(suma), zi: scadenta });
  const { mesaj, setMesaj, lucreaza, fa } = useActiune();
  const inchide = () => {
    setMod("");
    setMesaj(null);
  };

  if (!mod) {
    return (
      <span className="flex gap-1.5">
        {incasata ? (
          <button type="button" className="text-[12px] text-ink-3 hover:text-ink" onClick={() => setMod("anuleaza")}>
            Anulează încasarea
          </button>
        ) : (
          <>
            <button type="button" className="text-[12px] text-ink-3 hover:text-ink" onClick={() => setMod("schimba")}>
              Schimbă
            </button>
            <button type="button" className="text-[12px] text-ink-3 hover:text-ink" onClick={() => setMod("sterge")}>
              Șterge
            </button>
          </>
        )}
      </span>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 pt-2">
      {mod === "schimba" && <Campuri d={d} setD={setD} />}
      {mod === "sterge" && <p className="text-[13px] text-ink-2">Ștergi tranșa „{eticheta}”?</p>}
      {mod === "anuleaza" && <p className="text-[13px] text-ink-2">Anulezi încasarea? Comisioanele din ea dispar și tranșa redevine de încasat.</p>}
      {mesaj && <p role="alert" className="text-[13px] text-red-t">{mesaj}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className={`btn mic ${mod === "schimba" ? "pri" : "pericol"}`}
          disabled={lucreaza}
          onClick={() => fa(() => (mod === "schimba" ? schimbaTransa(id, d) : mod === "sterge" ? stergeTransa(id) : anuleazaIncasare(id)), inchide)}
        >
          {mod === "schimba" ? "Salvează" : mod === "sterge" ? "Da, șterge" : "Da, anulează"}
        </button>
        <button type="button" className="btn mic" disabled={lucreaza} onClick={inchide}>
          Renunță
        </button>
      </div>
    </div>
  );
}

/** „+ Tranșă”: o tranșă în plus (bani pentru ceva nou, o plată refăcută după o returnare). */
export function AdaugaTransa({ proiectId }: { proiectId: string }) {
  const [deschis, setDeschis] = useState(false);
  const [d, setD] = useState({ eticheta: "Tranșă", suma: "", zi: "" });
  const { mesaj, lucreaza, fa } = useActiune();
  if (!deschis)
    return (
      <button type="button" className="btn mic" onClick={() => (setD({ eticheta: "Tranșă", suma: "", zi: ziuaRomaniei(new Date()) }), setDeschis(true))}>
        + Tranșă
      </button>
    );
  return (
    <div className="flex w-full flex-col gap-2 rounded-r border border-line p-3">
      <Campuri d={d} setD={setD} />
      {mesaj && <p role="alert" className="text-[13px] text-red-t">{mesaj}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn pri mic" disabled={lucreaza} onClick={() => fa(() => adaugaTransa(proiectId, d), () => setDeschis(false))}>
          Adaugă tranșa
        </button>
        <button type="button" className="btn mic" disabled={lucreaza} onClick={() => setDeschis(false)}>
          Renunță
        </button>
      </div>
    </div>
  );
}

/** „Marchează o returnare”: alegi încasarea și cât s-a dat înapoi. */
export function Returnare({ incasari }: { incasari: { id: string; eticheta: string; disponibil: number }[] }) {
  const [deschis, setDeschis] = useState(false);
  const [d, setD] = useState({ id: "", suma: "", zi: "" });
  const { mesaj, lucreaza, fa } = useActiune();
  if (!incasari.length) return null;
  if (!deschis)
    return (
      <button
        type="button"
        className="btn mic"
        onClick={() => {
          setD({ id: incasari[0].id, suma: String(incasari[0].disponibil), zi: ziuaRomaniei(new Date()) });
          setDeschis(true);
        }}
      >
        Marchează o returnare
      </button>
    );
  return (
    <div className="flex w-full flex-col gap-2 rounded-r border border-line p-3">
      <p className="text-[12.5px] text-ink-3">Comisioanele neplătite din partea returnată scad. Cele plătite devin minus la omul respectiv.</p>
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className="lbl">Încasarea</span>
          <select
            className="camp"
            value={d.id}
            onChange={(e) => setD({ ...d, id: e.target.value, suma: String(incasari.find((x) => x.id === e.target.value)?.disponibil ?? "") })}
          >
            {incasari.map((x) => (
              <option key={x.id} value={x.id}>
                {x.eticheta} · {lei(x.disponibil)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[110px] flex-1 flex-col gap-1">
          <span className="lbl">Suma returnată (lei)</span>
          <input className="camp" inputMode="numeric" value={d.suma} onChange={(e) => setD({ ...d, suma: e.target.value })} />
        </label>
        <label className="flex min-w-[150px] flex-1 flex-col gap-1">
          <span className="lbl">Data returnării</span>
          <input className="camp" type="date" value={d.zi} onChange={(e) => setD({ ...d, zi: e.target.value })} />
        </label>
      </div>
      {mesaj && <p role="alert" className="text-[13px] text-red-t">{mesaj}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn pericol mic" disabled={lucreaza} onClick={() => fa(() => returneaza(d.id, d), () => setDeschis(false))}>
          Marchează returnarea
        </button>
        <button type="button" className="btn mic" disabled={lucreaza} onClick={() => setDeschis(false)}>
          Renunță
        </button>
      </div>
    </div>
  );
}
