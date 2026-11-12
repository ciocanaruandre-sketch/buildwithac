import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/baza.types";
import { AL_CUI, ETICHETE, ROLURI, SERVICII, STADII, STARI, STARI_LIVRARE, SURSE, SURSE_MANUALE, TIPURI_TRANSA, UNDE_PAROLA } from "@/lib/tipuri";

describe("tipuri", () => {
  it("tipurile de tranșă sunt cele din baza de date", () => {
    expect([...TIPURI_TRANSA]).toEqual([...Constants.public.Enums.tip_transa]);
  });

  const grupuri = [
    ["stare", STARI],
    ["sursa", SURSE],
    ["serviciu", SERVICII],
    ["rol", ROLURI],
    ["stadiu", STADII],
    ["livrare", STARI_LIVRARE],
    ["alCui", AL_CUI],
    ["undeParola", UNDE_PAROLA],
  ] as const;

  it.each(grupuri)("fiecare %s are etichetă nevidă, cu ș/ț cu virgulă", (grup, chei) => {
    const etichete = ETICHETE[grup] as Record<string, string>;
    for (const cheie of chei) {
      expect(etichete[cheie], cheie).toBeTruthy();
      expect(etichete[cheie]).not.toMatch(/[şţŞŢ]/);
    }
  });

  it("serviciile sunt aceleași ca în formularul site-ului", () => {
    // citit ca text: site/lib/contact.ts importă „@/lib/config”, care în crm/ e alt fișier
    const sursa = readFileSync(path.resolve(__dirname, "../../../site/lib/contact.ts"), "utf8");
    const bloc = sursa.slice(sursa.indexOf("SERVICII_CONTACT"), sursa.indexOf("] as const"));
    const chei = [...bloc.matchAll(/cheie: "([^"]+)"/g)].map((m) => m[1]);
    expect(chei.length).toBeGreaterThan(0);
    expect([...SERVICII]).toEqual(chei);
  });

  it("stadiile au exact etichetele din listă, în ordinea din design", () => {
    expect(Object.keys(ETICHETE.stadiu)).toEqual([...STADII]);
    expect(STADII.map((s) => ETICHETE.stadiu[s])).toEqual(["Discuție", "Schiță", "Construcție", "Revizii", "Livrat", "Mentenanță"]);
  });

  it("sursele manuale: reclamele și cele 5 din spec", () => {
    expect(SURSE_MANUALE).toEqual(["reclama_meta", "reclama_tiktok", "cold_calling", "recomandare", "dm_instagram", "dm_tiktok", "altceva"]);
  });
});
