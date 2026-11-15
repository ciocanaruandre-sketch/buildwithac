import { initiale } from "@/lib/afisare";
import { ETICHETE, type Rol } from "@/lib/tipuri";

/** Tabelul pe oameni de sub o secțiune, cu rândul „Toată echipa” la final. Pe telefon derulează în cutia lui. */
export function TabelOameni({
  coloane,
  randuri,
  total,
}: {
  coloane: string[];
  randuri: { id: string; nume: string; rol: Rol; celule: React.ReactNode[] }[];
  total: React.ReactNode[] | null;
}) {
  const td = "border-b border-line px-2 py-2.5 text-right whitespace-nowrap num";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {coloane.map((c, i) => (
              <th key={c} className={`border-b border-line px-2 py-1.5 text-[11.5px] font-medium whitespace-nowrap text-ink-3 ${i ? "text-right" : "text-left"}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {randuri.map((r) => (
            <tr key={r.id}>
              <td className="border-b border-line px-2 py-2.5 whitespace-nowrap">
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-bg-3 text-[10.5px] font-semibold text-ink-2">{initiale(r.nume)}</span>
                  {r.nume} <small className="text-[11px] text-ink-3">{ETICHETE.rol[r.rol]}</small>
                </span>
              </td>
              {r.celule.map((c, i) => (
                <td key={i} className={td}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {total && (
            <tr className="font-semibold">
              <td className="border-t border-line-2 px-2 py-2.5 whitespace-nowrap">Toată echipa</td>
              {total.map((c, i) => (
                <td key={i} className="num border-t border-line-2 px-2 py-2.5 text-right whitespace-nowrap">
                  {c}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
