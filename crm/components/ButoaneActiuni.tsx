"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { aplicaActiune } from "@/app/(app)/lead-uri/[id]/actiuni";
import type { Actiune } from "@/lib/stari";
import { ETICHETE_CALLBACK, laOraRomaniei, scurtaturaCallback, type ScurtaturaCallback } from "@/lib/timp";

const ETICHETA: Record<Exclude<Actiune, "ia_lead">, string> = {
  nu_raspunde: "Nu răspunde",
  a_raspuns: "A răspuns",
  callback: "Callback",
  programeaza: "Programează discuția",
  oferta_trimisa: "Ofertă trimisă",
  client: "Client",
  pierdut: "Pierdut",
  descalificat: "Descalificat",
};
type Deschis = null | "callback" | "pierdut" | "descalificat";

/** Butoanele mari din fișă: doar cele permise. Callback-ul și motivele se deschid sub butoane. */
export function ButoaneActiuni({ id, actiuni }: { id: string; actiuni: Actiune[] }) {
  const router = useRouter();
  const [deschis, setDeschis] = useState<Deschis>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [motiv, setMotiv] = useState("");
  const [zi, setZi] = useState("");
  const [ora, setOra] = useState("10:00");
  const [lucreaza, porneste] = useTransition();

  const fa = (a: Exclude<Actiune, "ia_lead" | "programeaza">, extra?: { callbackLa?: string; motiv?: string }) =>
    porneste(async () => {
      const r = await aplicaActiune(id, a, extra);
      if (!r.ok) return setMesaj(r.mesaj);
      setMesaj(null);
      setDeschis(null);
      setMotiv("");
      router.refresh();
    });

  const butoane = actiuni.filter((a): a is Exclude<Actiune, "ia_lead"> => a !== "ia_lead");
  if (!butoane.length) return null;

  return (
    <div className="panel p-3.5">
      <div className="flex flex-wrap gap-2">
        {butoane.map((a) =>
          a === "programeaza" ? (
            <Link key={a} href={`/lead-uri/${id}/programeaza`} className="btn pri">
              {ETICHETA[a]}
            </Link>
          ) : (
            <button
              key={a}
              type="button"
              className={`btn ${deschis === a ? "!border-amber" : ""}`}
              disabled={lucreaza}
              onClick={() => {
                setMesaj(null);
                if (a === "callback" || a === "pierdut" || a === "descalificat") setDeschis(deschis === a ? null : a);
                else fa(a);
              }}
            >
              {ETICHETA[a]}
            </button>
          ),
        )}
      </div>

      {deschis === "callback" && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
          {(Object.keys(ETICHETE_CALLBACK) as ScurtaturaCallback[]).map((s) => (
            <button key={s} type="button" className="btn" disabled={lucreaza} onClick={() => fa("callback", { callbackLa: scurtaturaCallback(s, new Date()).toISOString() })}>
              {ETICHETE_CALLBACK[s]}
            </button>
          ))}
          <span className="flex items-end gap-1.5">
            <label className="flex flex-col gap-1">
              <span className="lbl">Altă dată</span>
              <input type="date" className="camp !w-auto" value={zi} onChange={(e) => setZi(e.target.value)} />
            </label>
            <input type="time" className="camp !w-auto" value={ora} onChange={(e) => setOra(e.target.value)} aria-label="Ora" />
            <button type="button" className="btn" disabled={lucreaza || !zi} onClick={() => fa("callback", { callbackLa: laOraRomaniei(zi, ora).toISOString() })}>
              Setează
            </button>
          </span>
        </div>
      )}

      {(deschis === "pierdut" || deschis === "descalificat") && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
          <label className="flex min-w-60 flex-1 flex-col gap-1">
            <span className="lbl">Motivul</span>
            <input className="camp" value={motiv} onChange={(e) => setMotiv(e.target.value)} placeholder={deschis === "pierdut" ? "A ales pe altcineva, buget…" : "Număr greșit, nu e interesat…"} />
          </label>
          <button type="button" className="btn pri" disabled={lucreaza} onClick={() => fa(deschis, { motiv })}>
            Confirmă
          </button>
        </div>
      )}

      {mesaj && (
        <p role="alert" className="mt-2 text-[13px] text-red-t">
          {mesaj}
        </p>
      )}
    </div>
  );
}
