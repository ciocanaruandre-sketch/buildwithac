"use client";

import { useState, useTransition } from "react";
import { deconecteazaGoogle } from "@/app/(app)/program/actiuni";
import { Ascuns } from "@/components/Ascuns";
import { textNesterse } from "@/lib/calendar/texte";

export type StareGoogle = "neconectat" | "ok" | "cazut";

const MESAJE = {
  ok: "Gata, calendarul e conectat.",
  anulat: "N-ai dat acces. Calendarul nu e conectat.",
  eroare: "Conectarea n-a mers. Încearcă din nou.",
  fara_drepturi: "N-ai bifat accesul la calendar. Conectează din nou și bifează tot pe ecranul Google.",
} as const;

const Icon = () => (
  <div className="grid size-10 flex-none place-items-center rounded-[10px] bg-white" aria-hidden>
    <span className="text-[13px] font-bold text-[#1a73e8]">31</span>
  </div>
);

/** Cardul Google Calendar de pe „Program”: conectarea omului. Adminul, pe programul altcuiva, vede doar starea. */
export function CardGoogle({
  stare,
  email,
  alCuiNume,
  mesaj,
}: {
  stare: StareGoogle;
  email: string | null;
  alCuiNume: string | null;
  mesaj: keyof typeof MESAJE | null;
}) {
  const [sigur, setSigur] = useState(false);
  const [rezultat, setRezultat] = useState<string | null>(null);
  const [lucreaza, porneste] = useTransition();

  if (alCuiNume) {
    return (
      <div className="mb-4">
        <span className={`chip ${stare === "ok" ? "green" : stare === "cazut" ? "red" : ""}`}>
          {stare === "ok" ? "✓ Google Calendar conectat" : stare === "cazut" ? "Google Calendar: legătura a căzut" : `${alCuiNume} n-a conectat Google Calendar`}
        </span>
      </div>
    );
  }

  const deconecteaza = () =>
    porneste(async () => {
      const r = await deconecteazaGoogle();
      setSigur(false);
      if (!r.ok) return setRezultat(r.mesaj);
      setRezultat(r.nesterse ? textNesterse(r.nesterse) : null);
    });

  return (
    <>
      {mesaj && !rezultat && (
        <p role="status" className={`mb-2 text-[13px] ${mesaj === "ok" ? "text-green" : "text-ink-2"}`}>{MESAJE[mesaj]}</p>
      )}
      {rezultat && <p role="alert" className="mb-2 alerta px-3 py-2 text-[13px] text-ink-2">{rezultat}</p>}
      <div className="panel mb-4 flex flex-wrap items-center gap-3.5 px-[18px] py-4" data-testid="card-google">
        <Icon />
        <div className="min-w-[220px] flex-1">
          {stare === "ok" ? (
            <>
              <b className="mb-0.5 block font-semibold">
                Google Calendar · conectat <span className="chip green ml-1.5">✓</span>
              </b>
              <p className="text-[13px] text-ink-2">
                <Ascuns>{email}</Ascuns> · discuțiile tale intră acolo singure, iar orele ocupate de acolo apar gri la „Programează”.
              </p>
            </>
          ) : stare === "cazut" ? (
            <>
              <b className="mb-0.5 block font-semibold">
                Google Calendar · legătura a căzut <span className="chip red ml-1.5">!</span>
              </b>
              <p className="text-[13px] text-ink-2">
                Google nu mai primește discuțiile tale (se întâmplă după schimbarea parolei). Conectează-l din nou; discuțiile programate între timp intră singure.
              </p>
            </>
          ) : (
            <>
              <b className="mb-0.5 block font-semibold">Google Calendar</b>
              <p className="text-[13px] text-ink-2">
                Conectează-l ca discuțiile programate să-ți apară în calendar, cu memento pe telefon, iar orele în care ești ocupat să nu mai poată fi alese.
              </p>
            </>
          )}
        </div>
        {stare === "ok" ? (
          sigur ? (
            <div className="flex basis-full flex-wrap items-center gap-2">
              <p className="text-[13px] text-ink-2">Scot din Google Calendar toate discuțiile puse de CRM și opresc legătura. Continui?</p>
              <button type="button" className="btn mic pericol" disabled={lucreaza} onClick={deconecteaza}>
                {lucreaza ? "…" : "Da, deconectează"}
              </button>
              <button type="button" className="btn mic" disabled={lucreaza} onClick={() => setSigur(false)}>Renunță</button>
            </div>
          ) : (
            <button type="button" className="btn mic" onClick={() => setSigur(true)}>Deconectează</button>
          )
        ) : (
          // link simplu: ruta face redirecționarea spre Google (nu e o navigare din aplicație)
          <a className="btn pri" href="/api/google/conectare">
            {stare === "cazut" ? "Conectează din nou" : "Conectează Google Calendar"}
          </a>
        )}
      </div>
    </>
  );
}
