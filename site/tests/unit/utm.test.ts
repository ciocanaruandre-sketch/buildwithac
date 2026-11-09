import { describe, expect, it } from "vitest";
import { citesteUtm, curataUtm } from "@/lib/utm";

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
