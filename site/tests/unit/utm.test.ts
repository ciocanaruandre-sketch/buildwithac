import { describe, expect, it } from "vitest";
import { ancoraDinHash, citesteUtm, curataUtm } from "@/lib/utm";

describe("citesteUtm", () => {
  it("păstrează doar parametrii utm_* cunoscuți", () => {
    expect(citesteUtm("?utm_source=meta&utm_campaign=site-nov&x=1")).toEqual({ utm_source: "meta", utm_campaign: "site-nov" });
  });
  it("taie valorile lungi la 200 de caractere", () => {
    expect(citesteUtm(`?utm_content=${"a".repeat(500)}`).utm_content).toHaveLength(200);
  });
  it("fără parametri → obiect gol", () => {
    expect(citesteUtm("")).toEqual({});
    expect(citesteUtm("?utm_source=")).toEqual({});
  });
  it("platforma care pune parametrii după #formular: se citesc și de acolo", () => {
    const utm = { utm_source: "ig", utm_medium: "reclama", utm_campaign: "Cafenele", utm_content: "Clip" };
    expect(citesteUtm("?serviciu=site", "#formular&utm_source=ig&utm_medium=reclama&utm_campaign=Cafenele&utm_content=Clip")).toEqual(utm);
    expect(citesteUtm("", "#formular?utm_source=ig&utm_medium=reclama&utm_campaign=Cafenele&utm_content=Clip")).toEqual(utm);
    // cei dinainte de # câștigă
    expect(citesteUtm("?utm_source=fb", "#formular&utm_source=ig")).toEqual({ utm_source: "fb" });
    expect(citesteUtm("", "#formular")).toEqual({});
  });
});

describe("ancoraDinHash", () => {
  it("doar numele ancorei, fără parametrii lipiți după ea", () => {
    expect(ancoraDinHash("#formular&utm_source=ig")).toBe("formular");
    expect(ancoraDinHash("#formular?utm_source=ig")).toBe("formular");
    expect(ancoraDinHash("#contact")).toBe("contact");
    expect(ancoraDinHash("")).toBe("");
  });
});

describe("curataUtm", () => {
  it("acceptă doar un obiect cu chei utm_* și valori text", () => {
    expect(curataUtm({ utm_source: "tiktok", rau: "x", utm_medium: 5 })).toEqual({ utm_source: "tiktok" });
  });
  it("orice altceva devine obiect gol", () => {
    expect(curataUtm(null)).toEqual({});
    expect(curataUtm("utm_source=x")).toEqual({});
    expect(curataUtm(["utm_source"])).toEqual({});
  });
});
