import { test } from "node:test";
import assert from "node:assert/strict";
import { curataFlux, gasesteDateReale } from "./curata.mjs";

test("scoate ID-urile și conturile", () => {
  const c = curataFlux({ id: "x", versionId: "v", meta: { instanceId: "i" }, active: true, pinData: {},
    staticData: { a: 1 }, tags: [{ id: "t" }], shared: [{}],
    nodes: [{ name: "G", id: "uuid-nod", webhookId: "w", credentials: { googleSheetsOAuth2Api: { id: "7", name: "Gmail Andrei" } } }] });
  assert.equal(c.id, undefined); assert.equal(c.versionId, undefined); assert.equal(c.meta, undefined);
  assert.equal(c.pinData, undefined); assert.equal(c.staticData, undefined); assert.equal(c.tags, undefined); assert.equal(c.shared, undefined);
  assert.equal(c.active, false);
  assert.deepEqual(c.nodes[0].credentials, { googleSheetsOAuth2Api: { id: "", name: "DE_CONECTAT" } });
  assert.equal(c.nodes[0].webhookId, undefined);
  assert.equal(c.nodes[0].name, "G");
});

test("nu atinge originalul", () => {
  const f = { id: "x", nodes: [{ name: "G", webhookId: "w" }] };
  curataFlux(f);
  assert.equal(f.id, "x"); assert.equal(f.nodes[0].webhookId, "w");
});

test("găsește date reale", () => {
  const f = { nodes: [{ parameters: { to: "ion@gmail.com", text: "Sună la 0722 123 456", url: "https://abc.ngrok-free.dev/x" } }] };
  assert.equal(gasesteDateReale(f).length, 3);
});

test("găsește telefoane în forme diferite", () => {
  for (const t of ["+40722123456", "0040 722 123 456", "0722.123.456"]) {
    assert.equal(gasesteDateReale({ nodes: [{ parameters: { text: t } }] }).length, 1, t);
  }
});

test("găsește ID-ul unui tabel Google", () => {
  const f = { nodes: [{ parameters: { documentId: { __rl: true, value: "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdEF", mode: "id" } } }] };
  assert.equal(gasesteDateReale(f).length, 1);
});

test("găsește chei și tokenuri", () => {
  const f = { nodes: [{ parameters: {
    url: "https://api.apify.com/v2/acts/x/runs?token=apify_api_AbCdEf123456",
    key: "sk-proj-abcdefghijklmnopqrstuv",
    chatId: "123456789",
  } }] };
  assert.equal(gasesteDateReale(f).length, 3);
});

test("example.com e permis", () => assert.deepEqual(gasesteDateReale({ nodes: [{ parameters: { to: "client@example.com" } }] }), []));
test("CONFIG_ și expresiile sunt permise", () =>
  assert.deepEqual(gasesteDateReale({ nodes: [{ parameters: { documentId: "CONFIG_SHEET_ID", chatId: "={{ $json.chat_id }}", to: "CONFIG_EMAIL_ALERTE" } }] }), []));
