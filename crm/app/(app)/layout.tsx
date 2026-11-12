import { iesi } from "@/app/(cont)/actiuni";
import { ComutatorFilmare } from "@/components/ComutatorFilmare";
import { Iconita } from "@/components/Iconite";
import { aratComutatorFilmare } from "@/lib/filmare";
import { inFilmare } from "@/lib/filmare-server";
import { Navigare, type Legatura } from "@/components/Navigare";
import { initiale } from "@/lib/afisare";
import { eu } from "@/lib/eu";
import { ETICHETE, type Rol } from "@/lib/tipuri";

function legaturiPentru(rol: Rol): Legatura[] {
  const taskuri: Legatura = { href: "/taskuri", eticheta: "Task-urile mele", iconita: "taskuri" };
  const clienti: Legatura = { href: "/clienti", eticheta: "Clienți", iconita: "clienti" };
  const finante: Legatura = { href: "/finante", eticheta: "Finanțe", iconita: "finante" };
  if (rol === "constructor") return [clienti, taskuri, finante];
  const l: Legatura[] = [{ href: "/lead-uri", eticheta: "Lead-uri", iconita: "lead-uri" }, clienti];
  if (rol === "admin") l.push(taskuri);
  if (rol === "closer" || rol === "admin") l.push({ href: "/program", eticheta: "Program", iconita: "program" });
  l.push(finante);
  if (rol === "admin") l.push({ href: "/echipa", eticheta: "Echipa", iconita: "echipa" });
  return l;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <i className="block h-[26px] w-[26px] rounded-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]" style={{ background: "var(--grad)" }} />
      <div className="text-[15px] leading-tight font-semibold tracking-[-.01em]">
        buildwithac
        <small className="block text-[11.5px] font-medium tracking-normal text-ink-3">CRM</small>
      </div>
    </div>
  );
}

export default async function LayoutAplicatie({ children }: { children: React.ReactNode }) {
  const om = await eu();
  const legaturi = legaturiPentru(om.rol);
  // modul filmare: blurul vine din HTML-ul de pe server (fără clipire); comutatorul doar la Admin, doar pe baza de test
  const filmare = await inFilmare();
  const comutator = aratComutatorFilmare(om.rol, process.env.NEXT_PUBLIC_SUPABASE_URL) ? <ComutatorFilmare activ={filmare} /> : null;
  return (
    <div className="min-h-screen" data-filmare={filmare ? "" : undefined}>
      <aside className="sticla fixed top-3 bottom-3 left-3 z-20 hidden w-[236px] flex-col gap-0.5 rounded-xl2 px-2.5 pt-4 pb-2.5 md:flex">
        <div className="px-2.5 pt-0.5 pb-[18px]">
          <Logo />
        </div>
        <Navigare legaturi={legaturi} unde="laterala" />
        <div className="mt-auto flex items-center gap-2.5 rounded-r bg-sel p-2.5">
          <span
            className={`grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-semibold ${om.rol === "admin" ? "text-[var(--pe-auriu)]" : "bg-[var(--btn)] text-ink-2"}`}
            style={om.rol === "admin" ? { background: "var(--grad)" } : undefined}
          >
            {initiale(om.nume)}
          </span>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-[13px] font-semibold">{om.nume}</b>
            <span className="text-[12px] text-ink-3">{ETICHETE.rol[om.rol]}</span>
          </div>
          {comutator}
          <form action={iesi}>
            <button aria-label="Ieși" title="Ieși" className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-[var(--btn)] hover:text-ink">
              <Iconita nume="iesi" className="h-[17px] w-[17px]" />
            </button>
          </form>
        </div>
      </aside>

      <header className="flex items-center justify-between px-4 pt-4 pb-1 md:hidden">
        <Logo />
        <div className="flex items-center gap-1.5">
          {comutator}
          <form action={iesi}>
            <button className="btn mic">Ieși</button>
          </form>
        </div>
      </header>

      <div className="md:pl-[256px]">
        <main className="mx-auto min-w-0 max-w-[1160px] px-4 pt-2 pb-[calc(84px+env(safe-area-inset-bottom))] md:px-6 md:pt-3 md:pb-10">
          {children}
        </main>
      </div>

      <Navigare legaturi={legaturi} unde="jos" />
    </div>
  );
}
