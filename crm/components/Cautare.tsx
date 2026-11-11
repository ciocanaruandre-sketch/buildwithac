"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Iconita } from "@/components/Iconite";

const nimic = () => () => {};
const eMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

/** Căsuța din bara de sus: caută lead-uri după nume, cuvinte sau telefon. Pe telefon, doar lupa, până o apeși. */
export function Cautare() {
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
        className={`btn h-9 w-9 !p-0 md:hidden ${deschis ? "!hidden" : ""}`}
        onClick={() => setDeschis(true)}
      >
        <Iconita nume="cauta" className="h-4 w-4" />
      </button>
      <form
        role="search"
        action="/lead-uri"
        className={`${deschis ? "flex" : "hidden"} order-last w-full items-center gap-2 rounded-full bg-seg px-3.5 py-2 text-ink-3 focus-within:shadow-[0_0_0_1px_var(--amber)] md:order-none md:flex md:w-[300px] lg:w-[300px]`}
      >
        <Iconita nume="cauta" className="h-[15px] w-[15px] flex-none" />
        <input
          ref={camp}
          name="q"
          type="search"
          aria-label="Caută lead-uri"
          placeholder="Caută după nume sau telefon"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
          onBlur={(e) => {
            if (!e.currentTarget.value) setDeschis(false);
          }}
        />
        <kbd className="hidden flex-none rounded-[6px] bg-[var(--btn)] px-1.5 py-px text-[11px] font-medium text-ink-3 lg:block">{mac ? "⌘K" : "Ctrl K"}</kbd>
      </form>
    </>
  );
}
