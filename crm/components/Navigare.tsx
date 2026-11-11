"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Iconita, type NumeIconita } from "@/components/Iconite";

export type Legatura = { href: string; eticheta: string; iconita: NumeIconita };

/** Pe telefon, eticheta scurtă de sub iconiță; numele accesibil rămâne cel lung. */
const SCURT: Record<string, string> = { "Task-urile mele": "Task-uri" };

/** Legăturile: în bara laterală (laptop) sau în bara de jos (telefon). Cea activă are iconița aurie. */
export function Navigare({ legaturi, unde }: { legaturi: Legatura[]; unde: "laterala" | "jos" }) {
  const cale = usePathname();
  const eActiv = (href: string) => cale === href || cale.startsWith(href + "/");

  if (unde === "jos") {
    return (
      <nav
        aria-label="Navigare"
        className="sticla fixed inset-x-2.5 z-20 flex justify-around rounded-[26px] px-1.5 py-1.5 md:hidden"
        style={{ bottom: "calc(10px + env(safe-area-inset-bottom))" }}
      >
        {legaturi.map((l) => {
          const activ = eActiv(l.href);
          const scurt = SCURT[l.eticheta];
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={activ ? "page" : undefined}
              aria-label={scurt ? l.eticheta : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[18px] px-1 py-1.5 text-[11px] font-medium ${
                activ ? "bg-sel text-ink" : "text-ink-2"
              }`}
            >
              <Iconita nume={l.iconita} className={`h-[22px] w-[22px] ${activ ? "text-amber" : "opacity-85"}`} />
              <span className="max-w-full truncate">{scurt ?? l.eticheta}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Navigare" className="flex flex-col gap-0.5">
      {legaturi.map((l) => {
        const activ = eActiv(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={activ ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-r px-2.5 py-2 text-[13.5px] font-medium ${
              activ ? "bg-sel text-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            <Iconita nume={l.iconita} className={`h-[17px] w-[17px] flex-none ${activ ? "text-amber" : "opacity-85"}`} />
            {l.eticheta}
          </Link>
        );
      })}
    </nav>
  );
}
