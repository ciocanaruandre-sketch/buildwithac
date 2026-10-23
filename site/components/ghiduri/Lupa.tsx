"use client";

/** Lupa de căutare. Pe /ghiduri filtrează pe loc (onSchimba); pe 404 trimite la /ghiduri?q=… (onTrimite). */
export function Lupa({ valoare, onSchimba, onTrimite }: { valoare: string; onSchimba: (q: string) => void; onTrimite?: (q: string) => void }) {
  return (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); onTrimite?.(valoare); }}>
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
      <input
        type="search"
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
