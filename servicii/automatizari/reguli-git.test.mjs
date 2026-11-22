import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

// git check-ignore: cod 0 = ignorat, cod 1 = intră în git
const ignorat = (cale) => {
  try { execFileSync("git", ["check-ignore", "-q", "--no-index", cale]); return true; } catch { return false; }
};

test("din automatizari/ ale unui client intră în git doar cele trei documente (și instrucțiunile variantei Claude)", () => {
  for (const doc of ["propunere.md", "pornire.md", "folosire.md", "claude/instructiuni.md"]) {
    assert.equal(ignorat(`clienti/x/automatizari/${doc}`), false, doc);
  }
  for (const altceva of [".chei.env", ".chei.env.txt", ".chei.env.bak", "export.json", "propunere.pdf", "fluxuri/wf.json", "pdf/folosire.pdf"]) {
    assert.equal(ignorat(`clienti/x/automatizari/${altceva}`), true, altceva);
  }
});

test("fișa și jurnalul clientului intră în git", () => {
  assert.equal(ignorat("clienti/x/fisa.md"), false);
  assert.equal(ignorat("clienti/x/jurnal.md"), false);
});
