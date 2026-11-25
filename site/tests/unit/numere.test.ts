import { describe, expect, it } from "vitest";
import { cuDe, mii } from "@/lib/numere";

describe("numere", () => {
  it("pune „de” doar unde se spune în română", () => {
    expect(cuDe(1, "ghid", "ghiduri")).toBe("1 ghid");
    expect(cuDe(6, "ghid", "ghiduri")).toBe("6 ghiduri");
    expect(cuDe(19, "oră", "ore")).toBe("19 ore");
    expect(cuDe(20, "oră", "ore")).toBe("20 de ore");
    expect(cuDe(101, "oră", "ore")).toBe("101 ore");
    expect(cuDe(187, "oră", "ore")).toBe("187 de ore");
    expect(cuDe(1000, "oră", "ore")).toBe("1.000 de ore");
  });
  it("desparte miile cu punct", () => {
    expect(mii(22)).toBe("22");
    expect(mii(3250)).toBe("3.250");
    expect(mii(39000)).toBe("39.000");
    expect(mii(1234567)).toBe("1.234.567");
  });
});
