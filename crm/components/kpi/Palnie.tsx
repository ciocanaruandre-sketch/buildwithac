import { rata } from "@/lib/kpi";

/** „De la lead la client”: treptele, cu bara fiecăreia față de prima și cât merg mai departe. */
export function Palnie({ pasi }: { pasi: { eticheta: string; nr: number }[] }) {
  const prima = pasi[0]?.nr ?? 0;
  return (
    <div className="flex flex-col gap-1.5">
      {pasi.map((p, i) => {
        const mai = i > 0 ? rata(p.nr, pasi[i - 1].nr) : null;
        return (
          <div key={p.eticheta}>
            {i > 0 && (
              <p className="ml-[112px] text-[11px] whitespace-nowrap text-ink-3 sm:ml-[160px]">{mai === null ? "—" : `↓ ${mai}% merg mai departe`}</p>
            )}
            <div className="grid grid-cols-[104px_1fr_40px] items-center gap-2 sm:grid-cols-[150px_1fr_54px] sm:gap-2.5" title={`${p.eticheta}: ${p.nr}`}>
              <span className="text-[12.5px] font-medium text-ink-2">{p.eticheta}</span>
              <div
                className="h-[22px] min-w-[3px] rounded-r bg-amber"
                style={{ width: `${prima ? Math.max(1, (p.nr / prima) * 100) : 1}%`, opacity: 1 - i * 0.08 }}
              />
              <span className="num text-right text-[13px] font-semibold">{p.nr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
