"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { bifeazaTask } from "@/app/(app)/clienti/[id]/actiuni-taskuri";
import { platesteTot } from "@/app/(app)/finante/actiuni";
import { iaLead } from "@/app/(app)/lead-uri/actiuni";
import type { OmAzi } from "@/components/azi/PaginaAzi";
import { Incaseaza } from "@/components/finante/Incaseaza";
import { useActiune } from "@/components/finante/useActiune";
import type { RandAzi } from "@/lib/azi";
import { linkTelefon, linkWhatsApp } from "@/lib/telefon";

/** Lead liber la un caller sau closer: întâi îl ia, apoi sună. Adminul sună direct. */
export const trebuieLuat = (r: RandAzi, om: OmAzi) => Boolean(r.lead && r.lead.caller_id === null && (om.rol === "caller" || om.rol === "closer"));

/** Butoanele unui rând din „Azi”, după tipul lui. `laApel` aduce lead-ul în „Acum”, cu butoanele de rezultat. */
export function ButoaneAzi({ rand: r, om, laApel, mare = false }: { rand: RandAzi; om: OmAzi; laApel: (cheie: string) => void; mare?: boolean }) {
  const router = useRouter();
  const { mesaj, setMesaj, lucreaza, fa } = useActiune();
  const [iaAcum, porneste] = useTransition();
  const cls = `btn ${mare ? "" : "mic"}`;
  const tel = r.telefonNorm;

  const deschide = (
    <Link href={r.href} className={cls}>
      Deschide
    </Link>
  );
  const whatsapp = tel && (
    <a className={cls} href={linkWhatsApp(tel)} target="_blank" rel="noreferrer" onClick={r.lead ? () => laApel(r.cheie) : undefined}>
      WhatsApp
    </a>
  );
  const eroare = mesaj && (
    <span role="alert" className="basis-full text-[12.5px] text-red-t">
      {mesaj}
    </span>
  );

  let butoane: React.ReactNode;
  switch (r.tip) {
    case "lead_nou":
    case "callback":
      butoane = trebuieLuat(r, om) ? (
        <button
          type="button"
          className={`${cls} pri`}
          disabled={iaAcum}
          onClick={() =>
            porneste(async () => {
              const rez = await iaLead(r.lead!.id);
              if (!rez.ok) {
                setMesaj(rez.mesaj);
                return router.refresh();
              }
              setMesaj(null);
              laApel(r.cheie);
              router.refresh();
              if (tel) window.location.href = linkTelefon(tel);
            })
          }
        >
          Ia lead-ul și sună
        </button>
      ) : (
        tel && (
          <>
            <a className={`${cls} pri`} href={linkTelefon(tel)} onClick={() => laApel(r.cheie)}>
              Sună
            </a>
            {whatsapp}
          </>
        )
      );
      break;
    case "task":
      butoane = (
        <button type="button" className={cls} disabled={lucreaza} onClick={() => fa(() => bifeazaTask(r.taskId!, true))}>
          ✓ Gata
        </button>
      );
      break;
    case "rata":
      butoane = (
        <>
          <Incaseaza transaId={r.transa!.id} suma={r.transa!.suma} eticheta="✓ Am încasat" />
          {whatsapp}
        </>
      );
      break;
    case "comision":
      butoane = r.comision!.poatePlati ? (
        <button type="button" className={cls} disabled={lucreaza} onClick={() => fa(() => platesteTot(r.comision!.omId))}>
          ✓ Plătit tot
        </button>
      ) : (
        deschide
      );
      break;
    case "livrare_fara_raspuns":
    case "vanzare":
      butoane = (
        <>
          {whatsapp}
          {deschide}
        </>
      );
      break;
    default:
      butoane = deschide;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {butoane}
      {eroare}
    </div>
  );
}
