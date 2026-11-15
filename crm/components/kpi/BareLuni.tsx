/** Ultimele luni, ca bare; luna curentă e mai aprinsă și are cifra deasupra. */
export function BareLuni({ luni }: { luni: { eticheta: string; valoare: number; text: React.ReactNode }[] }) {
  const max = Math.max(1, ...luni.map((l) => l.valoare));
  return (
    <div className="flex h-[124px] items-end gap-2 pt-5">
      {luni.map((l, i) => {
        const acum = i === luni.length - 1;
        return (
          <div key={l.eticheta} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className={`relative w-full max-w-[34px] rounded-t bg-amber ${acum ? "" : "opacity-55"}`}
              style={{ height: `${Math.max(3, (l.valoare / max) * 90)}px` }}
              title={`${l.eticheta}`}
            >
              {acum && <em className="num absolute -top-4 left-1/2 -translate-x-1/2 text-[10.5px] font-semibold whitespace-nowrap text-ink-2 not-italic">{l.text}</em>}
            </div>
            <span className="text-[11px] text-ink-3">{l.eticheta}</span>
          </div>
        );
      })}
    </div>
  );
}
