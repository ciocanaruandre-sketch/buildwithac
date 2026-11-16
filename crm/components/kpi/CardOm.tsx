import Link from "next/link";
import { initiale } from "@/lib/afisare";
import { ETICHETE, type Rol } from "@/lib/tipuri";

export type Mini = { eticheta: string; valoare: React.ReactNode; nota?: React.ReactNode };

/** Cardul unui om: câteva cifre ale rolului lui. Cu `href`, clicul îi deschide (sau închide) panoul. */
export function CardOm({ nume, rol, mini, href, ales = false }: { nume: string; rol: Rol; mini: Mini[]; href?: string; ales?: boolean }) {
  const corp = (
    <>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-bg-3 text-[12px] font-semibold text-ink-2">{initiale(nume)}</span>
        <div className="min-w-0">
          <b className="block truncate text-[14px] font-semibold">{nume}</b>
          <small className="text-[11.5px] text-ink-3">{ETICHETE.rol[rol]}</small>
        </div>
      </div>
      {mini.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {mini.map((m) => (
            <div key={m.eticheta} className="text-[11.5px] text-ink-3">
              {m.eticheta}
              <b className="num block text-[17px] font-semibold text-ink">{m.valoare}</b>
              {m.nota}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12.5px] text-ink-3">Nimic în perioada asta.</p>
      )}
    </>
  );
  const cls = `panel block p-3.5 ${ales ? "!border-amber/60" : ""}`;
  return href ? (
    <Link href={href} scroll={false} className={`${cls} hover:border-line-2`} aria-current={ales ? "true" : undefined} data-testid="card-om">
      {corp}
    </Link>
  ) : (
    <div className={cls} data-testid="card-om">
      {corp}
    </div>
  );
}
