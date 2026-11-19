import { expect, it } from "vitest";
import { CONTINUT } from "@/lib/continut";
import { SchemaContinut } from "@/lib/schema";

it("conținutul trece schema", () => expect(SchemaContinut.safeParse(CONTINUT).success).toBe(true));
it("descriere prea lungă", () =>
  expect(SchemaContinut.safeParse({ ...CONTINUT, descriere: "a".repeat(161) }).success).toBe(false));
it("poză fără alt", () =>
  expect(SchemaContinut.safeParse({ ...CONTINUT, poze: [{ fisier: "/a.jpg", alt: "" }] }).success).toBe(false));
it("poză fără „/” la început", () =>
  expect(SchemaContinut.safeParse({ ...CONTINUT, poze: [{ fisier: "a.jpg", alt: "Sala" }] }).success).toBe(false));
it("preț lipsă e permis", () =>
  expect(SchemaContinut.safeParse({ ...CONTINUT, servicii: [{ nume: "Cafea", pret: null }] }).success).toBe(true));
