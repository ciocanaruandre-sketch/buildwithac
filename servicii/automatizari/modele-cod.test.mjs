// Codul din nodurile Code ale modelelor stă în modele/<model>/cod/<nume>.js și se testează aici.
// Fiecare fișier e corpul exact al nodului: același text e lipit în nodul Code din flux*.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MODELE = join(dirname(fileURLToPath(import.meta.url)), "modele");

// Rulează corpul unui nod Code (modul „Run Once for All Items”) cu $input, $(nume) și $now la ora `acum`.
export const ruleaza = (cod, input, noduri = {}, acum = new Date().toISOString()) => {
  const ms = Date.parse(acum);
  const $now = { toMillis: () => ms, toISO: () => acum };
  const $ = (nume) => {
    if (!(nume in noduri)) throw new Error(`nodul „${nume}” lipsește din test`);
    return { first: () => noduri[nume][0], all: () => noduri[nume] };
  };
  return new Function("$input", "$", "$now", cod)({ first: () => input[0], all: () => input }, $, $now);
};

export const cod = (model, nume) => readFileSync(join(MODELE, model, "cod", `${nume}.js`), "utf8");

const fluxuri = (model) =>
  readdirSync(join(MODELE, model)).filter((f) => /^flux.*\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(MODELE, model, f), "utf8")));

export const codDin = (model, fisierFlux, numeNod) => {
  const flux = JSON.parse(readFileSync(join(MODELE, model, fisierFlux), "utf8"));
  const nod = flux.nodes.find((n) => n.name === numeNod);
  if (!nod) throw new Error(`${model}/${fisierFlux}: lipsește nodul „${numeNod}”`);
  return nod.parameters.jsCode;
};

// „Verifică setările” → verifica-setarile
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

test("santinela: $now e ora dată, în milisecunde", () => {
  const r = ruleaza("return [{json:{t:$now.toMillis()}}]", [], {}, "2026-11-27T10:00:00+02:00");
  assert.equal(r[0].json.t, Date.parse("2026-11-27T08:00:00Z"));
});

// Regula: fiecare cod/<nume>.js e identic cu nodul Code al cărui nume dă <nume>.
const cuCod = existsSync(MODELE) ? readdirSync(MODELE).filter((m) => existsSync(join(MODELE, m, "cod"))) : [];
for (const m of cuCod) {
  const exista = readdirSync(join(MODELE, m)).some((f) => /^flux.*\.json$/.test(f));
  for (const f of readdirSync(join(MODELE, m, "cod")).filter((f) => f.endsWith(".js"))) {
    test(`${m}: nodul Code „${f}” e identic cu fișierul testat`, { skip: !exista && "fluxul nu e exportat încă" }, () => {
      const noduri = fluxuri(m).flatMap((fl) => fl.nodes).filter((n) => n.type === "n8n-nodes-base.code" && slug(n.name) === f.replace(/\.js$/, ""));
      assert.ok(noduri.length > 0, `niciun nod Code cu numele care dă „${f}”`);
      for (const n of noduri) assert.equal(n.parameters.jsCode.trim(), cod(m, f.replace(/\.js$/, "")).trim(), `${n.name} diferă de cod/${f}`);
    });
  }
}
