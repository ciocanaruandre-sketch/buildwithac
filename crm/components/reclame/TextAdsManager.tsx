"use client";

import { useState } from "react";
import { TEXT_META, TEXT_TIKTOK } from "@/lib/reclame";

const LINK = "https://buildwithac.ro/?serviciu=site#formular";

function Bloc({ titlu, unde, text }: { titlu: string; unde: React.ReactNode; text: string }) {
  const [copiat, setCopiat] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <b className="text-[13.5px] font-semibold">{titlu}</b>
      <p className="text-[12.5px] text-ink-3">{unde}</p>
      <div className="flex items-start gap-2">
        <pre className="min-w-0 flex-1 rounded-r bg-seg px-3 py-2 font-[family-name:var(--mono)] text-[12px] whitespace-pre-wrap text-ink-2 [overflow-wrap:anywhere]">{text}</pre>
        <button
          type="button"
          className="btn mic flex-none"
          aria-label={`Copiază: ${titlu}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopiat(true);
              setTimeout(() => setCopiat(false), 1500);
            } catch {
              setCopiat(false);
            }
          }}
        >
          {copiat ? "Copiat" : "Copiază"}
        </button>
      </div>
    </div>
  );
}

/** Ce lipește Andrei o singură dată în Ads Manager, ca lead-urile să-și găsească singure reclama. */
export function TextAdsManager({ deschis = false }: { deschis?: boolean }) {
  return (
    <details className="panel mt-4 p-4" open={deschis}>
      <summary className="cursor-pointer text-[14px] font-semibold">Ce lipesc în Ads Manager</summary>
      <div className="mt-3 flex flex-col gap-4">
        <Bloc
          titlu="Linkul reclamei"
          unde={
            <>
              Duce direct la formular, cu serviciul ales. În loc de <code>site</code> poți pune <code>automatizari</code>, <code>1la1</code> sau <code>altceva</code>.
            </>
          }
          text={LINK}
        />
        <Bloc
          titlu="Meta (Facebook și Instagram)"
          unde="În reclamă, la „Parametri URL” (URL parameters). Meta pune singură numele campaniei și al reclamei."
          text={TEXT_META}
        />
        <Bloc titlu="TikTok" unde="În reclamă, la „URL parameters”. TikTok pune singur numele campaniei și al reclamei." text={TEXT_TIKTOK} />
        <p className="text-[12.5px] text-ink-3">
          <code>utm_medium=reclama</code> e semnul după care CRM-ul știe că omul vine dintr-o reclamă. Linkurile din bio și din postări nu-l au.
        </p>
      </div>
    </details>
  );
}
