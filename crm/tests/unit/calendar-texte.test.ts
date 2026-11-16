import { describe, expect, it } from "vitest";
import { textNesterse } from "@/lib/calendar/texte";

describe("textele calendarului", () => {
  it("un eveniment, la singular", () => {
    expect(textNesterse(1)).toBe("Un eveniment n-a putut fi șters. Șterge-l de mână din Google Calendar.");
  });
  it("mai multe, la plural", () => {
    expect(textNesterse(3)).toBe("3 evenimente n-au putut fi șterse. Șterge-le de mână din Google Calendar.");
    expect(textNesterse(25)).toBe("25 de evenimente n-au putut fi șterse. Șterge-le de mână din Google Calendar.");
  });
});
