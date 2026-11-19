import { expect, it } from "vitest";
import { seIndexeaza } from "@/lib/indexare";

const D = "firma.ro";

it("Vercel producție, pe domeniul firmei", () =>
  expect(seIndexeaza({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "firma.ro" }, D)).toBe(true));
it("Vercel producție, domeniul cu www", () =>
  expect(seIndexeaza({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "www.firma.ro" }, D)).toBe(true));
it("Vercel producție înainte de lansare (doar …vercel.app)", () =>
  expect(seIndexeaza({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "site-firma.vercel.app" }, D)).toBe(false));
it("Vercel previzualizare", () =>
  expect(seIndexeaza({ VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "firma.ro" }, D)).toBe(false));
it("Netlify producție", () => expect(seIndexeaza({ CONTEXT: "production" }, D)).toBe(true));
it("Netlify deploy-preview", () => expect(seIndexeaza({ CONTEXT: "deploy-preview" }, D)).toBe(false));
it("forțat de mână", () => expect(seIndexeaza({ INDEXARE: "da" }, D)).toBe(true));
it("local", () => expect(seIndexeaza({}, D)).toBe(false));
