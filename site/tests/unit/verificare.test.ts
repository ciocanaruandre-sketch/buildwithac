import { describe, it, expect } from "vitest";
import path from "node:path";
import { extragePasi, incarcaGhiduri, type Ghid } from "@/lib/ghiduri";
import { verificaGhid, type Problema } from "@/lib/verificare";

const o = { dosarPublic: path.join(__dirname, "fixtures", "verificare", "public"), azi: new Date("2026-10-25") };

const BAZA = `<DeCeAiNevoie>
- Cont Claude Pro (20 $/lună)
</DeCeAiNevoie>

<Pas titlu="Primul">
Text.

<Prompt>Fă ceva.</Prompt>

<CeVezi src="ok.webp" alt="Ce vezi" />
</Pas>`;

function ghid(corp: string, extra: Partial<Ghid> = {}): Ghid {
  return {
    titlu: "Ghid de test", slug: "t", cuvant: "TEST", descriere: "Descriere scurtă.", ceGasesti: ["ceva"],
    durata: "10 min", nivel: "începător", unelte: ["Claude"], actualizat: new Date("2026-10-20"),
    publicat: new Date("2026-10-20"), imagine: "cover.webp", pdf: false, exemplu: false,
    corp, pasi: extragePasi(corp), dosar: "t", ...extra,
  };
}

const erori = (p: Problema[]) => p.filter((x) => x.nivel === "eroare").map((x) => x.mesaj);
const avert = (p: Problema[]) => p.filter((x) => x.nivel === "avertisment").map((x) => x.mesaj);
const E = (corp: string, extra?: Partial<Ghid>, azi = o.azi) => erori(verificaGhid(ghid(corp, extra), { ...o, azi })).join("\n");
const A = (corp: string, extra?: Partial<Ghid>) => avert(verificaGhid(ghid(corp, extra), o)).join("\n");

describe("verificaGhid — erori", () => {
  it("ghidul de bază n-are erori și nici avertismente", () => {
    expect(verificaGhid(ghid(BAZA), o)).toEqual([]);
  });
  it("exemplu: true e eroare", () => expect(E(BAZA, { exemplu: true })).toMatch(/exemplu/));
  it("imaginea de copertă lipsă e eroare", () => expect(E(BAZA, { imagine: "nu.webp" })).toMatch(/nu\.webp/));
  it("captura lipsă e eroare, cu pasul", () =>
    expect(E('<DeCeAiNevoie>- 20 $/lună</DeCeAiNevoie>\n\n<Pas titlu="A"><CeVezi src="nu.webp" alt="x" /></Pas>'))
      .toMatch(/nu\.webp.*pasul 1/));
  it("fără <DeCeAiNevoie> e eroare", () => expect(E('<Pas titlu="A"><CeVezi src="ok.webp" alt="x" /></Pas>')).toMatch(/DeCeAiNevoie/));
  it("fără pași e eroare", () => expect(E("<DeCeAiNevoie>- gratuit</DeCeAiNevoie>")).toMatch(/pa[șs]/i));
  it("sedila e eroare, cu rândul", () => expect(E(BAZA + "\n\nşi")).toMatch(/sedil.*rândul 13/));
  it("sedila din titlu e eroare", () => expect(E(BAZA, { titlu: "Animaţii" })).toMatch(/sedil.*titlu/));
  it("<div> e etichetă nepermisă, dar nu în cod", () => {
    expect(E(BAZA + "\n\n<div>x</div>")).toMatch(/<div>/);
    expect(E(BAZA + "\n\n```html\n<div>x</div>\n```")).toBe("");
    expect(E(BAZA + "\n\nScrie `<div>` în fișier.")).toBe("");
  });
  it("textul de umplutură e eroare", () => {
    expect(E(BAZA + "\n\nTODO: de scris")).toMatch(/TODO/);
    expect(E(BAZA + "\n\nVezi [LINK].")).toMatch(/\[LINK\]/);
    expect(E(BAZA, { descriere: "Lorem ipsum dolor" })).toMatch(/lorem/i);
  });
  it("<Prompt> gol e eroare", () => expect(E(BAZA + "\n\n<Prompt>  </Prompt>")).toMatch(/Prompt/));
  it("pdf: true fără fișier e eroare; cu fișier, nu", () => {
    expect(E(BAZA, { pdf: true, slug: "u" })).toMatch(/pdf/i);
    expect(E(BAZA, { pdf: true })).toBe("");
  });
  it("datele în ordine greșită sunt erori", () => {
    expect(E(BAZA, { actualizat: new Date("2026-10-26") })).toMatch(/actualizat/);
    expect(E(BAZA, { publicat: new Date("2026-10-21") })).toMatch(/publicat/);
  });
});

describe("verificaGhid — ciornă (înainte de previzualizare)", () => {
  const corp = '<DeCeAiNevoie>- 20 $/lună</DeCeAiNevoie>\n\n<Pas titlu="A"><CeVezi src="nu.webp" alt="x" /></Pas>';
  const c = { ...o, ciorna: true };
  it("captura lipsă e doar avertisment", () => {
    expect(erori(verificaGhid(ghid(corp), c))).toEqual([]);
    expect(avert(verificaGhid(ghid(corp), c)).join()).toMatch(/nu\.webp/);
  });
  it("coperta lipsă e doar avertisment", () => {
    expect(erori(verificaGhid(ghid(BAZA, { imagine: "nu.webp" }), c))).toEqual([]);
    expect(avert(verificaGhid(ghid(BAZA, { imagine: "nu.webp" }), c)).join()).toMatch(/nu\.webp/);
  });
  it("restul erorilor rămân erori", () => expect(erori(verificaGhid(ghid(BAZA + "\n\nşi"), c)).join()).toMatch(/sedil/));
});

describe("data de azi, noaptea", () => {
  it("un ghid actualizat azi nu e „în viitor” la 01:00, ora locală", () =>
    expect(E(BAZA, { actualizat: new Date("2026-10-25"), publicat: new Date("2026-10-25") }, new Date(2026, 9, 25, 1, 0))).toBe(""));

  it("pe un server în UTC (Vercel), la 01:30 ora României, ghidul de azi nu e „în viitor”", () => {
    const tz = process.env.TZ;
    process.env.TZ = "UTC";
    try {
      // 2026-11-01T23:30Z = 2 noiembrie, 01:30 la București
      expect(E(BAZA, { actualizat: new Date("2026-11-02"), publicat: new Date("2026-11-02") }, new Date("2026-11-01T23:30:00Z"))).toBe("");
    } finally {
      if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz;
    }
  });
});

describe("verificaGhid — avertismente", () => {
  it("linia lungă — e numărată", () => expect(A(BAZA + "\n\nAsta — și asta — merge.")).toMatch(/2 .*—/));
  it("<DeCeAiNevoie> fără preț", () =>
    expect(A(BAZA.replace("Cont Claude Pro (20 $/lună)", "Cont Claude Pro"))).toMatch(/preț/));
  it("„gratuit” ține loc de preț", () =>
    expect(A(BAZA.replace("Cont Claude Pro (20 $/lună)", "Cont Canva gratuit"))).toBe(""));
  it("pas fără captură", () => expect(A(BAZA + '\n\n<Pas titlu="Al doilea">x</Pas>')).toMatch(/pasul 2.*captur/));
  it("notițele „greșeala mea” cer confirmare", () =>
    expect(A(BAZA + "\n\n<GresealaMea>am uitat</GresealaMea>")).toMatch(/1 .*greșeala mea/));
  it("descrierea prea lungă", () => expect(A(BAZA, { descriere: "a".repeat(161) })).toMatch(/160/));
  it("ghidul neactualizat de peste 90 de zile", () =>
    expect(A(BAZA, { actualizat: new Date("2026-07-01"), publicat: new Date("2026-07-01") })).toMatch(/90/));
});

describe("ghidurile adevărate din content/ghiduri", () => {
  for (const g of incarcaGhiduri(undefined, { productie: true })) {
    it(`${g.slug} n-are erori`, () =>
      expect(erori(verificaGhid(g, { dosarPublic: path.join(process.cwd(), "public") }))).toEqual([]));
  }
  it("lista se încarcă", () => expect(Array.isArray(incarcaGhiduri(undefined, { productie: true }))).toBe(true));
});
