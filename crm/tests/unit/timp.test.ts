import { describe, expect, it } from "vitest";
import { laOraRomaniei, scurtaturaCallback, ziuaRomaniei } from "@/lib/timp";

describe("laOraRomaniei", () => {
  it("vara (UTC+3) și iarna (UTC+2)", () => {
    expect(laOraRomaniei("2026-10-24", "10:00").toISOString()).toBe("2026-10-24T07:00:00.000Z");
    expect(laOraRomaniei("2026-10-26", "10:00").toISOString()).toBe("2026-10-26T08:00:00.000Z");
  });
  it("chiar în ziua schimbării orei", () => {
    expect(laOraRomaniei("2026-10-25", "10:00").toISOString()).toBe("2026-10-25T08:00:00.000Z");
    expect(laOraRomaniei("2027-03-28", "10:00").toISOString()).toBe("2027-03-28T07:00:00.000Z");
  });
});

describe("ziuaRomaniei", () => {
  it("după miezul nopții în România e deja ziua următoare", () => {
    expect(ziuaRomaniei(new Date("2026-10-24T21:30:00Z"))).toBe("2026-10-25");
    expect(ziuaRomaniei(new Date("2026-10-24T20:30:00Z"))).toBe("2026-10-24");
  });
});

describe("scurtaturaCallback", () => {
  const acum = new Date("2026-10-24T20:30:00Z"); // sâmbătă, 23:30 în România
  it("mâine la 10:00 cade după schimbarea orei", () => {
    expect(scurtaturaCallback("maine_10", acum).toISOString()).toBe("2026-10-25T08:00:00.000Z");
  });
  it("mâine la 16:00", () => {
    expect(scurtaturaCallback("maine_16", acum).toISOString()).toBe("2026-10-25T14:00:00.000Z");
  });
  it("peste două zile, la aceeași oră din România", () => {
    // poimâine (luni), 10:00
    expect(scurtaturaCallback("doua_zile", acum).toISOString()).toBe("2026-10-26T08:00:00.000Z");
  });
  it("o oră și trei ore", () => {
    expect(scurtaturaCallback("o_ora", acum).getTime()).toBe(acum.getTime() + 3_600_000);
    expect(scurtaturaCallback("trei_ore", acum).getTime()).toBe(acum.getTime() + 3 * 3_600_000);
  });
});
