import { describe, it, expect } from "vitest";
import path from "node:path";
import { extragePasi, incarcaGhiduri, numeroteazaPasii, parametriGhiduri } from "@/lib/ghiduri";

const fx = (n: string) => path.join(__dirname, "fixtures", n);
const dev = { productie: false };

describe("incarcaGhiduri", () => {
  it("sortează după publicat, cel mai nou primul", () => {
    expect(incarcaGhiduri(fx("ghiduri"), dev).map((g) => g.slug)).toEqual(["b", "c", "a"]);
  });

  it("exclude exemplu:true când productie=true", () => {
    expect(incarcaGhiduri(fx("ghiduri"), { productie: true }).map((g) => g.slug)).toEqual(["c", "a"]);
  });

  it("aruncă eroare cu numele fișierului când frontmatter-ul e invalid", () => {
    expect(() => incarcaGhiduri(fx("ghiduri-invalid"), dev)).toThrow(/x[\\/]index\.mdx/);
  });

  it("aruncă eroare la slug duplicat", () => {
    expect(() => incarcaGhiduri(fx("ghiduri-dup-slug"), dev)).toThrow(/slug/i);
  });

  it("aruncă eroare la cuvânt duplicat", () => {
    expect(() => incarcaGhiduri(fx("ghiduri-dup-cuvant"), dev)).toThrow(/cuv[aâ]nt/i);
  });

  it("slug din frontmatter == numele dosarului", () => {
    expect(() => incarcaGhiduri(fx("ghiduri-slug-gresit"), dev)).toThrow(/dosar/i);
  });

  it("extrage pașii în ordine", () => {
    const [g] = incarcaGhiduri(fx("ghiduri"), dev);
    expect(g.pasi).toEqual([
      { id: "pas-1", titlu: "Unu" },
      { id: "pas-2", titlu: "Doi" },
      { id: "pas-3", titlu: "Trei" },
    ]);
  });

  it("demo=15 completează până la 15 cu copii, cu slug și cuvânt unice", () => {
    const g = incarcaGhiduri(fx("ghiduri"), { productie: false, demo: 15 });
    expect(g).toHaveLength(15);
    expect(new Set(g.map((x) => x.slug)).size).toBe(15);
    expect(new Set(g.map((x) => x.cuvant)).size).toBe(15);
    expect(g[0].slug).toBe("b");
    expect(g.find((x) => x.slug === "b-2")?.dosar).toBe("b");
  });

  it("demo e ignorat în producție", () => {
    expect(incarcaGhiduri(fx("ghiduri"), { productie: true, demo: 15 })).toHaveLength(2);
  });
});

describe("parametriGhiduri", () => {
  it("dă câte un slug pentru fiecare ghid", () => {
    expect(parametriGhiduri(incarcaGhiduri(fx("ghiduri"), dev))).toEqual([{ slug: "b" }, { slug: "c" }, { slug: "a" }]);
  });

  it("fără ghiduri (producție, doar exemple) dă un slug-santinelă — Cache Components refuză lista goală", () => {
    expect(parametriGhiduri([])).toEqual([{ slug: "_" }]);
  });
});

describe("pașii", () => {
  const corp = [
    '<Pas titlu="Unu">a</Pas>',
    "```jsx\n<Pas titlu=\"Din cod\">x</Pas>\n```",
    "Text cu `<Pas titlu=\"inline\">` în el.",
    '<Pas\n  titlu="Doi">b</Pas>',
  ].join("\n\n");

  it("ignoră <Pas> din cod și prinde titlu pe alt rând", () =>
    expect(extragePasi(corp)).toEqual([{ id: "pas-1", titlu: "Unu" }, { id: "pas-2", titlu: "Doi" }]));

  it("numerotează doar pașii adevărați, în aceeași ordine", () => {
    const n = numeroteazaPasii(corp);
    expect(n).toContain('<Pas id="pas-1" n="1" titlu="Unu"');
    expect(n).toContain('<Pas id="pas-2" n="2"\n  titlu="Doi"');
    expect(n).toContain('```jsx\n<Pas titlu="Din cod">');
    expect(n).toContain('`<Pas titlu="inline">`');
  });

  it("un <Pas> fără titlu=\"…\" oprește încărcarea, cu numele fișierului", () =>
    expect(() => incarcaGhiduri(fx("ghiduri-pas-fara-titlu"), dev)).toThrow(/x[\\/]index\.mdx[\s\S]*titlu/));
});
