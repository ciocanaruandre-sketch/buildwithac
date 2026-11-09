import type { Stare } from "@/lib/tipuri";

export type LeadGasit = { id: string; stare: Stare } | null;
export type Decizie = "lead_nou" | "leaga_de_lead" | "leaga_de_client" | "redeschide";

/** Ce facem cu o cerere, după omul găsit (același telefon sau e-mail). */
export function decide(gasit: LeadGasit): Decizie {
  if (!gasit) return "lead_nou";
  if (gasit.stare === "client") return "leaga_de_client";
  if (gasit.stare === "pierdut" || gasit.stare === "descalificat") return "redeschide";
  return "leaga_de_lead";
}
