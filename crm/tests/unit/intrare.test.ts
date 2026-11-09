import { describe, expect, it } from "vitest";
import { decide } from "@/lib/decizie";

describe("decide", () => {
  it("om nou → lead nou", () => {
    expect(decide(null)).toBe("lead_nou");
  });
  it("lead deschis → se leagă de el", () => {
    for (const stare of ["nou", "fara_raspuns", "a_raspuns", "callback", "programat", "oferta_trimisa"] as const) {
      expect(decide({ id: "x", stare })).toBe("leaga_de_lead");
    }
  });
  it("client → se leagă de client", () => {
    expect(decide({ id: "x", stare: "client" })).toBe("leaga_de_client");
  });
  it("pierdut sau descalificat → se redeschide", () => {
    expect(decide({ id: "x", stare: "pierdut" })).toBe("redeschide");
    expect(decide({ id: "x", stare: "descalificat" })).toBe("redeschide");
  });
});
