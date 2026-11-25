import { describe, expect, it } from "vitest";
import { calcul, LIMITE, textCalcul } from "@/lib/calculator";

const start = { cereri: 3, programari: 2, leiPeClient: 150, minute: 30 };
const zero = { cereri: 0, programari: 0, leiPeClient: 150, minute: 0 };

describe("calculatorul (prudent: 1 din 10 cereri, 1 din 4 programări, jumătate din timp)", () => {
  it("pe lună (× 52/12), rotunjit în jos la 10 lei; timpul în zile de 8 ore pe an", () => {
    // 3 × 52/12 / 10 × 150 = 195; 2 × 52/12 / 4 × 150 = 325; 30 min × 250 / 2 / 60 / 8 = 7,8
    expect(calcul(start)).toEqual({ dinCereri: 190, dinProgramari: 320, leiPeLuna: 510, zile: 7 });
    expect(calcul(zero)).toEqual({ dinCereri: 0, dinProgramari: 0, leiPeLuna: 0, zile: 0 });
  });
  it("la capăt rămâne o sumă care se poate crede", () => {
    const max = Object.fromEntries(Object.entries(LIMITE).map(([k, l]) => [k, l.max])) as typeof start;
    expect(calcul(max)).toEqual({ dinCereri: 2160, dinProgramari: 5410, leiPeLuna: 7570, zile: 31 });
  });
  it("totalul e suma rândurilor de pe bon și nu trece niciodată peste socoteala exactă", () => {
    for (let cereri = 0; cereri <= 10; cereri++)
      for (let programari = 0; programari <= 10; programari++)
        for (const leiPeClient of [50, 70, 150, 500]) {
          const r = calcul({ cereri, programari, leiPeClient, minute: 0 });
          expect(r.leiPeLuna).toBe(r.dinCereri + r.dinProgramari);
          expect(r.leiPeLuna).toBeLessThanOrEqual((leiPeClient * 52 * (cereri / 10 + programari / 4)) / 12);
        }
  });
  it("cel mai mic pas al fiecărui cursor se vede pe bon, fără „0 lei” sau „0 zile”", () => {
    expect(calcul({ ...zero, leiPeClient: LIMITE.leiPeClient.min, cereri: 1 }).dinCereri).toBe(20);
    expect(calcul({ ...zero, leiPeClient: LIMITE.leiPeClient.min, programari: 1 }).dinProgramari).toBe(50);
    expect(calcul({ ...zero, minute: LIMITE.minute.pas }).zile).toBe(1);
  });
  it("textul care ajunge în „Descriere” spune că e o estimare", () => {
    expect(textCalcul(start)).toBe("Din calculator: 3 cereri pe săptămână la care răspund târziu sau deloc, 2 programări pe săptămână la care nu vine nimeni, 150 de lei pe client, 30 de minute pe zi de muncă repetată. Estimare prudentă: până la 510 lei pe lună și 7 zile pe an.");
    expect(textCalcul({ ...start, minute: 0 })).toBe("Din calculator: 3 cereri pe săptămână la care răspund târziu sau deloc, 2 programări pe săptămână la care nu vine nimeni, 150 de lei pe client. Estimare prudentă: până la 510 lei pe lună.");
  });
  it("ce e pe zero nu apare în text", () => {
    expect(textCalcul({ ...zero, minute: 30 })).toBe("Din calculator: 30 de minute pe zi de muncă repetată. Estimare prudentă: până la 7 zile pe an.");
    expect(textCalcul({ ...zero, cereri: 1, minute: 5 })).toBe("Din calculator: 1 cerere pe săptămână la care răspund târziu sau deloc, 150 de lei pe client, 5 minute pe zi de muncă repetată. Estimare prudentă: până la 60 lei pe lună și 1 zi pe an.");
    expect(textCalcul(zero)).toBe("");
  });
  it("pornirea cade pe un pas al cursorului", () => {
    for (const k of Object.values(LIMITE)) {
      expect((k.start - k.min) % k.pas).toBe(0);
      expect((k.max - k.min) % k.pas).toBe(0);
    }
  });
});
