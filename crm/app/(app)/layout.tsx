import { iesi } from "@/app/(cont)/actiuni";
import { Navigare, type Legatura } from "@/components/Navigare";
import { eu } from "@/lib/eu";
import { ETICHETE, type Rol } from "@/lib/tipuri";

function legaturiPentru(rol: Rol): Legatura[] {
  if (rol === "constructor") return [{ href: "/clienti", eticheta: "Clienți" }];
  const l: Legatura[] = [
    { href: "/lead-uri", eticheta: "Lead-uri" },
    { href: "/clienti", eticheta: "Clienți" },
  ];
  if (rol === "closer" || rol === "admin") l.push({ href: "/program", eticheta: "Program" });
  if (rol === "admin") l.push({ href: "/echipa", eticheta: "Echipa" });
  return l;
}

const initiale = (nume: string) =>
  nume
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export default async function LayoutAplicatie({ children }: { children: React.ReactNode }) {
  const om = await eu();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[216px_1fr]">
      <aside className="flex flex-col gap-0.5 border-line bg-bg-side px-3 py-[18px] md:sticky md:top-0 md:h-screen md:border-r">
        <div className="flex items-center gap-2.5 px-2 pt-1 pb-[18px]">
          <i className="block h-[22px] w-[22px] rounded-r" style={{ background: "var(--grad)" }} />
          <div>
            <b className="block font-label text-[15px] font-bold tracking-wide">buildwithac</b>
            <small className="lbl block">CRM</small>
          </div>
        </div>
        <Navigare legaturi={legaturiPentru(om.rol)} />
        <div className="mt-auto flex items-center gap-2.5 border-t border-line px-2 pt-2.5">
          <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-[#3b2a12] font-label text-[11px] font-semibold text-amber">{initiale(om.nume)}</span>
          <div className="min-w-0 flex-1">
            <b className="block truncate font-label text-[12px] font-semibold">{om.nume}</b>
            <span className="text-[11px] text-ink-3">{ETICHETE.rol[om.rol]}</span>
          </div>
          <form action={iesi}>
            <button className="font-label text-[11px] uppercase tracking-wider text-ink-3 hover:text-ink">Ieși</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-[22px] md:px-7">{children}</main>
    </div>
  );
}
