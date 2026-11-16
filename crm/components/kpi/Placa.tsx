/** O cifră: eticheta, valoarea, săgeata față de perioada de dinainte și, uneori, o explicație. */
export type Comparatie = { text: string; bine: boolean | null } | null;

export function Sageata({ c, fataDe }: { c: Comparatie; fataDe?: string }) {
  if (!c) return null;
  return (
    <span className="text-[11.5px] font-medium text-ink-3">
      <b className={`font-semibold ${c.bine === true ? "text-green" : c.bine === false ? "text-red-t" : ""}`}>{c.text}</b>
      {fataDe && ` ${fataDe}`}
    </span>
  );
}

export function Placa({
  eticheta,
  valoare,
  unitate,
  comparatie,
  fataDe,
  explicatie,
  mare = false,
}: {
  eticheta: string;
  valoare: React.ReactNode;
  unitate?: string;
  comparatie?: Comparatie;
  fataDe?: string;
  explicatie?: React.ReactNode;
  mare?: boolean;
}) {
  return (
    <div className="panel min-w-0 px-3.5 py-3">
      <p className="text-[12px] font-medium text-ink-3">{eticheta}</p>
      <p className={`num mt-0.5 mb-0.5 leading-tight font-semibold tracking-[-.02em] ${mare ? "text-[22px] sm:text-[28px]" : "text-[20px] sm:text-[23px]"}`}>
        {valoare}
        {unitate && <small className="ml-0.5 text-[13px] font-semibold text-ink-3">{unitate}</small>}
      </p>
      <Sageata c={comparatie ?? null} fataDe={fataDe} />
      {explicatie && <p className="mt-1 text-[11.5px] leading-snug text-ink-3">{explicatie}</p>}
    </div>
  );
}

/** Plăcile, câte două pe rând pe telefon, apoi cât încap. */
export function Placi({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <div data-testid={testId} className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]">
      {children}
    </div>
  );
}

/** Un panou cu titlu mic și o propoziție despre ce arată. */
export function Panou({ titlu, ce, children, testId }: { titlu?: string; ce?: string; children: React.ReactNode; testId?: string }) {
  return (
    <section data-testid={testId} className="panel min-w-0 p-4">
      {titlu && <h3 className="text-[14.5px] font-semibold">{titlu}</h3>}
      {ce && <p className="mt-0.5 mb-3 text-[12px] text-ink-3">{ce}</p>}
      {children}
    </section>
  );
}
