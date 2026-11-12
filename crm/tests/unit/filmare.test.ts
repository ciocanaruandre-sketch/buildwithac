import { describe, expect, it } from "vitest";
import { COOKIE_FILMARE, filmareActiva } from "@/lib/filmare";

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
});
