import { describe, expect, it } from "vitest";
import { sloturiLibere, type ZiProgram } from "@/lib/sloturi";

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
