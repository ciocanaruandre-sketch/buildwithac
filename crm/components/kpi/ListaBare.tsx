/** Rânduri cu o bară proporțională (motivele, sursele). Gol: „Nimic în perioada asta.” */
export function ListaBare({ randuri }: { randuri: { eticheta: string; nr: number; nota?: string }[] }) {
  if (!randuri.length) return <p className="text-[12.5px] text-ink-3">Nimic în perioada asta.</p>;
  const max = Math.max(1, ...randuri.map((r) => r.nr));
  return (
    <div className="flex flex-col gap-2">
      {randuri.map((r) => (
        <div key={r.eticheta} className="grid grid-cols-[1fr_80px_30px] items-center gap-2.5 text-[12.5px] sm:grid-cols-[1fr_110px_34px]">
          <span className="min-w-0">
            {r.eticheta}
            {r.nota && <small className="text-ink-3"> · {r.nota}</small>}
          </span>
          <div className="h-2 rounded-r bg-amber opacity-80" style={{ width: `${(r.nr / max) * 100}%` }} />
          <b className="num text-right font-semibold">{r.nr}</b>
        </div>
      ))}
    </div>
  );
}
