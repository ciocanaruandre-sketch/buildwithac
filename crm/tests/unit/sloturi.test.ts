import { describe, expect, it } from "vitest";
import { sloturiCuOcupate, sloturiLibere, type ZiProgram } from "@/lib/sloturi";

const LUNI: ZiProgram[] = [{ zi: 1, de_la: "10:00", pana_la: "12:00" }];
const duminica = new Date("2026-11-08T10:00:00Z"); // duminică, 12:00 în România
const iso = (d: Date[]) => d.map((x) => x.toISOString());

describe("sloturiLibere", () => {
  it("luni 10–12, câte 30 de minute → 4 sloturi", () => {
    expect(iso(sloturiLibere(LUNI, 30, [], duminica, 7))).toEqual([
      "2026-11-09T08:00:00.000Z",
      "2026-11-09T08:30:00.000Z",
      "2026-11-09T09:00:00.000Z",
      "2026-11-09T09:30:00.000Z",
    ]);
  });

  it("un slot ocupat dispare doar el", () => {
    const ocupat = [{ de: new Date("2026-11-09T08:30:00Z"), pana: new Date("2026-11-09T09:00:00Z") }];
    expect(sloturiLibere(LUNI, 30, ocupat, duminica, 7)).toHaveLength(3);
    expect(iso(sloturiLibere(LUNI, 30, ocupat, duminica, 7))).not.toContain("2026-11-09T08:30:00.000Z");
  });

  it("o discuție de 45 de minute de la 10:15 scoate sloturile care se suprapun cu ea", () => {
    const ocupat = [{ de: new Date("2026-11-09T08:15:00Z"), pana: new Date("2026-11-09T09:00:00Z") }];
    expect(iso(sloturiLibere(LUNI, 30, ocupat, duminica, 7))).toEqual(["2026-11-09T09:00:00.000Z", "2026-11-09T09:30:00.000Z"]);
  });

  it("nu dă sloturi care încep în mai puțin de o oră", () => {
    const luni1020 = new Date("2026-11-09T08:20:00Z");
    expect(iso(sloturiLibere(LUNI, 30, [], luni1020, 1))).toEqual(["2026-11-09T09:30:00.000Z"]);
  });

  it("ziua schimbării orei: ora din program rămâne ora din România", () => {
    const sambata = new Date("2026-10-23T10:00:00Z"); // vineri
    const program: ZiProgram[] = [
      { zi: 6, de_la: "10:00", pana_la: "10:30" },
      { zi: 7, de_la: "10:00", pana_la: "10:30" },
    ];
    expect(iso(sloturiLibere(program, 30, [], sambata, 3))).toEqual(["2026-10-24T07:00:00.000Z", "2026-10-25T08:00:00.000Z"]);
  });

  it("fără program → niciun slot", () => {
    expect(sloturiLibere([], 30, [], duminica, 14)).toEqual([]);
  });
});

describe("sloturiCuOcupate", () => {
  const LUNI_10_15: ZiProgram[] = [{ zi: 1, de_la: "10:00", pana_la: "15:00" }];
  const ora = (h: string) => new Date(`2026-11-09T${h}:00Z`); // luni; ora României = UTC+2
  const stare = (s: ReturnType<typeof sloturiCuOcupate>, h: string) => s.find((x) => x.la.getTime() === ora(h).getTime())?.ocupat;

  it("un interval Google 12:00–13:00 face gri 12:00 și 12:30, nu și 11:30 sau 13:00", () => {
    const s = sloturiCuOcupate(LUNI_10_15, 30, [], [{ de: ora("10:00"), pana: ora("11:00") }], duminica, 7);
    expect(stare(s, "10:00")).toBe("google");
    expect(stare(s, "10:30")).toBe("google");
    expect(stare(s, "09:30")).toBeNull();
    expect(stare(s, "11:00")).toBeNull();
  });

  it("un interval Google parțial (12:10–12:20) face gri 12:00", () => {
    const s = sloturiCuOcupate(LUNI_10_15, 30, [], [{ de: ora("10:10"), pana: ora("10:20") }], duminica, 7);
    expect(stare(s, "10:00")).toBe("google");
    expect(stare(s, "10:30")).toBeNull();
  });

  it("discuția câștigă când ora e ocupată și în Google", () => {
    const i = [{ de: ora("12:00"), pana: ora("12:30") }];
    expect(stare(sloturiCuOcupate(LUNI_10_15, 30, i, i, duminica, 7), "12:00")).toBe("discutie");
  });

  it("orele de peste mai puțin de o oră rămân scoase, nu gri", () => {
    const s = sloturiCuOcupate(LUNI_10_15, 30, [], [], new Date("2026-11-09T08:20:00Z"), 1);
    expect(s[0].la.toISOString()).toBe("2026-11-09T09:30:00.000Z");
  });

  it("sloturiLibere = orele fără ocupat", () => {
    const disc = [{ de: ora("08:30"), pana: ora("09:00") }];
    const g = [{ de: ora("11:00"), pana: ora("12:00") }];
    const libere = sloturiCuOcupate(LUNI_10_15, 30, disc, g, duminica, 7).filter((x) => !x.ocupat).map((x) => x.la.toISOString());
    expect(iso(sloturiLibere(LUNI_10_15, 30, [...disc, ...g], duminica, 7))).toEqual(libere);
  });
});
