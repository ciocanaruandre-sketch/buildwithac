import { describe, expect, it } from "vitest";
import { calcul, LIMITE, textCalcul } from "@/lib/calculator";

const start = { clienti: 1, programari: 2, leiPeClient: 200, minute: 45 };
const zero = { clienti: 0, programari: 0, leiPeClient: 200, minute: 0 };

describe("calculatorul", () => {
  it("clienții și programările pe lună (× 52/12), timpul în zile de 8 ore pe an (250 de zile lucrătoare)", () => {
    expect(calcul(start)).toEqual({ dinRaspuns: 867, dinProgramari: 1733, leiPeLuna: 2600, zile: 23 });
    expect(calcul({ clienti: 15, programari: 20, leiPeClient: 5000, minute: 240 })).toEqual({ dinRaspuns: 325000, dinProgramari: 433333, leiPeLuna: 758333, zile: 125 });
    expect(calcul(zero)).toEqual({ dinRaspuns: 0, dinProgramari: 0, leiPeLuna: 0, zile: 0 });
  });
  it("totalul e suma rândurilor de pe bon, chiar după rotunjire", () => {
    for (let clienti = 0; clienti <= 15; clienti++)
      for (let programari = 0; programari <= 20; programari++) {
        const r = calcul({ clienti, programari, leiPeClient: 50, minute: 0 });
        expect(r.leiPeLuna).toBe(r.dinRaspuns + r.dinProgramari);
      }
  });
  it("textul care ajunge în „Descriere”", () => {
    expect(textCalcul(start)).toBe("Din calculator: 1 client în plus pe săptămână cu răspuns la timp, 2 programări pe săptămână la care nu vine nimeni, 200 de lei pe client, 45 de minute pe zi de muncă repetată. Pot câștiga până la 2.600 lei pe lună și 23 de zile pe an.");
    expect(textCalcul({ ...start, minute: 0 })).toBe("Din calculator: 1 client în plus pe săptămână cu răspuns la timp, 2 programări pe săptămână la care nu vine nimeni, 200 de lei pe client. Pot câștiga până la 2.600 lei pe lună.");
  });
  it("ce e pe zero nu apare în text", () => {
    expect(textCalcul({ ...zero, minute: 45 })).toBe("Din calculator: 45 de minute pe zi de muncă repetată. Pot câștiga până la 23 de zile pe an.");
    expect(textCalcul({ ...zero, clienti: 3 })).toBe("Din calculator: 3 clienți în plus pe săptămână cu răspuns la timp, 200 de lei pe client. Pot câștiga până la 2.600 lei pe lună.");
    expect(textCalcul(zero)).toBe("");
  });
  it("și cel mai mic pas al timpului face cel puțin o zi pe an, deci nu apare „0 zile”", () => {
    expect(calcul({ ...zero, minute: LIMITE.minute.pas }).zile).toBe(2);
  });
  it("pornirea cade pe un pas al cursorului", () => {
    for (const k of Object.values(LIMITE)) {
      expect((k.start - k.min) % k.pas).toBe(0);
      expect((k.max - k.min) % k.pas).toBe(0);
    }
  });
});
