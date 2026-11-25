"use client";

// TEMPORAR (planul 18, Task 8 îl scoate): bara cu care Andrei schimbă variantele pe previzualizare
import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const GRUPURI = [
  { cheie: "port", titlu: "Portofoliu", variante: [["", "Rânduri"], ["teanc", "Teanc"], ["lista", "Listă"]], tinta: "portofoliu" },
  { cheie: "calc", titlu: "Calculator", variante: [["", "Bon"], ["caiet", "Caiet"]], tinta: "calculator" },
  { cheie: "ghid", titlu: "Ghiduri", variante: [["", "Foi"], ["plic", "Plic"]], tinta: "ghiduri" },
] as const;

export function Variante() {
  const [deschis, setDeschis] = useState(false);
  const [ales, setAles] = useState<Record<string, string>>({});

  useEffect(() => {
    for (const [k, v] of Object.entries(ales)) document.documentElement.dataset[k] = v;
    const t = setTimeout(() => ScrollTrigger.refresh(), 60);
    return () => clearTimeout(t);
  }, [ales]);

  const alege = (g: (typeof GRUPURI)[number], v: string) => {
    setAles((a) => ({ ...a, [g.cheie]: v }));
    requestAnimationFrame(() => document.getElementById(g.tinta)?.scrollIntoView({ behavior: "instant" }));
  };

  const buton = (activ: boolean): React.CSSProperties => ({ font: "600 13px sans-serif", padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.3)", background: activ ? "#f6efe3" : "transparent", color: activ ? "#1b0f0a" : "#f6efe3" });
  return (
    <div data-fara-tipar style={{ position: "fixed", left: 10, bottom: 10, zIndex: 90, background: "rgba(11,9,8,.94)", border: "1px solid rgba(255,181,46,.6)", borderRadius: 18, padding: 10, display: "grid", gap: 8 }}>
      {deschis && GRUPURI.map((g) => (
        <div key={g.cheie} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ font: "12px sans-serif", width: 74, color: "#a99d92" }}>{g.titlu}</span>
          {g.variante.map(([v, t]) => (
            <button key={v} type="button" style={buton((ales[g.cheie] ?? "") === v)} onClick={() => alege(g, v)}>{t}</button>
          ))}
        </div>
      ))}
      <button type="button" style={buton(false)} onClick={() => setDeschis((x) => !x)}>{deschis ? "închide" : "Variante"}</button>
    </div>
  );
}
