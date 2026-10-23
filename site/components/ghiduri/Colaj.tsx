"use client";

import { useEffect, useState } from "react";
import type { GhidCard } from "@/lib/ghiduri";
import { cauta } from "@/lib/cautare";
import { SITE } from "@/lib/config";
import { Lupa } from "./Lupa";
import { CardGhid } from "./CardGhid";

export function Colaj({ ghiduri }: { ghiduri: GhidCard[] }) {
  const [q, setQ] = useState("");

  // ?q= din adresă completează lupa (ex. un link trimis pe Instagram);
  // pe un telefon lent omul poate scrie înainte ca pagina să fie gata, așa că păstrăm și ce e deja în câmp
  useEffect(() => {
    const scris = document.querySelector<HTMLInputElement>(".search input")?.value;
    const din = scris || new URLSearchParams(location.search).get("q");
    if (din) schimba(din);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schimba = (val: string) => {
    setQ(val);
    const url = new URL(location.href);
    if (val.trim()) url.searchParams.set("q", val); else url.searchParams.delete("q");
    history.replaceState(history.state, "", url);
  };

  const rezultate = cauta(ghiduri, q);
  const faraCautare = !q.trim();

  return (
    <>
      <header className="top">
        <div className="eb">Biblioteca de ghiduri</div>
        <h1>Toate ghidurile, <span className="serif gtxt">pas cu pas.</span></h1>
        <p className="sub">Ai văzut un clip și vrei ghidul? Caută cuvântul de pe ultima slide sau numele unei unelte.</p>
        <Lupa valoare={q} onSchimba={schimba} />
        <div className="quick">
          <span className="hand hint">din clipuri:</span>
          {ghiduri.slice(0, 8).map((g) => (
            <button type="button" key={g.slug} className="kw" onClick={() => schimba(g.cuvant)}>{g.cuvant}</button>
          ))}
        </div>
      </header>
      <div className="wrap">
        <p className="count" aria-live="polite">
          {faraCautare ? <><b>{ghiduri.length}</b> ghiduri gratuite</> : <><b>{rezultate.length}</b> {rezultate.length === 1 ? "rezultat" : "rezultate"} pentru „{q.trim()}”</>}
        </p>
        {rezultate.length ? (
          <div className="colaj">
            {rezultate.map(({ ghid, exact }, i) => (
              <CardGhid key={ghid.slug} ghid={ghid} mare={faraCautare && i === 0} exact={exact} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="hand" style={{ fontSize: 28 }}>hmm…</div>
            <h3>Nu găsesc ghidul ăsta.</h3>
            <p>Poate încă nu l-am scris. Scrie-mi pe Instagram ce ghid cauți și îl pun pe listă.</p>
            <a href={SITE.instagram.url} target="_blank" rel="noopener">Scrie-mi pe Instagram ↗</a>
          </div>
        )}
      </div>
    </>
  );
}
