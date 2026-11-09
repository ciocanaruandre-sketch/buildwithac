import { describe, expect, it } from "vitest";
import { construiesteInvitatie } from "@/lib/invitatie";

describe("construiesteInvitatie", () => {
  const link = "https://crm.buildwithac.ro/auth/confirm?token_hash=abc&type=invite";

  it("pe prenume, cu rolul și linkul", () => {
    const e = construiesteInvitatie("Mara Ionescu", "caller", link);
    expect(e.text).toContain("Salut, Mara!");
    expect(e.text).toContain("ca Caller");
    expect(e.text).toContain(link);
    expect(e.html).toContain(`href="${link.replace(/&/g, "&amp;")}"`);
  });

  it("numele nu poate strica HTML-ul", () => {
    const e = construiesteInvitatie("<b>Ion</b>", "closer", link);
    expect(e.html).not.toContain("<b>Ion");
    expect(e.html).toContain("&lt;b&gt;Ion");
  });

  it("fără ş/ţ cu sedilă", () => {
    const e = construiesteInvitatie("Ion", "constructor", link);
    expect(e.text + e.subiect).not.toMatch(/[şţŞŢ]/);
  });
});
