import { test } from "node:test";
import assert from "node:assert/strict";
import { join, sep } from "node:path";
import { cai } from "./tipareste.mjs";

const R = join(sep, "radacina");

test("documentul clientului și PDF-ul lui", () => {
  const c = cai(["cafe-central", "propunere"], R);
  assert.equal(c.sursa, join(R, "clienti", "cafe-central", "automatizari", "propunere.md"));
  assert.equal(c.destinatie, join(R, "clienti", "cafe-central", "automatizari", "pdf", "propunere.pdf"));
});

test("exemplele stau lângă generator", () => {
  const c = cai(["--exemplu", "folosire"], R);
  assert.equal(c.destinatie, join(R, "servicii", "automatizari", "pdf", "exemple", "folosire.pdf"));
});

test("refuză slug-ul greșit (nu iese din clienti/)", () => assert.throws(() => cai(["../site", "propunere"], R), /Slug/));
test("refuză tipul necunoscut", () => assert.throws(() => cai(["cafe", "oferta"], R), /propunere, pornire, folosire/));
test("refuză fără argumente", () => assert.throws(() => cai([], R), /Folosire/));
