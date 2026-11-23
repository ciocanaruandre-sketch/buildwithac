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

// ---------- setari-firma ----------
const SETARI_DEMO = {
  firma_nume: "Conu' Leonida", firma_adresa: "Str. Exemplu 12, București", firma_telefon: "0722 000 000",
  program: { 0: null, 1: ["10:00", "20:00"], 2: ["10:00", "20:00"], 3: ["10:00", "20:00"], 4: ["10:00", "20:00"], 5: ["10:00", "20:00"], 6: ["10:00", "16:00"] },
  oameni: [
    { nume: "Vlad", calendar_id: "vlad@group.calendar.google.com", servicii: ["Tuns", "Tuns + barbă"] },
    { nume: "Radu", calendar_id: "radu@group.calendar.google.com", servicii: ["Tuns", "Barbă"] },
  ],
  servicii: [
    { nume: "Tuns", durata_min: 30, pret: "80 lei" },
    { nume: "Barbă", durata_min: 20, pret: "50 lei" },
    { nume: "Tuns + barbă", durata_min: 50, pret: "120 lei" },
  ],
  link_programare: "https://exemplu.ro/programare", link_recenzie: "https://g.page/r/exemplu/review", link_dezabonare: "https://exemplu.app.n8n.cloud/webhook/dezabonare",
  canal: "ambele", email_patron: "patron@exemplu.ro", telegram_chat_id: "", ton: "prietenos", sheet_id: "1AbC",
  reamintiri: "da", recenzie: "da", reamintire_1_min: 1440, reamintire_2_min: 120,
  recenzie_dupa_min: 120, recenzie_a_doua_zile: 0, recenzie_pauza_zile: 90,
  neprezentare_culoare: "11", neprezentare_titlu: "NU A VENIT",
  informatii_asistent: "Plata cash sau card. Nu avem parcare proprie.",
  model_ai_mesaj: "claude-haiku-5-5", model_ai_asistent: "claude-haiku-5-5",
};
const verifica = (s) => ruleaza(cod("setari-firma", "verifica-setarile"), [{ json: s }]);

test("setari-firma: setările complete trec neschimbate, ca un singur item", () => {
  const r = verifica(structuredClone(SETARI_DEMO));
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].json, SETARI_DEMO);
});

test("setari-firma: listele scrise ca text JSON (din câmpul Set) devin obiecte", () => {
  const s = { ...SETARI_DEMO, program: JSON.stringify(SETARI_DEMO.program), oameni: JSON.stringify(SETARI_DEMO.oameni), servicii: JSON.stringify(SETARI_DEMO.servicii) };
  assert.deepEqual(verifica(s)[0].json, SETARI_DEMO);
});

test("setari-firma: un câmp necompletat (CONFIG_…) oprește fluxul și își spune numele", () => {
  assert.throws(() => verifica({ ...SETARI_DEMO, firma_nume: "CONFIG_NUMELE_FIRMEI" }), /firma_nume/);
});

test("setari-firma: o listă stricată își spune numele", () => {
  assert.throws(() => verifica({ ...SETARI_DEMO, oameni: "[{nu e json" }), /oameni/);
});

test("setari-firma: un om cu un serviciu care nu e în lista de servicii", () => {
  const oameni = [{ ...SETARI_DEMO.oameni[0], servicii: ["Vopsit"] }];
  assert.throws(() => verifica({ ...SETARI_DEMO, oameni }), /Vopsit/);
});

test("setari-firma: canalul poate fi doar email, sms sau ambele", () => {
  assert.throws(() => verifica({ ...SETARI_DEMO, canal: "whatsapp" }), /canal/);
});

// ---------- dezabonare ----------
const dezabonare = (json) => ruleaza(cod("dezabonare", "dezabonare"), [{ json }]).map((i) => i.json);
const b64 = (s) => Buffer.from(s, "utf8").toString("base64url");

test("dezabonare: SMS „Stop” → telefonul intră în Nu trimite", () => {
  assert.deepEqual(dezabonare({ body: { Body: "Stop", From: "+40712345678" } }), [{ contact: "+40712345678", sursa: "sms" }]);
});

test("dezabonare: STOP în mijlocul frazei, telefonul scris cu 0040", () => {
  assert.deepEqual(dezabonare({ body: { Body: "nu mai trimiteti, STOP.", From: "0040712345678" } }), [{ contact: "+40712345678", sursa: "sms" }]);
});

test("dezabonare: „Dezabonare” și „dezabonez” merg; un mesaj obișnuit nu", () => {
  assert.equal(dezabonare({ body: { Body: "Dezabonare", From: "+40712345678" } }).length, 1);
  assert.equal(dezabonare({ body: { Body: "Vă rog să mă dezabonați, mă dezabonez", From: "0712 345 678" } })[0].contact, "+40712345678");
  assert.deepEqual(dezabonare({ body: { Body: "Mulțumesc, ne vedem joi", From: "+40712345678" } }), []);
});

test("dezabonare: link-ul din e-mail → adresa, cu litere mici", () => {
  assert.deepEqual(dezabonare({ query: { c: b64("Mihai@Exemplu.ro") } }), [{ contact: "mihai@exemplu.ro", sursa: "email" }]);
});

test("dezabonare: un link stricat nu scrie nimic", () => {
  assert.deepEqual(dezabonare({ query: { c: "%%%" } }), []);
  assert.deepEqual(dezabonare({ query: {} }), []);
});
