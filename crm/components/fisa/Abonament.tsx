"use client";

import { useState } from "react";
import { opresteAbonament, pornesteAbonament, schimbaAbonament, schimbaProcentAbonament } from "@/app/(app)/clienti/[id]/actiuni-finante";
import { useActiune } from "@/components/finante/useActiune";
import { termenScurt } from "@/lib/afisare";
import { lei } from "@/lib/proiecte";
import { ziuaRomaniei } from "@/lib/timp";

type Om = { id: string; nume: string };
export type AbonamentFisa = { id: string; suma_lei: number; zi: number; porneste: string; oameni: (Om & { rol: string; procent: number | null })[] };

const procentText = (p: number | null) => (p === null ? "" : String(p).replace(".", ","));

/** Procentul unui om din lista abonamentului: se salvează când ieși din câmp. */
function ProcentOm({ abonamentId, om }: { abonamentId: string; om: Om & { rol: string; procent: number | null } }) {
  const [v, setV] = useState(procentText(om.procent));
  const { mesaj, lucreaza, fa } = useActiune();
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="min-w-0 flex-1 truncate text-ink-2">
        {om.nume} · {om.rol}
      </span>
      <input
        className="camp !w-[64px] !px-2 !py-1 text-right text-[12.5px]"
        aria-label={`Procentul lui ${om.nume} din mentenanță`}
        placeholder="%"
        inputMode="decimal"
        value={v}
        disabled={lucreaza}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== procentText(om.procent) && fa(() => schimbaProcentAbonament(abonamentId, om.id, v))}
      />
      <span className="text-ink-3">%</span>
      {mesaj && <span role="alert" className="text-[12px] text-red-t">{mesaj}</span>}
    </div>
  );
}

/** Cardul Mentenanță: pornirea abonamentului lunar, schimbarea, oprirea și oamenii cu procent din el. Tranșele vin dedesubt (`children`). */
export function Abonament({
  proiectId,
  abonament,
  constructori,
  incasat,
  children,
}: {
  proiectId: string;
  abonament: AbonamentFisa | null;
  constructori: Om[];
  incasat: number;
  children?: React.ReactNode;
}) {
  const [mod, setMod] = useState<"" | "porneste" | "schimba" | "opreste">("");
  const [d, setD] = useState({ suma: "", zi: "5", porneste: "", omId: "" });
  const { mesaj, setMesaj, lucreaza, fa } = useActiune();
  const inchide = () => {
    setMod("");
    setMesaj(null);
  };
  const camp = (eticheta: string, cheie: "suma" | "zi" | "porneste", tip = "text") => (
    <label className="flex min-w-[110px] flex-1 flex-col gap-1">
      <span className="lbl">{eticheta}</span>
      <input className="camp" type={tip} inputMode={tip === "text" ? "numeric" : undefined} value={d[cheie]} onChange={(e) => setD({ ...d, [cheie]: e.target.value })} />
    </label>
  );

  return (
    <div className="rounded-r border border-line px-3.5 py-3" data-testid="mentenanta">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="lbl">Mentenanță</span>
        {abonament ? (
          <span className="text-[13px] text-ink-2">
            {lei(abonament.suma_lei)} pe lună, în fiecare {abonament.zi} a lunii · din {termenScurt(abonament.porneste)}
            {incasat > 0 && <> · încasat până acum {lei(incasat)}</>}
          </span>
        ) : (
          <span className="text-[13px] text-ink-3">Nu e pornită.</span>
        )}
        {!mod && (
          <span className="ml-auto flex gap-1.5">
            {abonament ? (
              <>
                <button type="button" className="btn mic" onClick={() => (setD({ ...d, suma: String(abonament.suma_lei), zi: String(abonament.zi) }), setMod("schimba"))}>
                  Schimbă
                </button>
                <button type="button" className="btn mic" onClick={() => setMod("opreste")}>
                  Oprește
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn mic"
                onClick={() => (setD({ suma: "", zi: "5", porneste: ziuaRomaniei(new Date()), omId: constructori[0]?.id ?? "" }), setMod("porneste"))}
              >
                Pornește mentenanța
              </button>
            )}
          </span>
        )}
      </div>

      {mod && (
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          {mod === "opreste" ? (
            <p className="text-[13px] text-ink-2">Oprești mentenanța? Tranșele viitoare dispar; cele întârziate rămân de încasat.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {camp("Suma pe lună (lei)", "suma")}
              {camp("Ziua din lună (1–28)", "zi")}
              {mod === "porneste" && camp("Pornește de pe", "porneste", "date")}
              {mod === "porneste" && (
                <label className="flex min-w-[150px] flex-1 flex-col gap-1">
                  <span className="lbl">Cine se ocupă</span>
                  <select className="camp" value={d.omId} onChange={(e) => setD({ ...d, omId: e.target.value })}>
                    <option value="">Doar eu</option>
                    {constructori.map((o) => (
                      <option key={o.id} value={o.id}>{o.nume}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          {mod === "schimba" && <p className="text-[12.5px] text-ink-3">Suma nouă contează de la tranșele neîncasate de azi încolo; ziua nouă, din luna următoare.</p>}
          {mesaj && <p role="alert" className="text-[13px] text-red-t">{mesaj}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn mic ${mod === "opreste" ? "pericol" : "pri"}`}
              disabled={lucreaza}
              onClick={() =>
                fa(
                  () => (mod === "porneste" ? pornesteAbonament(proiectId, d) : mod === "schimba" ? schimbaAbonament(abonament!.id, d) : opresteAbonament(abonament!.id)),
                  inchide,
                )
              }
            >
              {mod === "porneste" ? "Pornește" : mod === "schimba" ? "Salvează" : "Da, oprește"}
            </button>
            <button type="button" className="btn mic" disabled={lucreaza} onClick={inchide}>
              Renunță
            </button>
          </div>
        </div>
      )}

      {abonament && abonament.oameni.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
          <span className="lbl">Comision din mentenanță</span>
          {abonament.oameni.map((o) => (
            <ProcentOm key={o.id} abonamentId={abonament.id} om={o} />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
