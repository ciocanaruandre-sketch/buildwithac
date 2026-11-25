"use client";

import { useState, type CSSProperties } from "react";
import { Aurora } from "@/components/layout/Aurora";
import { calcul, LIMITE, textCalcul, type Intrari } from "@/lib/calculator";
import { cuDe, mii } from "@/lib/numere";
import "./calculator.css";

type Camp = keyof Intrari;

const CURSOARE: { camp: Camp; eticheta: string; arata: (n: number) => string }[] = [
  { camp: "cereri", eticheta: "Cereri pe săptămână la care răspunzi târziu sau deloc", arata: String },
  { camp: "programari", eticheta: "Programări pe săptămână la care nu vine nimeni", arata: String },
  { camp: "leiPeClient", eticheta: "Cât aduce un client", arata: (n) => `${mii(n)} lei` },
  { camp: "minute", eticheta: "Minute pe zi cu munca repetată", arata: (n) => `${n} min` },
];

const LA_INCEPUT = Object.fromEntries(Object.entries(LIMITE).map(([k, l]) => [k, l.start])) as Intrari;

/** „Cât poți câștiga dacă nu mai faci totul manual?”: rezultatul iese pe un bon de casă și pleacă cu omul în formular. */
export function Calculator() {
  const [v, setV] = useState(LA_INCEPUT);
  const { dinCereri, dinProgramari, leiPeLuna, zile } = calcul(v);
  const zileText = cuDe(zile, "zi", "zile");

  const trimite = () => {
    window.dispatchEvent(new CustomEvent("contact:serviciu", { detail: "automatizari" }));
    window.dispatchEvent(new CustomEvent("contact:calcul", { detail: textCalcul(v) }));
  };

  return (
    <section className="calc bgs" id="calculator">
      <Aurora />
      <div className="eb">Calculator</div>
      <h2>Cât poți câștiga dacă nu mai faci totul <span className="serif gtxt">manual?</span></h2>
      <div className="calc-in">
        <div className="calc-cursoare">
          {CURSOARE.map(({ camp, eticheta, arata }) => {
            const l = LIMITE[camp];
            return (
              <label key={camp} className="cursor">
                <span className="cursor-sus"><span>{eticheta}</span><b aria-hidden>{arata(v[camp])}</b></span>
                <input type="range" min={l.min} max={l.max} step={l.pas} value={v[camp]} aria-label={eticheta} aria-valuetext={arata(v[camp])}
                  style={{ "--p": `${((v[camp] - l.min) / (l.max - l.min)) * 100}%` } as CSSProperties}
                  onChange={(e) => setV((x) => ({ ...x, [camp]: Number(e.target.value) }))} />
              </label>
            );
          })}
        </div>
        <div className="bon">
          <div className="bon-h">buildwithac</div>
          <div className="bon-r">
            {dinCereri > 0 && <p><span>1 din 10 cereri</span><span>+{mii(dinCereri)} lei</span></p>}
            {dinProgramari > 0 && <p><span>1 din 4 programări</span><span>+{mii(dinProgramari)} lei</span></p>}
            {zile > 0 && <p><span>Jumătate din timp</span><span>{zileText} pe an</span></p>}
          </div>
          <output className="bon-t">
            {leiPeLuna || zile ? (
              <>
                <small>Poți câștiga până la</small>
                <strong>+{leiPeLuna ? `${mii(leiPeLuna)} lei` : zileText}</strong>
                <span>{leiPeLuna ? `pe lună${zile ? `, plus ${zileText} pe an pentru tine` : ""}` : "pe an pentru tine"}</span>
              </>
            ) : (
              <span>Mută un cursor ca să vezi cât poți câștiga.</span>
            )}
          </output>
          <p className="bon-nota">Estimare prudentă, nu o promisiune. Costul automatizării nu e scăzut din sumă.</p>
          <a className="bon-but" href="#formular" onClick={trimite}>Vreau analiza gratuită <span aria-hidden>→</span></a>
        </div>
      </div>
    </section>
  );
}
