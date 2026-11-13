"use client";

import { useState } from "react";
import { seteazaCheltuit } from "@/app/(app)/reclame/actiuni";
import { useActiune } from "@/components/finante/useActiune";
import { lei } from "@/lib/proiecte";

/** Suma cheltuită, scrisă pe loc: apeși pe ea (sau pe „scrie suma”), scrii și dai Enter. Gol = nescrisă. */
export function Cheltuit({ id, suma, nume }: { id: string; suma: number | null; nume: string }) {
  const [scrie, setScrie] = useState(false);
  const [text, setText] = useState("");
  const { mesaj, setMesaj, lucreaza, fa } = useActiune();

  if (!scrie) {
    return (
      <button
        type="button"
        aria-label={`Cheltuit pe ${nume}`}
        className={`num inline-flex items-center rounded-[9px] border border-dashed px-2 py-1 text-[14px] font-semibold whitespace-nowrap ${
          suma === null ? "border-[color-mix(in_srgb,var(--amber)_45%,transparent)] text-amber" : "border-transparent bg-seg hover:border-line-2"
        }`}
        onClick={() => {
          setText(suma === null ? "" : String(suma));
          setScrie(true);
        }}
      >
        {suma === null ? "scrie suma" : lei(suma)}
      </button>
    );
  }

  const salveaza = () => fa(() => seteazaCheltuit(id, text), () => setScrie(false));
  return (
    <div className="flex flex-col gap-1">
      <input
        className="camp num w-[110px] py-1"
        inputMode="numeric"
        aria-label={`Cheltuit pe ${nume} (lei)`}
        placeholder="lei"
        autoFocus
        value={text}
        disabled={lucreaza}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") salveaza();
          if (e.key === "Escape") {
            setScrie(false);
            setMesaj(null);
          }
        }}
        onBlur={() => {
          if (!lucreaza) salveaza();
        }}
      />
      {mesaj && (
        <p role="alert" className="text-[12px] text-red-t">
          {mesaj}
        </p>
      )}
    </div>
  );
}
