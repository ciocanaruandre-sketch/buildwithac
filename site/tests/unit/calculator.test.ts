import { describe, expect, it } from "vitest";
import { calculClienti, calculTimp, LIMITE, textClienti, textTimp } from "@/lib/calculator";

describe("calculatorul", () => {
  it("timpul: minute pe zi × 250 de zile × cât valorează ora", () => {
    expect(calculTimp({ minute: 45, leiPeOra: 50 })).toEqual({ ore: 187, lei: 9375 });
    expect(calculTimp({ minute: 10, leiPeOra: 20 })).toEqual({ ore: 41, lei: 833 });
    expect(calculTimp({ minute: 240, leiPeOra: 300 })).toEqual({ ore: 1000, lei: 300000 });
  });
  it("clienții: cereri pierdute × 52/12 × câte cumpără × cât aduce unul", () => {
    expect(calculClienti({ cereri: 5, dinZece: 3, leiPeClient: 500 })).toEqual({ leiPeLuna: 3250 });
    expect(calculClienti({ cereri: 1, dinZece: 1, leiPeClient: 50 })).toEqual({ leiPeLuna: 22 });
    expect(calculClienti({ cereri: 30, dinZece: 10, leiPeClient: 5000 })).toEqual({ leiPeLuna: 650000 });
  });
  it("textul care ajunge în „Descriere”", () => {
    expect(textTimp({ minute: 45, leiPeOra: 50 })).toBe("Din calculator: 45 de minute pe zi de muncă repetată, 50 de lei ora. Cam 187 de ore și 9.375 lei pe an.");
    expect(textClienti({ cereri: 5, dinZece: 3, leiPeClient: 500 })).toBe("Din calculator: 5 cereri pe săptămână fără răspuns, 3 din 10 cumpără, 500 de lei pe client. Cam 3.250 lei pe lună.");
    expect(textClienti({ cereri: 1, dinZece: 1, leiPeClient: 50 })).toBe("Din calculator: 1 cerere pe săptămână fără răspuns, 1 din 10 cumpără, 50 de lei pe client. Cam 22 lei pe lună.");
  });
  it("pornirea cade pe un pas al cursorului", () => {
    for (const k of Object.values(LIMITE)) {
      expect((k.start - k.min) % k.pas).toBe(0);
      expect((k.max - k.min) % k.pas).toBe(0);
    }
  });
});
