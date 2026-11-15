"use client";

import { marcheazaNeprezentat } from "@/app/(app)/lead-uri/[id]/actiuni";
import { useActiune } from "@/components/finante/useActiune";

/** Ultima discuție începută a lead-ului, cu „N-a venit” (sau anularea lui). O văd doar closerul ei și Adminul. */
export function DiscutiaAvuta({ id, text, neprezentat }: { id: string; text: string; neprezentat: boolean }) {
  const { mesaj, lucreaza, fa } = useActiune();
  return (
    <div className="panel px-4 py-3.5" data-testid="discutia-avuta">
      <p className="lbl">Discuția</p>
      <p className="mt-1.5 text-[14px] leading-snug">
        {text}
        {neprezentat && <span className="chip red ml-2 align-middle">N-a venit</span>}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="button" className="btn mic" disabled={lucreaza} onClick={() => fa(() => marcheazaNeprezentat(id, !neprezentat))}>
          {neprezentat ? "Anulează «N-a venit»" : "N-a venit"}
        </button>
      </div>
      {mesaj && (
        <p role="alert" className="mt-2 text-[13px] text-red-t">
          {mesaj}
        </p>
      )}
    </div>
  );
}
