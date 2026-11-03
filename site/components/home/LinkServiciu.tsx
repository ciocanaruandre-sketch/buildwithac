"use client";

import type { ReactNode } from "react";
import type { CheieServiciu } from "@/lib/contact";

/** Link de pe cardul unui serviciu: derulează la formular (Lenis, anchors) și alege pastila potrivită. Fără JavaScript, tot ajunge la formular. */
export function LinkServiciu({ cheie, eticheta, children }: { cheie: CheieServiciu; eticheta: string; children: ReactNode }) {
  return (
    <a className="spre-contact" href="#formular" aria-label={`Hai să vorbim despre: ${eticheta}`}
      onClick={() => window.dispatchEvent(new CustomEvent("contact:serviciu", { detail: cheie }))}>
      {children}
    </a>
  );
}
