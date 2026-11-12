"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { schimbaFilmare } from "@/app/(app)/filmare-actiuni";
import { Iconita } from "@/components/Iconite";

/**
 * „Mod filmare”: blurează numele, firmele și telefoanele pe CRM-ul demo, pentru poze și clipuri.
 * Arată la fel pornit și oprit, ca să nu se vadă în cadru; starea e doar în eticheta pentru hover și cititoare.
 */
export function ComutatorFilmare({ activ }: { activ: boolean }) {
  const router = useRouter();
  const [, porneste] = useTransition();
  const eticheta = `Mod filmare: ${activ ? "pornit" : "oprit"}`;
  return (
    <button
      type="button"
      aria-label={eticheta}
      title={eticheta}
      className="grid h-8 w-8 flex-none place-items-center rounded-full text-ink-3 hover:bg-[var(--btn)] hover:text-ink"
      onClick={() =>
        porneste(async () => {
          await schimbaFilmare();
          router.refresh();
        })
      }
    >
      <Iconita nume="filmare" className="h-[17px] w-[17px]" />
    </button>
  );
}
