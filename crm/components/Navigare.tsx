"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Legatura = { href: string; eticheta: string };

/** Legăturile din bara laterală; cea activă are bara aurie din prototip. */
export function Navigare({ legaturi }: { legaturi: Legatura[] }) {
  const cale = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {legaturi.map((l) => {
        const activ = cale === l.href || cale.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={activ ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-r px-2.5 py-2 font-label text-[13px] font-medium uppercase tracking-[.03em] ${
              activ ? "bg-bg-3 text-ink shadow-[inset_2px_0_0_var(--amber)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-[1px] border ${activ ? "border-amber bg-amber" : "border-ink-3"}`} />
            {l.eticheta}
          </Link>
        );
      })}
    </nav>
  );
}
