import { test } from "node:test";
import assert from "node:assert/strict";
import { documentInHtml, TIPURI } from "./document.mjs";

test("cele trei tipuri", () => assert.deepEqual(TIPURI, ["propunere", "pornire", "folosire"]));

test("titlul și tipul", () => {
  const h = documentInHtml("# Reamintiri pentru clinică\n\nText.", "propunere");
  assert.match(h, /<header class="cap">[\s\S]*Reamintiri pentru clinică[\s\S]*Propunere/);
});

test("tipul în cuvinte la pornire și folosire", () => {
  assert.match(documentInHtml("# T", "pornire"), /Instrucțiuni de pornire/);
  assert.match(documentInHtml("# T", "folosire"), /Instrucțiuni de folosire/);
});

test("foile numerotate doar la pornire și folosire", () => {
  const md = "# T\n\n## Primul\n\nA\n\n## Al doilea\n\nB";
  assert.equal((documentInHtml(md, "pornire").match(/class="foaie"/g) || []).length, 2);
  assert.match(documentInHtml(md, "pornire"), /pasul 2/);
  assert.doesNotMatch(documentInHtml(md, "propunere"), /pasul 1/);
  assert.equal((documentInHtml(md, "propunere").match(/class="foaie"/g) || []).length, 2);
});

test("textul de dinaintea primei foi rămâne, în afara foilor", () => {
  const h = documentInHtml("# T\n\nIntro.\n\n## Primul\n\nA", "pornire");
  assert.match(h, /Intro\.[\s\S]*<section class="foaie">/);
});

test("schema pașilor, cu text escapat", () => {
  const h = documentInHtml("# T\n\n```schema\nVine un formular\nSe scrie în <Sheets>\n```", "propunere");
  assert.match(h, /<ol class="schema">\s*<li>Vine un formular<\/li>\s*<li>Se scrie în &lt;Sheets&gt;<\/li>/);
});

test("Atenție", () =>
  assert.match(documentInHtml("# T\n\n> **Atenție:** nu șterge rândul.", "folosire"), /<aside class="atentie">[\s\S]*nu șterge rândul/));

test("un citat obișnuit rămâne citat", () =>
  assert.match(documentInHtml("# T\n\n> Doar un citat.", "folosire"), /<blockquote>/));

test("cuvântul-cheie", () =>
  assert.match(documentInHtml("# T\n\nMerge ==singur==.", "propunere"), /<em class="cheie">singur<\/em>/));

test("cuvântul-cheie și în titlu", () =>
  assert.match(documentInHtml("# Merge ==singur==", "propunere"), /<h1>Merge <em class="cheie">singur<\/em><\/h1>/));

test("tabele", () => assert.match(documentInHtml("# T\n\n| a | b |\n|---|---|\n| 1 | 2 |", "propunere"), /<table>/));

test("refuză sedila", () => assert.throws(() => documentInHtml("# Aplicaţie", "propunere"), /sedil/));
test("refuză schema goală", () => assert.throws(() => documentInHtml("# T\n\n```schema\n```", "propunere"), /schema/));
test("refuză tip necunoscut", () => assert.throws(() => documentInHtml("# T", "oferta"), /propunere, pornire, folosire/));
test("refuză fără titlu", () => assert.throws(() => documentInHtml("Text.", "propunere"), /titlu/));
