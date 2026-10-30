import { describe, it, expect, vi, afterEach } from "vitest";
import { numePdf } from "@/scripts/pdf/tipar";
import nextConfig from "@/next.config";
import robots from "@/app/robots";

describe("numePdf", () => {
  it("păstrează cheia existentă", () =>
    expect(numePdf("site", ["site-0123456789ab.pdf", "alt-ffffffffffff.pdf"])).toBe("site-0123456789ab.pdf"));
  it("nu confundă slug-urile care încep la fel", () =>
    expect(numePdf("site", ["site-uri-0123456789ab.pdf"], () => "aaaaaaaaaaaa")).toBe("site-aaaaaaaaaaaa.pdf"));
  it("punctul din .pdf e literal", () =>
    expect(numePdf("ghid", ["ghid-0123456789abXpdf"], () => "aaaaaaaaaaaa")).toBe("ghid-aaaaaaaaaaaa.pdf"));
  it("cheia nouă are 12 caractere hex", () => expect(numePdf("x", [])).toMatch(/^x-[0-9a-f]{12}\.pdf$/));
});

describe("PDF-urile nu se indexează", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("/pdf/ primește noindex", async () => {
    const h = await nextConfig.headers!();
    expect(h).toContainEqual({ source: "/pdf/:fisier*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] });
  });
  it("robots lasă /pdf/ deschis în producție, ca crawlerul să vadă noindex", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(robots().rules).toEqual({ userAgent: "*", allow: "/" });
  });
});
