import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Cheia Google (refresh token) stă în bază doar criptată, AES-256-GCM.
// Formatul: v1.<iv>.<tag>.<date>, fiecare în base64url. GCM verifică și că nimeni n-a schimbat textul.

function cheieDin(cheie: string | undefined): Buffer {
  const c = cheie ?? process.env.GOOGLE_CHEIE_CRIPTARE;
  if (!c) throw new Error("Lipsește GOOGLE_CHEIE_CRIPTARE.");
  const b = Buffer.from(c, "base64");
  if (b.length !== 32) throw new Error("GOOGLE_CHEIE_CRIPTARE trebuie să aibă 32 de octeți (base64).");
  return b;
}

export function cripteaza(text: string, cheie?: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cheieDin(cheie), iv);
  const date = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), date.toString("base64url")].join(".");
}

export function decripteaza(sir: string, cheie?: string): string {
  const [v, iv, tag, date] = sir.split(".");
  if (v !== "v1" || !iv || !tag || date === undefined) throw new Error("Cheie criptată într-un format necunoscut.");
  const d = createDecipheriv("aes-256-gcm", cheieDin(cheie), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(date, "base64url")), d.final()]).toString("utf8");
}
