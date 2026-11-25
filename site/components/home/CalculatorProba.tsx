"use client";

// PROBĂ, de aruncat: variantele de calculator pe care le compară Andrei (2026-11-25). Cea aleasă se rescrie cu teste.
import { useState, type ReactNode } from "react";
import { Aurora } from "@/components/layout/Aurora";
import { cuDe, mii } from "@/lib/numere";
import { Calculator, Cursor } from "./Calculator";

const peLuna = (peSaptamana: number, lei: number) => Math.round((peSaptamana * 52 * lei) / 12);
const lei = (n: number) => `${mii(n)} lei`;

function trimite(text: string) {
  window.dispatchEvent(new CustomEvent("contact:serviciu", { detail: "automatizari" }));
  window.dispatchEvent(new CustomEvent("contact:calcul", { detail: `Din calculator: ${text}` }));
}

function Cadru({ titlu, stanga, bon }: { titlu: ReactNode; stanga: ReactNode; bon: ReactNode }) {
  return (
    <section className="calc bgs" id="calculator">
      <Aurora />
      <div className="eb">Calculator</div>
      <h2>{titlu}</h2>
      <div className="calc-in">
        <div>{stanga}</div>
        <div className="bon"><div className="bon-h">buildwithac</div>{bon}</div>
      </div>
    </section>
  );
}

const Rand = ({ a, b }: { a: string; b: string }) => <p><span>{a}</span><span>{b}</span></p>;
const Buton = ({ text }: { text: string }) => (
  <a className="bon-but" href="#formular" onClick={() => trimite(text)}>Vreau analiza gratuită <span aria-hidden>→</span></a>
);
const Nota = () => <p className="bon-nota">Estimare pe cifrele tale, nu o promisiune.</p>;

/** 2: tot ce pierde, pe un singur bon */
function Complet() {
  const [m, setM] = useState(45);
  const [c, setC] = useState(1);
  const [n, setN] = useState(2);
  const [p, setP] = useState(200);
  const zile = Math.floor((m * 250) / 60 / 8);
  const total = peLuna(c + n, p);
  return (
    <Cadru titlu={<>Cât te costă să faci totul <span className="serif gtxt">manual?</span></>}
      stanga={
        <div className="calc-cursoare" style={{ marginTop: 0 }}>
          <Cursor eticheta="Clienți pierduți pe săptămână pentru că n-ai apucat să răspunzi" arata={String} l={{ min: 0, max: 15, pas: 1 }} val={c} pune={setC} />
          <Cursor eticheta="Programări pe săptămână la care nu vine nimeni" arata={String} l={{ min: 0, max: 20, pas: 1 }} val={n} pune={setN} />
          <Cursor eticheta="Cât aduce un client" arata={lei} l={{ min: 50, max: 5000, pas: 50 }} val={p} pune={setP} />
          <Cursor eticheta="Minute pe zi cu munca repetată" arata={(x) => `${x} min`} l={{ min: 0, max: 240, pas: 5 }} val={m} pune={setM} />
        </div>
      }
      bon={
        <>
          <div className="bon-r">
            <Rand a="Fără răspuns" b={lei(peLuna(c, p))} />
            <Rand a="Programări ratate" b={lei(peLuna(n, p))} />
            <Rand a="Timpul tău" b={`${cuDe(zile, "zi", "zile")} pe an`} />
          </div>
          <output className="bon-t"><small>Pierzi cam</small><strong>{lei(total)}</strong><span>pe lună, plus {cuDe(zile, "zi", "zile")} de muncă pe an</span></output>
          <Nota />
          <Buton text={`cam ${lei(total)} pe lună din clienți pierduți (${c} pe săptămână) și programări ratate (${n} pe săptămână), plus ${cuDe(zile, "zi", "zile")} de muncă repetată pe an.`} />
        </>
      } />
  );
}

/** 3: omul își alege afacerea; cifrele de pornire și soluția se schimbă */
const AFACERI = [
  { nume: "Salon / frizerie", ce: "Programări pe săptămână la care nu vine nimeni", rand: "Programări ratate", n: 4, cat: "Cât costă o programare", p: 100, as: "o reamintire pe telefon cu o zi înainte, din care clientul se poate reprograma." },
  { nume: "Clinică", ce: "Pacienți pe săptămână care nu mai vin", rand: "Pacienți lipsă", n: 5, cat: "Cât costă o consultație", p: 250, as: "reamintiri automate și un raport seara, cu cine a lipsit și a fost rechemat." },
  { nume: "Imobiliare", ce: "Cereri pe săptămână la care răspunzi prea târziu și se pierd", rand: "Cereri pierdute", n: 1, cat: "Cât aduce în medie o cerere bună", p: 800, as: "răspuns în primul minut la fiecare cerere, cu proprietățile potrivite." },
  { nume: "Restaurant / cafenea", ce: "Rezervări pe săptămână la care nu vine nimeni", rand: "Rezervări ratate", n: 4, cat: "Cât lasă o masă", p: 150, as: "confirmarea rezervării pe telefon și eliberarea mesei, dacă nu confirmă." },
  { nume: "Service auto", ce: "Apeluri pe săptămână la care n-ai răspuns și s-au dus în altă parte", rand: "Apeluri pierdute", n: 3, cat: "Cât aduce o lucrare", p: 400, as: "un mesaj trimis singur după un apel ratat, cu programare direct din el." },
  { nume: "Magazin online", ce: "Comenzi pe săptămână pierdute pentru că n-ai răspuns la timp", rand: "Comenzi pierdute", n: 5, cat: "Cât e o comandă", p: 150, as: "un asistent pe site care răspunde pe loc la întrebările care se repetă." },
];
function PeAfacere() {
  const [i, setI] = useState(0);
  const [v, setV] = useState({ n: AFACERI[0].n, p: AFACERI[0].p });
  const a = AFACERI[i];
  const total = peLuna(v.n, v.p);
  return (
    <Cadru titlu={<>Cât pierde o afacere <span className="serif gtxt" style={{ whiteSpace: "nowrap" }}>ca a ta?</span></>}
      stanga={
        <>
          <div className="colab" style={{ padding: 0, minHeight: 0, background: "none" }}><div className="chips" role="group" aria-label="Ce afacere ai" style={{ padding: 0 }}>
            {AFACERI.map((x, k) => <button key={x.nume} type="button" className="chip" aria-pressed={k === i} onClick={() => { setI(k); setV({ n: x.n, p: x.p }); }}>{x.nume}</button>)}
          </div></div>
          <div className="calc-cursoare" style={{ minHeight: 190, marginTop: 26 }}>
            <Cursor eticheta={a.ce} arata={String} l={{ min: 0, max: 20, pas: 1 }} val={v.n} pune={(n) => setV((x) => ({ ...x, n }))} />
            <Cursor eticheta={a.cat} arata={lei} l={{ min: 50, max: 3000, pas: 50 }} val={v.p} pune={(p) => setV((x) => ({ ...x, p }))} />
          </div>
        </>
      }
      bon={
        <>
          <div className="bon-r" style={{ minHeight: 0 }}>
            <Rand a="Pe săptămână" b={`${v.n} × ${lei(v.p)}`} />
            <Rand a="Pe an" b={lei(v.n * v.p * 52)} />
          </div>
          <output className="bon-t"><small>Pierzi cam</small><strong>{lei(total)}</strong><span>pe lună</span></output>
          <p style={{ fontSize: 13, lineHeight: 1.55, borderTop: "2px dashed rgba(27,15,10,.3)", margin: "12px 0 0", paddingTop: 12 }}><b>Aș începe cu:</b> {a.as}</p>
          <p className="bon-nota" style={{ marginTop: 12 }}>Cifrele de pornire sunt un exemplu. Pune aici cifrele tale.</p>
          <Buton text={`${a.nume}, ${a.rand.toLowerCase()}: ${v.n} pe săptămână, ${lei(v.p)} fiecare. Cam ${lei(total)} pe lună.`} />
        </>
      } />
  );
}

/** 4: ce pierde acum și ce ar rămâne la el */
const PASTREZI = [["1 din 4", 0.25], ["Jumătate", 0.5], ["3 din 4", 0.75]] as const;
function InainteDupa() {
  const [c, setC] = useState(5);
  const [d, setD] = useState(3);
  const [p, setP] = useState(500);
  const [k, setK] = useState(0);
  const pierde = peLuna((c * d) / 10, p);
  const ramane = Math.round(pierde * PASTREZI[k][1]);
  return (
    <Cadru titlu={<>Cât ar rămâne <span className="serif gtxt">la tine?</span></>}
      stanga={
        <>
          <div className="calc-cursoare" style={{ marginTop: 0 }}>
            <Cursor eticheta="Cereri pe săptămână care rămân fără răspuns și nu se mai întorc" arata={String} l={{ min: 1, max: 30, pas: 1 }} val={c} pune={setC} />
            <Cursor eticheta="Din 10 cereri, câte cumpără" arata={(x) => `${x} din 10`} l={{ min: 1, max: 10, pas: 1 }} val={d} pune={setD} />
            <Cursor eticheta="Cât aduce un client" arata={lei} l={{ min: 50, max: 5000, pas: 50 }} val={p} pune={setP} />
          </div>
          <p style={{ fontSize: 15, color: "#e6dcd2", margin: "6px 0 10px" }}>Dacă ai păstra din ele:</p>
          <div className="colab" style={{ padding: 0, minHeight: 0, background: "none" }}><div className="chips" style={{ padding: 0 }} role="group" aria-label="Cât ai păstra">
            {PASTREZI.map(([t], i) => <button key={t} type="button" className="chip" aria-pressed={i === k} onClick={() => setK(i)}>{t}</button>)}
          </div></div>
        </>
      }
      bon={
        <>
          <div className="bon-r" style={{ minHeight: 0 }}>
            <Rand a="Pierzi acum" b={`${lei(pierde)} / lună`} />
            <Rand a="Dacă păstrezi" b={PASTREZI[k][0].toLowerCase()} />
          </div>
          <output className="bon-t"><small>Rămân la tine</small><strong style={{ color: "#2f7d3a" }}>+{lei(ramane)}</strong><span>pe lună, adică {lei(Math.round(((c * d) / 10) * p * 52 * PASTREZI[k][1]))} pe an</span></output>
          <Nota />
          <Buton text={`pierd cam ${lei(pierde)} pe lună din cereri fără răspuns (${c} pe săptămână). Dacă păstrez ${PASTREZI[k][0].toLowerCase()}, rămân ${lei(ramane)} pe lună.`} />
        </>
      } />
  );
}

const VARIANTE = [["1 Acum", Calculator], ["2 Tot pe un bon", Complet], ["3 Afacerea ta", PeAfacere], ["4 Ce rămâne", InainteDupa]] as const;

export function CalculatorProba() {
  const [k, setK] = useState(0);
  const [deschis, setDeschis] = useState(false);
  const V = VARIANTE[k][1];
  return (
    <>
      <V />
      <div data-fara-tipar style={{ position: "fixed", right: 10, bottom: 10, zIndex: 90, background: "rgba(11,9,8,.94)", border: "1px solid rgba(255,181,46,.6)", borderRadius: 18, padding: 8, display: "flex", flexWrap: "wrap", gap: 6, maxWidth: "calc(100vw - 20px)" }}>
        {deschis && VARIANTE.map(([t], i) => (
          <button key={t} type="button" style={{ font: "600 13px sans-serif", padding: "8px 11px", borderRadius: 999, border: "1px solid rgba(255,255,255,.3)", background: i === k ? "#f6efe3" : "transparent", color: i === k ? "#1b0f0a" : "#f6efe3" }}
            onClick={() => { setK(i); requestAnimationFrame(() => document.getElementById("calculator")?.scrollIntoView({ behavior: "instant" })); }}>{t}</button>
        ))}
        <button type="button" style={{ font: "600 13px sans-serif", padding: "8px 11px", borderRadius: 999, border: 0, background: "none", color: "#ffb52e" }}
          onClick={() => { setDeschis((x) => !x); if (!deschis) document.getElementById("calculator")?.scrollIntoView({ behavior: "instant" }); }}>{deschis ? "închide" : "Calculator: variante"}</button>
      </div>
    </>
  );
}
