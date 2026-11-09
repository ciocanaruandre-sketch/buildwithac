import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ETICHETE, ROLURI, SERVICII, STARI, SURSE, SURSE_MANUALE } from "@/lib/tipuri";

describe("tipuri", () => {
  const grupuri = [
    ["stare", STARI],
    ["sursa", SURSE],
    ["serviciu", SERVICII],
    ["rol", ROLURI],
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

  it("sursele manuale sunt cele 5 din spec", () => {
    expect(SURSE_MANUALE).toEqual(["cold_calling", "recomandare", "dm_instagram", "dm_tiktok", "altceva"]);
  });
});
