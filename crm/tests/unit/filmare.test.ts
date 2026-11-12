import { describe, expect, it } from "vitest";
import { aratComutatorFilmare, COOKIE_FILMARE, filmareActiva } from "@/lib/filmare";

const TEST = "https://sglkjcwsohzszktljacv.supabase.co";
const PROD = "https://znabkoesmtoggdmehmqp.supabase.co";

describe("modul filmare", () => {
  it("pornit doar cu cookie-ul „1” și doar pe baza de test", () => {
    expect(filmareActiva("1", TEST)).toBe(true);
    expect(filmareActiva("1", TEST + "/")).toBe(true);
    expect(filmareActiva("1", PROD)).toBe(false);
    expect(filmareActiva(undefined, TEST)).toBe(false);
    expect(filmareActiva("0", TEST)).toBe(false);
    expect(filmareActiva("1", undefined)).toBe(false);
  });

  it("cookie-ul are un nume fix", () => {
    expect(COOKIE_FILMARE).toBe("crm_filmare");
  });

  it("comutatorul apare doar pentru Admin și doar pe baza de test, niciodată pe producție", () => {
    expect(aratComutatorFilmare("admin", TEST)).toBe(true);
    expect(aratComutatorFilmare("admin", PROD)).toBe(false);
    expect(aratComutatorFilmare("admin", undefined)).toBe(false);
    for (const rol of ["caller", "closer", "constructor"] as const) expect(aratComutatorFilmare(rol, TEST)).toBe(false);
  });
});
