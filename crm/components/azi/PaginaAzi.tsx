"use client";

import { useState } from "react";
import { Ascuns } from "@/components/Ascuns";
import { ButoaneActiuni } from "@/components/ButoaneActiuni";
import { ButoaneAzi } from "@/components/azi/ButoaneAzi";
import { ETICHETA_TIP, urmatorul, type Cifra, type Placa, type RandAzi, type Tema } from "@/lib/azi";
import { actiuniPermise } from "@/lib/stari";
import { lei } from "@/lib/proiecte";
import type { Rol } from "@/lib/tipuri";

/** Culoarea fiecărei teme: clasa .chip din tema.css și variabila CSS. */
const CULOARE: Record<Tema, { chip: string; v: string }> = {
  sunat: { chip: "amber", v: "var(--amber)" },
  discutii: { chip: "blue", v: "var(--blue)" },
  lucru: { chip: "violet", v: "var(--violet)" },
  bani: { chip: "green", v: "var(--green)" },
};
const VAR_CIFRA: Record<Cifra["culoare"], string> = { red: "var(--red-t)", amber: "var(--amber)", blue: "var(--blue)", violet: "var(--violet)", green: "var(--green)" };

export type OmAzi = { id: string; rol: Rol };

/** Numele, firma și descrierea unui rând; datele personale trec prin <Ascuns> (modul filmare). */
function Nume({ r }: { r: RandAzi }) {
  return r.numeAscuns ? <Ascuns>{r.nume}</Ascuns> : <>{r.nume}</>;
}
function Descriere({ r }: { r: RandAzi }) {
  return (
    <>
      {r.client && (
        <>
          <Ascuns>{r.client}</Ascuns>
          {r.descriere.length > 0 && " · "}
        </>
      )}
      {r.descriere.join(" · ")}
    </>
  );
}
const culoareCand = (r: RandAzi) => (r.urgenta === "intarziat" ? "text-red-t" : r.curand ? "text-amber" : "text-ink-3");

/** Pagina „Azi”: cifrele de sus, cardul „Acum”, plăcile temelor și lista temei alese. */
export function PaginaAzi({ randuri, placi, cifre, salut, zi, om }: { randuri: RandAzi[]; placi: Placa[]; cifre: Cifra[]; salut: string; zi: string; om: OmAzi }) {
  const [temaAleasa, setTema] = useState<Tema | null>(null);
  // „Acum”: rândul ales cu „Mai târziu” sau adus din listă cu „Sună”; altfel primul. Nu se salvează: la refresh, ordinea revine.
  const [acumCheie, setAcumCheie] = useState<string | null>(null);
  const [rezultat, setRezultat] = useState(false);
  const tema = placi.some((p) => p.tema === temaAleasa) ? temaAleasa! : (placi[0]?.tema ?? null);
  const acum = randuri.find((r) => r.cheie === acumCheie) ?? randuri[0] ?? null;
  const urm = acum ? urmatorul(randuri, acum.cheie) : null;
  const laApel = (cheie: string) => {
    setAcumCheie(cheie);
    setRezultat(true);
  };
  const poateRezultat = Boolean(acum?.lead && actiuniPermise(acum.lead, om.rol, om.id).some((a) => a !== "ia_lead"));
  const intarziateDupa = randuri.filter((r) => r.urgenta === "intarziat" && r !== acum).length;
  const lista = randuri.filter((r) => r.tema === tema);

  return (
    <div className="max-w-[1000px]">
      <h1 className="text-[26px] leading-tight sm:text-[30px]">{salut}</h1>
      <p className="mt-1 mb-4 text-[13.5px] text-ink-3">{zi} · ce ai de făcut azi</p>

      {cifre.length > 0 && (
        <div className="mb-[18px] flex flex-wrap gap-2">
          {cifre.map((c) => (
            <span key={c.text} className={`chip !px-3 !py-1.5 ${c.culoare === "red" ? "red" : ""}`}>
              {c.culoare !== "red" && <i aria-hidden className="block h-[7px] w-[7px] rounded-full" style={{ background: VAR_CIFRA[c.culoare] }} />}
              {c.text}
            </span>
          ))}
        </div>
      )}

      <section data-testid="acum" aria-label="Acum" className="panel relative mb-4 overflow-hidden px-5 py-[18px]">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: "var(--grad)" }} />
        {acum ? (
          <>
            <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-amber">
              Acum <span className={`chip ${CULOARE[acum.tema].chip}`}>{ETICHETA_TIP[acum.tip]}</span>
            </div>
            <div className="text-[21px] leading-tight font-bold tracking-[-.02em]">
              <Nume r={acum} />
            </div>
            <p className="mt-1 mb-3.5 text-[13px] text-ink-2">
              <Descriere r={acum} />
              {acum.suma !== null && (
                <>
                  {" · "}
                  <Ascuns>{lei(acum.suma)}</Ascuns>
                </>
              )}
              {" · "}
              <span className={culoareCand(acum)}>{acum.cand}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ButoaneAzi key={acum.cheie} rand={acum} om={om} laApel={laApel} mare />
              {urm && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setAcumCheie(urm);
                    setRezultat(false);
                  }}
                >
                  Mai târziu
                </button>
              )}
            </div>
            {acum.lead && !rezultat && poateRezultat && (
              <button type="button" className="mt-2.5 text-[12.5px] text-ink-3 hover:text-ink hover:underline" onClick={() => setRezultat(true)}>
                Treci rezultatul
              </button>
            )}
            {acum.lead && rezultat && (
              <div className="mt-3.5 border-t border-line pt-3.5">
                <ButoaneActiuni
                  key={acum.cheie}
                  id={acum.lead.id}
                  faraPanou
                  // după „Ia lead-ul” e deja al tău, chiar dacă pagina încă n-a venit înapoi
                  actiuni={actiuniPermise({ ...acum.lead, caller_id: acum.lead.caller_id ?? om.id }, om.rol, om.id)}
                  laSucces={() => {
                    setAcumCheie(null);
                    setRezultat(false);
                  }}
                />
              </div>
            )}
            {(intarziateDupa > 0 || placi.length > 0) && (
              <p className="mt-3.5 border-t border-line pt-3 text-[12.5px] text-ink-3">
                {intarziateDupa > 0 && <b className="font-semibold text-ink-2">Încă {intarziateDupa === 1 ? "1 întârziată" : `${intarziateDupa} întârziate`} după asta. </b>}
                Apasă pe o temă de mai jos ca să vezi tot.
              </p>
            )}
          </>
        ) : (
          <p className="text-[15px] font-semibold">Nimic urgent acum.</p>
        )}
      </section>

      {placi.length > 0 && (
        <div className="mb-3.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {placi.map((p) => {
            const ales = p.tema === tema;
            const c = CULOARE[p.tema].v;
            return (
              <button
                key={p.tema}
                type="button"
                aria-pressed={ales}
                aria-label={`${p.nume} ${p.total}`}
                onClick={() => setTema(p.tema)}
                className="panel px-3.5 py-3 text-left"
                style={ales ? { borderColor: `color-mix(in srgb, ${c} 55%, transparent)`, background: `color-mix(in srgb, ${c} 7%, var(--bg-2))` } : undefined}
              >
                <span className="flex items-center gap-[7px] text-[12.5px] font-medium text-ink-2">
                  <i aria-hidden className="block h-[7px] w-[7px] rounded-full" style={{ background: c }} />
                  {p.nume}
                </span>
                <b className="num mt-1 mb-px block text-[26px] font-bold tracking-[-.03em]">{p.total}</b>
                <small className={`text-[11.5px] ${p.intarziate ? "text-red-t" : "text-ink-3"}`}>{p.rezumat}</small>
              </button>
            );
          })}
        </div>
      )}

      {lista.length > 0 && (
        <ul className="panel" aria-label={placi.find((p) => p.tema === tema)?.nume}>
          {lista.map((r) => (
            <li key={r.cheie} data-testid="rand-azi" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line px-3.5 py-[11px] first:border-0 md:flex-nowrap">
              <span className={`chip flex-none ${CULOARE[r.tema].chip}`}>{ETICHETA_TIP[r.tip]}</span>
              <div className="min-w-0 flex-1 basis-[180px]">
                <div className="truncate text-[13.5px] font-medium">
                  <Nume r={r} />
                </div>
                <small className="block truncate text-[12px] text-ink-3">
                  <Descriere r={r} />
                </small>
              </div>
              {r.suma !== null && (
                <span className="num flex-none text-[13px] font-medium">
                  <Ascuns>{lei(r.suma)}</Ascuns>
                </span>
              )}
              <span className={`flex-none text-right text-[12px] font-medium whitespace-nowrap ${culoareCand(r)}`}>{r.cand}</span>
              <div className="flex-none max-md:basis-full">
                <ButoaneAzi rand={r} om={om} laApel={laApel} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
