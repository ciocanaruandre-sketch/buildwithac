"use client";

import { useEffect } from "react";
import { CHEIE_STOCARE_UTM, citesteUtm } from "@/lib/utm";

/**
 * Ține minte din ce link a venit omul (utm_*), cât e pe site, ca formularul de contact să-l trimită în CRM.
 * Primul link câștigă: nu suprascrie ce e deja ținut minte.
 */
export function PastreazaUtm() {
  useEffect(() => {
    try {
      const utm = citesteUtm(window.location.search);
      if (Object.keys(utm).length && !sessionStorage.getItem(CHEIE_STOCARE_UTM)) {
        sessionStorage.setItem(CHEIE_STOCARE_UTM, JSON.stringify(utm));
      }
    } catch {
      // stocare blocată (navigare privată etc.): mergem mai departe fără
    }
  }, []);
  return null;
}
