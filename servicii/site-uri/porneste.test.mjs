import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { porneste, propuneSlug, valideazaSlug } from "./porneste.mjs";

/** O rădăcină temporară cu un șablon mic, ca a lui Portofoliu AC. */
function radacinaDeTest() {
  const radacina = mkdtempSync(join(tmpdir(), "porneste-"));
  const sablon = join(radacina, "servicii", "site-uri", "sablon");
  for (const d of ["lib", "node_modules", ".next"]) mkdirSync(join(sablon, d), { recursive: true });
  writeFileSync(
    join(sablon, "lib", "config.ts"),
    'const domeniu = "__DOMENIU__";\nexport const FIRMA = { nume: "__NUME_FIRMA__", slug: "__SLUG__", domeniu };\n',
  );
  writeFileSync(join(sablon, "package.json"), '{ "name": "__SLUG__-site" }\n');
  writeFileSync(join(sablon, "CLAUDE.md"), "# Site-ul __NUME_FIRMA__\n");
  writeFileSync(join(sablon, "node_modules", "x.js"), "");
  writeFileSync(join(sablon, ".next", "y"), "");
  // ca Portofoliu AC: identitatea git e pusă doar în depozitul rădăcinii, nu global
  execFileSync("git", ["-C", radacina, "init", "-q"]);
  execFileSync("git", ["-C", radacina, "config", "user.name", "Test Probă"]);
  execFileSync("git", ["-C", radacina, "config", "user.email", "proba@example.com"]);
  return radacina;
}

const git = (dir, ...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" });

test("propune slug", () => assert.equal(propuneSlug("Cafeneaua Colț"), "cafeneaua-colt"));
test("propune slug din semne ciudate", () => assert.equal(propuneSlug("  Salon „Ana & Ioana”! "), "salon-ana-ioana"));
test("slug greșit", () => assert.match(valideazaSlug("Cafeneaua Colț"), /cafeneaua-colt/));
test("slug cu cratimă la capăt", () => assert.notEqual(valideazaSlug("colt-"), null));
test("slug bun", () => assert.equal(valideazaSlug("cafeneaua-colt"), null));

test("copiază și înlocuiește", () => {
  const radacina = radacinaDeTest();
  const dest = porneste({ radacina, slug: "cafeneaua-colt", nume: "Cafeneaua Colț" });
  assert.equal(dest, join(radacina, "clienti", "cafeneaua-colt", "site", "cod"));
  const config = readFileSync(join(dest, "lib", "config.ts"), "utf8");
  assert.match(config, /Cafeneaua Colț/);
  assert.match(config, /"cafeneaua-colt"/);
  assert.match(config, /cafeneaua-colt\.ro/);
  for (const f of ["lib/config.ts", "package.json", "CLAUDE.md"]) {
    assert.doesNotMatch(readFileSync(join(dest, f), "utf8"), /__/, f);
  }
  assert.equal(existsSync(join(dest, "node_modules")), false);
  assert.equal(existsSync(join(dest, ".next")), false);
  assert.equal(git(dest, "log", "--oneline").trim().split("\n").length, 1);
  assert.equal(git(dest, "branch", "--show-current").trim(), "main");
  assert.equal(git(dest, "log", "-1", "--format=%an <%ae>").trim(), "Test Probă <proba@example.com>");
});

test("nu suprascrie un client existent", () => {
  const radacina = radacinaDeTest();
  const dest = porneste({ radacina, slug: "colt", nume: "Colț" });
  writeFileSync(join(dest, "lucrul-meu.txt"), "nu mă șterge");
  assert.throws(() => porneste({ radacina, slug: "colt", nume: "Alt nume" }), /există deja/);
  assert.equal(readFileSync(join(dest, "lucrul-meu.txt"), "utf8"), "nu mă șterge");
  assert.match(readFileSync(join(dest, "lib", "config.ts"), "utf8"), /"Colț"/);
});

test("slug greșit nu creează nimic", () => {
  const radacina = radacinaDeTest();
  assert.throws(() => porneste({ radacina, slug: "Cafeneaua Colț", nume: "Cafeneaua Colț" }), /cafeneaua-colt/);
  assert.equal(existsSync(join(radacina, "clienti")), false);
});

test("numele cu ghilimele și $ rămâne cod valid", () => {
  const radacina = radacinaDeTest();
  const nume = 'Bistro "La $& Ana"';
  const dest = porneste({ radacina, slug: "bistro-la-ana", nume });
  const config = readFileSync(join(dest, "lib", "config.ts"), "utf8");
  assert.ok(config.includes(`nume: ${JSON.stringify(nume)}`), config);
  assert.match(readFileSync(join(dest, "CLAUDE.md"), "utf8"), /Bistro "La \$& Ana"/);
});

test("domeniul dat", () => {
  const radacina = radacinaDeTest();
  const dest = porneste({ radacina, slug: "cafeneaua-colt", nume: "Cafeneaua Colț", domeniu: "colt.ro" });
  const config = readFileSync(join(dest, "lib", "config.ts"), "utf8");
  assert.match(config, /"colt\.ro"/);
  assert.doesNotMatch(config, /cafeneaua-colt\.ro/);
});
