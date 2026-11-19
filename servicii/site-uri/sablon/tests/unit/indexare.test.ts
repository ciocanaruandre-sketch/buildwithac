import { expect, it } from "vitest";
import { seIndexeaza } from "@/lib/indexare";

it("Vercel producție", () => expect(seIndexeaza({ VERCEL_ENV: "production" })).toBe(true));
it("Vercel previzualizare", () => expect(seIndexeaza({ VERCEL_ENV: "preview" })).toBe(false));
it("Netlify producție", () => expect(seIndexeaza({ CONTEXT: "production" })).toBe(true));
it("Netlify deploy-preview", () => expect(seIndexeaza({ CONTEXT: "deploy-preview" })).toBe(false));
it("forțat de mână", () => expect(seIndexeaza({ INDEXARE: "da" })).toBe(true));
it("local", () => expect(seIndexeaza({})).toBe(false));
