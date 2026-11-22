import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gasesteDateReale } from "./curata.mjs";

const MODELE = join(dirname(fileURLToPath(import.meta.url)), "modele");
const ASTEPTATE = [
  "imobiliare-lead-uri", "clinica-wf1-programari", "clinica-wf2-raspunsuri", "clinica-wf3-rechemari",
  "clinica-wf4-neprezentari", "carusele-instagram", "flux-erori",
];

test("toate modelele există, cu README", () => {
  assert.ok(existsSync(join(MODELE, "README.md")), "modele/README.md");
  for (const m of ASTEPTATE) {
    assert.ok(existsSync(join(MODELE, m, "flux.json")), `${m}/flux.json`);
    assert.ok(existsSync(join(MODELE, m, "README.md")), `${m}/README.md`);
  }
});

const modele = existsSync(MODELE) ? readdirSync(MODELE).filter((d) => existsSync(join(MODELE, d, "flux.json"))) : [];
for (const m of modele) {
  test(`modelul ${m} e curat`, () => {
    const flux = JSON.parse(readFileSync(join(MODELE, m, "flux.json"), "utf8"));
    assert.equal(flux.active, false);
    for (const k of ["id", "versionId", "meta", "pinData", "staticData", "tags", "shared"]) assert.equal(flux[k], undefined, k);
    for (const n of flux.nodes) {
      assert.equal(n.webhookId, undefined, `webhookId în ${n.name}`);
      for (const c of Object.values(n.credentials || {})) assert.deepEqual(c, { id: "", name: "DE_CONECTAT" }, n.name);
    }
    assert.deepEqual(gasesteDateReale(flux), []);
    const text = readFileSync(join(MODELE, m, "flux.json"), "utf8") + readFileSync(join(MODELE, m, "README.md"), "utf8");
    assert.doesNotMatch(text, /[ŞşŢţ]/, "sedilă: folosește ș și ț cu virgulă");
  });
}

test("modelul clinicii WF3 nu trimite date ale pacienților la AI", () => {
  const flux = JSON.parse(readFileSync(join(MODELE, "clinica-wf3-rechemari", "flux.json"), "utf8"));
  assert.ok(!flux.nodes.some((n) => /langchain|openAi/i.test(n.type)), "un nod AI a rămas în WF3");
});

test("fluxul de erori merge și când pică declanșatorul (fără execution, cu trigger.error)", () => {
  const flux = JSON.parse(readFileSync(join(MODELE, "flux-erori", "flux.json"), "utf8"));
  const mail = flux.nodes.find((n) => n.type === "n8n-nodes-base.gmail");
  const text = mail.parameters.message + mail.parameters.subject;
  assert.match(text, /\$json\.trigger\?\.error/);
  assert.doesNotMatch(text, /\$json\.execution\.(?!\?)/, "folosește $json.execution?.… (lipsește când pică declanșatorul)");
});
