"use client";

import Link from "next/link";
import { useState } from "react";
import type { StareAbonare } from "@/lib/kit";
import { useHidratat } from "@/lib/hidratat";

const MESAJE: Record<StareAbonare, string> = {
  ok: "Gata! Verifică-ți e-mailul și confirmă abonarea.",
  invalid: "Adresa nu pare corectă. Verific-o o dată.",
  indisponibil: "Acum nu merge abonarea. Încearcă puțin mai târziu sau scrie-mi pe Instagram.",
};

export function FormularAbonare({ varianta }: { varianta: "colaj" | "card" }) {
  const [stare, setStare] = useState<StareAbonare | "trimite" | null>(null);
  // butonul merge abia după hidratare: altfel un click timpuriu ar reîncărca pagina fără să trimită adresa
  const hidratat = useHidratat();

  async function trimite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // citim din câmp, nu din stare: pe un telefon lent omul poate scrie înainte ca pagina să fie gata
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setStare("trimite");
    try {
      const r = await fetch("/api/abonare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const { stare } = (await r.json()) as { stare: StareAbonare };
      setStare(MESAJE[stare] ? stare : "indisponibil");
    } catch {
      setStare("indisponibil");
    }
  }

  return (
    <div className={`abonare abonare-${varianta}`}>
      <form onSubmit={trimite} noValidate>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="adresa ta de e-mail"
          aria-label="Adresa ta de e-mail"
        />
        <button type="submit" disabled={!hidratat || stare === "trimite"}>Mă abonez</button>
      </form>
      <p className={`mesaj${stare === "ok" ? " ok" : ""}`} role="status" aria-live="polite">
        {stare && stare !== "trimite" ? MESAJE[stare] : ""}
      </p>
      <p className="acord">
        Îți scriu când apare un ghid nou sau o noutate care contează. Te dezabonezi oricând. <Link href="/confidentialitate">Confidențialitate</Link>
      </p>
    </div>
  );
}
