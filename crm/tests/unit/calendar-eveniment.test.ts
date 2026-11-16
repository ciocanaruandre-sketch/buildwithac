import { describe, expect, it } from "vitest";
import { corpEveniment } from "@/lib/calendar/eveniment";

const id = "8b1f2c3d-0000-4000-8000-000000000001";
const baza = { leadId: id, nume: "Cafeneaua Colț", telefon: "0722 000 000", serviciu: "site" as const, incepe: "2026-12-01T10:00:00.000Z", sfarseste: "2026-12-01T10:30:00.000Z" };

describe("corpul evenimentului", () => {
  it("titlul, descrierea și ora", () => {
    const c = corpEveniment(baza);
    expect(c.summary).toBe("Discuție · Cafeneaua Colț");
    expect(c.description.split("\n")).toEqual([
      "Telefon: 0722 000 000",
      "Serviciu: Site",
      `Fișa: https://crm.buildwithac.ro/lead-uri/${id}`,
    ]);
    expect(c.start).toEqual({ dateTime: baza.incepe, timeZone: "Europe/Bucharest" });
    expect(c.end).toEqual({ dateTime: baza.sfarseste, timeZone: "Europe/Bucharest" });
  });

  it("fără telefon sau serviciu, rândul lipsește", () => {
    const c = corpEveniment({ ...baza, telefon: null, serviciu: null });
    expect(c.description).toBe(`Fișa: https://crm.buildwithac.ro/lead-uri/${id}`);
    expect(c.description).not.toContain("null");
  });

  it("fără invitați, Meet sau memento-uri", () => {
    const c = corpEveniment(baza) as Record<string, unknown>;
    expect(c).not.toHaveProperty("attendees");
    expect(c).not.toHaveProperty("conferenceData");
    expect(c).not.toHaveProperty("reminders");
  });
});
