import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { citesteProgres, scrieProgres } from "@/lib/progres";

describe("progres", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("salvează și citește", () => {
    scrieProgres("site", ["pas-1", "pas-3"]);
    expect(localStorage.getItem("ghid:site:pasi")).toBe('["pas-1","pas-3"]');
    expect(citesteProgres("site")).toEqual(["pas-1", "pas-3"]);
  });

  it("JSON stricat → []", () => {
    localStorage.setItem("ghid:site:pasi", "{nu e json");
    expect(citesteProgres("site")).toEqual([]);
  });

  it("valoare care nu e listă de texte → []", () => {
    localStorage.setItem("ghid:site:pasi", '{"a":1}');
    expect(citesteProgres("site")).toEqual([]);
  });

  it("localStorage care aruncă la get/set → [] și fără excepție", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocat"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocat"); });
    expect(citesteProgres("site")).toEqual([]);
    expect(() => scrieProgres("site", ["pas-1"])).not.toThrow();
  });
});
