import Link from "next/link";
import { Fragment } from "react";

/** Bara de sus, de sticlă, ca o pastilă: unde ești (ultimul e îngroșat) și butoanele paginii, la dreapta. */
export function BaraSus({ cale, children }: { cale: { eticheta: string; href?: string }[]; children?: React.ReactNode }) {
  return (
    <div className="sticla sticky top-2 z-10 mb-[26px] flex flex-wrap items-center gap-2.5 rounded-[26px] py-[7px] pr-[7px] pl-[18px] md:top-3 md:rounded-full">
      <div className="min-w-0 truncate py-1.5 text-[13.5px] font-medium text-ink-3">
        {cale.map((p, i) => {
          const ultim = i === cale.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && <span aria-hidden> › </span>}
              {ultim ? (
                <b className="font-semibold text-ink">{p.eticheta}</b>
              ) : p.href ? (
                <Link href={p.href} className="hover:text-ink">
                  {p.eticheta}
                </Link>
              ) : (
                p.eticheta
              )}
            </Fragment>
          );
        })}
      </div>
      {children && <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
