import { describe, expect, it } from "vitest";
import { construiesteNotificare } from "@/lib/notificare";

const lead = { id: "abc-123", nume: "Ion <script>alert(1)</script>", telefon: "0721 123 456", serviciu: "site" as const, sursa: "reclama_meta" as const };

describe("construiesteNotificare", () => {
  it("escapează HTML-ul din nume", () => {
    const { html } = construiesteNotificare(lead, "lead_nou");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
  it("subiectul e pe un singur rând, cu serviciul și numele", () => {
    const { subiect } = construiesteNotificare({ ...lead, nume: "Ion\nPopescu" }, "lead_nou");
    expect(subiect).toBe("Lead nou: Site · Ion Popescu");
  });
  it("subiectul spune ce s-a întâmplat", () => {
    expect(construiesteNotificare(lead, "leaga_de_client").subiect).toMatch(/^Client existent: /);
    expect(construiesteNotificare(lead, "redeschide").subiect).toMatch(/^Lead redeschis: /);
    expect(construiesteNotificare(lead, "leaga_de_lead").subiect).toMatch(/^Lead existent: /);
  });
  it("are link la fișă și telefonul ca link", () => {
    const { html, text } = construiesteNotificare(lead, "lead_nou");
    expect(html).toContain("https://crm.buildwithac.ro/lead-uri/abc-123");
    expect(text).toContain("https://crm.buildwithac.ro/lead-uri/abc-123");
    expect(html).toContain('href="tel:+40721123456"');
    expect(text).toContain("Reclamă Meta");
  });
});
