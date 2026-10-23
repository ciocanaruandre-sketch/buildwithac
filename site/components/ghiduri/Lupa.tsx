"use client";

/** Lupa de căutare. Pe /ghiduri filtrează pe loc (onSchimba); pe 404 trimite la /ghiduri?q=… (onTrimite). */
export function Lupa({ valoare, onSchimba, onTrimite }: { valoare: string; onSchimba: (q: string) => void; onTrimite?: (q: string) => void }) {
  return (
    // action + name: și înainte ca pagina să fie gata, Enter duce la /ghiduri?q=…
    <form className="search" role="search" action="/ghiduri" onSubmit={(e) => { e.preventDefault(); onTrimite?.(String(new FormData(e.currentTarget).get("q") ?? "")); }}>
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
      <input
        type="search"
        name="q"
        aria-label="Caută un ghid"
        placeholder="Caută după titlu, unealtă sau cuvântul din clip"
        value={valoare}
        onChange={(e) => onSchimba(e.target.value)}
        enterKeyHint="search"
      />
      {valoare && <button type="button" className="clr" aria-label="Șterge căutarea" onClick={() => onSchimba("")}>✕</button>}
    </form>
  );
}
