import Image from "next/image";
import { Apare } from "@/components/Apare";
import { ButoaneContact } from "@/components/ButoaneContact";
import { FIRMA } from "@/lib/config";
import { CONTINUT } from "@/lib/continut";

/** Pagina de exemplu: arată doar că totul e legat. Aspectul fiecărui client vine din varianta aleasă. */
export default function Acasa() {
  return (
    <main className="mx-auto max-w-3xl px-4">
      <header className="pb-14 pt-16 sm:pt-24">
        <p className="text-sm text-secundar">{FIRMA.nume}</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-5xl">
          {CONTINUT.titlu}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-secundar">{CONTINUT.descriere}</p>
        <div className="mt-8">
          <ButoaneContact />
        </div>
      </header>

      {CONTINUT.poze.length > 0 && (
        <Apare className="grid gap-3 pb-14 sm:grid-cols-2">
          {CONTINUT.poze.map((p) => (
            <div key={p.fisier} className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image src={p.fisier} alt={p.alt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
            </div>
          ))}
        </Apare>
      )}

      <Apare className="border-t border-text/10 py-12">
        <h2 className="text-2xl font-semibold">Servicii</h2>
        <ul className="mt-6 divide-y divide-text/10">
          {CONTINUT.servicii.map((s) => (
            <li key={s.nume} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
              <div className="min-w-0">
                <p className="font-medium [overflow-wrap:anywhere]">{s.nume}</p>
                {s.descriere && <p className="mt-1 text-secundar">{s.descriere}</p>}
              </div>
              <p className="shrink-0 tabular-nums">{s.pret === null ? "la cerere" : `${s.pret} lei`}</p>
            </li>
          ))}
        </ul>
      </Apare>

      <Apare className="border-t border-text/10 py-12">
        <h2 className="text-2xl font-semibold">Program</h2>
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
          {CONTINUT.program.map((p) => (
            <div key={p.zile} className="contents">
              <dt className="text-secundar">{p.zile}</dt>
              <dd className="tabular-nums">{p.ore}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-secundar">{FIRMA.adresa}</p>
      </Apare>
    </main>
  );
}
