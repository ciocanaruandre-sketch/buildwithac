"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Aurora } from "@/components/layout/Aurora";
import { calculClienti, calculTimp, LIMITE, textClienti, textTimp, ZILE_LUCRATOARE } from "@/lib/calculator";
import { cuDe, mii } from "@/lib/numere";
import "./calculator.css";

const FILE = [
  { cheie: "timp", titlu: "Timpul meu" },
  { cheie: "clienti", titlu: "Clienții pierduți" },
] as const;
type Fila = (typeof FILE)[number]["cheie"];
type Camp = keyof typeof LIMITE;

const CURSOARE: Record<Fila, { camp: Camp; eticheta: string; arata: (n: number) => string }[]> = {
  timp: [
    { camp: "minute", eticheta: "Minute pe zi cu munca repetată", arata: (n) => `${n} min` },
    { camp: "leiPeOra", eticheta: "Cât valorează o oră de-a ta", arata: (n) => `${n} lei` },
  ],
  clienti: [
    { camp: "cereri", eticheta: "Cereri pe săptămână care rămân fără răspuns și nu se mai întorc", arata: String },
    { camp: "dinZece", eticheta: "Din 10 cereri, câte cumpără", arata: (n) => `${n} din 10` },
    { camp: "leiPeClient", eticheta: "Cât aduce un client", arata: (n) => `${mii(n)} lei` },
  ],
};

const LA_INCEPUT = Object.fromEntries(Object.entries(LIMITE).map(([k, l]) => [k, l.start])) as Record<Camp, number>;

/** „Cât te costă să faci totul manual?”: rezultatul iese pe un bon de casă și pleacă cu omul în formular. */
export function Calculator() {
  const [fila, setFila] = useState<Fila>("clienti");
  const [v, setV] = useState(LA_INCEPUT);
  const butoane = useRef<Partial<Record<Fila, HTMLButtonElement | null>>>({});

  const timp = calculTimp(v);
  const { leiPeLuna } = calculClienti(v);

  const laTasta = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const alta: Fila = fila === "timp" ? "clienti" : "timp";
    setFila(alta);
    butoane.current[alta]?.focus();
  };

  const trimite = () => {
    window.dispatchEvent(new CustomEvent("contact:serviciu", { detail: "automatizari" }));
    window.dispatchEvent(new CustomEvent("contact:calcul", { detail: fila === "timp" ? textTimp(v) : textClienti(v) }));
  };

  return (
    <section className="calc bgs" id="calculator">
      <Aurora />
      <div className="eb">Calculator</div>
      <h2>Cât te costă să faci totul <span className="serif gtxt">manual?</span></h2>
      <div className="calc-in">
        <div>
          <div className="calc-file" role="tablist" aria-label="Ce calculezi" onKeyDown={laTasta}>
            {FILE.map((f) => (
              <button key={f.cheie} type="button" role="tab" id={`calc-fila-${f.cheie}`} aria-controls="calc-panou"
                aria-selected={fila === f.cheie} tabIndex={fila === f.cheie ? 0 : -1}
                ref={(el) => { butoane.current[f.cheie] = el; }} onClick={() => setFila(f.cheie)}>
                {f.titlu}
              </button>
            ))}
          </div>
          <div className="calc-cursoare" role="tabpanel" id="calc-panou" aria-labelledby={`calc-fila-${fila}`}>
            {CURSOARE[fila].map(({ camp, eticheta, arata }) => {
              const l = LIMITE[camp];
              return (
                <label key={camp} className="cursor">
                  <span className="cursor-sus"><span>{eticheta}</span><b aria-hidden>{arata(v[camp])}</b></span>
                  <input type="range" min={l.min} max={l.max} step={l.pas} value={v[camp]} aria-label={eticheta} aria-valuetext={arata(v[camp])}
                    style={{ "--p": `${((v[camp] - l.min) / (l.max - l.min)) * 100}%` } as React.CSSProperties}
                    onChange={(e) => setV((x) => ({ ...x, [camp]: Number(e.target.value) }))} />
                </label>
              );
            })}
          </div>
        </div>
        <div className="bon">
          <span className="tp" aria-hidden />
          <div className="bon-h">buildwithac</div>
          <div className="bon-r" aria-hidden>
            {fila === "timp" ? (
              <>
                <p><span>Munca repetată</span><span>{v.minute} min × {ZILE_LUCRATOARE} zile</span></p>
                <p><span>Ora ta</span><span>{v.leiPeOra} lei</span></p>
              </>
            ) : (
              <>
                <p><span>Cereri pierdute</span><span>{v.cereri} × 52 săpt.</span></p>
                <p><span>Ar fi cumpărat</span><span>{v.dinZece} din 10</span></p>
                <p><span>Un client</span><span>{mii(v.leiPeClient)} lei</span></p>
                <p><span>Împărțit la</span><span>12 luni</span></p>
              </>
            )}
          </div>
          <output className="bon-t">
            <small>Pierzi cam</small>
            {fila === "timp" ? (
              <><strong>{mii(timp.lei)} lei</strong><span>pe an, adică {cuDe(timp.ore, "oră", "ore")}</span></>
            ) : (
              <><strong>{mii(leiPeLuna)} lei</strong><span>pe lună</span></>
            )}
          </output>
          <p className="bon-nota">Estimare pe cifrele tale, nu o promisiune.</p>
          <a className="bon-but" href="#formular" onClick={trimite}>Vreau analiza gratuită <span aria-hidden>→</span></a>
        </div>
      </div>
    </section>
  );
}
