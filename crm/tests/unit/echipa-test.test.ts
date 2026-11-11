import { describe, expect, it, vi } from "vitest";
import { ECHIPA_TEST, eAdresaFaraCasuta, eBazaDeTest } from "@/lib/echipa-test";
import { trimiteEmail } from "@/lib/email";

const TEST = "https://sglkjcwsohzszktljacv.supabase.co";
const PROD = "https://znabkoesmtoggdmehmqp.supabase.co";

describe("echipa de test", () => {
  it("recunoaște doar baza de test", () => {
    expect(eBazaDeTest(TEST)).toBe(true);
    expect(eBazaDeTest(TEST + "/")).toBe(true);
    expect(eBazaDeTest(PROD)).toBe(false);
    expect(eBazaDeTest(undefined)).toBe(false);
    expect(eBazaDeTest("https://sglkjcwsohzszktljacv.supabase.co.rau.ro")).toBe(false);
  });

  it("adresele fără căsuță", () => {
    expect(eAdresaFaraCasuta("temp123@test.buildwithac.ro", PROD)).toBe(true);
    expect(eAdresaFaraCasuta("Mara@BuildWithAC.ro", TEST)).toBe(true);
    expect(eAdresaFaraCasuta("mara@buildwithac.ro", PROD)).toBe(false);
    expect(eAdresaFaraCasuta("contact@buildwithac.ro", TEST)).toBe(false);
  });

  it("conturile au adresa nouă și pe cea veche", () => {
    expect(ECHIPA_TEST.caller).toMatchObject({ email: "mara@buildwithac.ro", nume: "Mara Ionescu", rol: "caller", emailVechi: "caller@test.buildwithac.ro" });
    expect(ECHIPA_TEST.admin.email).toBe("andrei@buildwithac.ro");
  });

  it("trimiteEmail nu cheamă Resend pentru o adresă fără căsuță", async () => {
    process.env.RESEND_API_KEY = "x";
    const f = vi.fn();
    expect(await trimiteEmail({ catre: "caller@test.buildwithac.ro", subiect: "s", text: "t", html: "h" }, f)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
