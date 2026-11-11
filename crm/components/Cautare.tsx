"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Iconita } from "@/components/Iconite";

const nimic = () => () => {};
const eMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

/** Căsuța din bara de sus: caută lead-uri după nume, cuvinte sau telefon. Pe telefon, doar lupa, până o apeși.
 *  Pe lista de lead-uri păstrează filtrele alese (perioada, starea…) și arată ce cauți acum. */
export function Cautare() {
  const peLista = usePathname() === "/lead-uri";
  const parametri = useSearchParams();
  const qAcum = peLista ? (parametri.get("q") ?? "") : "";
  const filtre = peLista ? [...parametri.entries()].filter(([k, v]) => k !== "q" && k !== "pagina" && v) : [];
  // pe telefon, căsuța acoperă bara de sus: o deschide doar lupa (punctul auriu arată că e o căutare activă)
  const [deschis, setDeschis] = useState(false);
  const camp = useRef<HTMLInputElement>(null);
  const mac = useSyncExternalStore(nimic, eMac, () => false);

  useEffect(() => {
    const tasta = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setDeschis(true);
        camp.current?.focus();
      }
    };
    window.addEventListener("keydown", tasta);
    return () => window.removeEventListener("keydown", tasta);
  }, []);

  useEffect(() => {
    if (deschis) camp.current?.focus();
  }, [deschis]);

  return (
    <>
      <button
        type="button"
        aria-label="Caută lead-uri"
        aria-expanded={deschis}
        className={`btn relative h-9 w-9 !p-0 md:hidden ${deschis ? "!hidden" : ""}`}
        onClick={() => setDeschis(true)}
      >
        <Iconita nume="cauta" className="h-4 w-4" />
        {qAcum && <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber" />}
      </button>
      <form
        role="search"
        action="/lead-uri"
        className={`${deschis ? "flex" : "hidden"} items-center gap-2 rounded-full px-3.5 py-2 text-ink-3 focus-within:shadow-[0_0_0_1px_var(--amber)] max-md:absolute max-md:inset-[5px] max-md:z-10 max-md:bg-bg-3 md:flex md:w-[300px] md:bg-seg`}
      >
        <Iconita nume="cauta" className="h-[15px] w-[15px] flex-none" />
        {filtre.map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input
          key={qAcum}
          ref={camp}
          defaultValue={qAcum}
          name="q"
          type="search"
          aria-label="Caută lead-uri"
          placeholder="Caută după nume sau telefon"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-3 md:text-[13px]"
          onBlur={(e) => {
            if (!e.currentTarget.value) setDeschis(false);
          }}
        />
        <button
          type="button"
          aria-label="Închide căutarea"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[18px] leading-none text-ink-3 hover:text-ink md:hidden"
          onClick={() => setDeschis(false)}
        >
          ×
        </button>
        <kbd className="hidden flex-none rounded-[6px] bg-[var(--btn)] px-1.5 py-px text-[11px] font-medium text-ink-3 lg:block">{mac ? "⌘K" : "Ctrl K"}</kbd>
      </form>
    </>
  );
}
