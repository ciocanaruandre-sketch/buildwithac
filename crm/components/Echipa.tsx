"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { invita, mutaTot, retrimite, schimbaRol, seteazaActiv, type Rezultat } from "@/app/(app)/echipa/actiuni";
import { ROLURI_ECHIPA } from "@/lib/invitatie";
import { ETICHETE, type Rol } from "@/lib/tipuri";

type Raspuns = { ok: boolean; mesaj?: string; link?: string } | null;

function Mesaj({ r }: { r: Raspuns }) {
  if (!r?.mesaj) return null;
  return (
    <div role={r.ok ? "status" : "alert"} className={`text-[13px] ${r.ok ? "text-ink-2" : "text-red-t"}`}>
      {r.mesaj}
      {r.link && <input readOnly aria-label="Linkul de invitație" value={r.link} onFocus={(e) => e.target.select()} className="camp mt-1.5 font-mono !text-[12px]" />}
    </div>
  );
}

export function FormularInvitatie() {
  const router = useRouter();
  const [nume, setNume] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol | "">("");
  const [r, setR] = useState<Raspuns>(null);
  const [lucreaza, porneste] = useTransition();

  const trimite = (e: React.FormEvent) => {
    e.preventDefault();
    porneste(async () => {
      const x: Rezultat = rol ? await invita(email, nume, rol) : { ok: false, mesaj: "Alege rolul." };
      setR(x);
      if (x.ok) {
        setNume("");
        setEmail("");
        setRol("");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={trimite} className="panel flex flex-col gap-3 p-4">
      <p className="lbl">Invită un om</p>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="lbl">Nume</span>
          <input className="camp" value={nume} onChange={(e) => setNume(e.target.value)} placeholder="Mara Ionescu" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="lbl">E-mail</span>
          <input className="camp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="lbl">Rol</span>
          <select className="camp" value={rol} onChange={(e) => setRol(e.target.value as Rol | "")}>
            <option value="">Alege…</option>
            {ROLURI_ECHIPA.map((x) => (
              <option key={x} value={x}>{ETICHETE.rol[x]}</option>
            ))}
          </select>
        </label>
        <button className="btn pri justify-center" disabled={lucreaza}>{lucreaza ? "…" : "Trimite invitația"}</button>
      </div>
      <Mesaj r={r} />
    </form>
  );
}

type Om = { id: string; nume: string; rol: Rol };

/** Ce poate face Adminul cu un om: rolul, oprirea, linkul nou, mutarea lead-urilor. */
export function ActiuniOm({ om, activ, invitat, deschise, ceilalti }: { om: Om; activ: boolean; invitat: boolean; deschise: number; ceilalti: Om[] }) {
  const router = useRouter();
  const [r, setR] = useState<Raspuns>(null);
  const [sigur, setSigur] = useState(false);
  const [la, setLa] = useState("");
  const [lucreaza, porneste] = useTransition();
  const fa = (f: () => Promise<Raspuns>) =>
    porneste(async () => {
      const x = await f();
      setR(x);
      setSigur(false);
      router.refresh();
    });
  // lead-urile trec la cineva cu același rol sau la Admin (ca în muta_lead_uri)
  const potPrimi = ceilalti.filter((c) => c.rol === om.rol || c.rol === "admin");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="camp !w-auto !py-1.5 !text-[13px]"
          aria-label={`Rolul lui ${om.nume}`}
          value={om.rol}
          disabled={lucreaza}
          onChange={(e) => fa(() => schimbaRol(om.id, e.target.value as Rol))}
        >
          {ROLURI_ECHIPA.map((x) => (
            <option key={x} value={x}>{ETICHETE.rol[x]}</option>
          ))}
        </select>
        {invitat && activ && (
          <button type="button" className="btn" disabled={lucreaza} onClick={() => fa(() => retrimite(om.id))}>
            Link nou
          </button>
        )}
        {activ && !sigur && (
          <button type="button" className="btn" disabled={lucreaza} onClick={() => setSigur(true)}>
            Oprește contul
          </button>
        )}
        {activ && sigur && (
          <>
            <button type="button" className="btn pericol" disabled={lucreaza} onClick={() => fa(() => seteazaActiv(om.id, false))}>
              Da, oprește-l
            </button>
            <button type="button" className="btn" onClick={() => setSigur(false)}>
              Nu
            </button>
          </>
        )}
        {!activ && (
          <button type="button" className="btn" disabled={lucreaza} onClick={() => fa(() => seteazaActiv(om.id, true))}>
            Pornește contul
          </button>
        )}
      </div>
      {!activ && deschise > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select className="camp !w-auto !py-1.5 !text-[13px]" aria-label="Mută tot la" value={la} onChange={(e) => setLa(e.target.value)}>
            <option value="">Mută tot la…</option>
            {potPrimi.map((c) => (
              <option key={c.id} value={c.id}>{c.nume}</option>
            ))}
          </select>
          <button type="button" className="btn pri" disabled={lucreaza || !la} onClick={() => fa(() => mutaTot(om.id, la))}>
            Mută
          </button>
        </div>
      )}
      <Mesaj r={r} />
    </div>
  );
}
