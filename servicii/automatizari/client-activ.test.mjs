import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { citesteChei, activeaza, dezactiveaza } from "./client-activ.mjs";

/** O rădăcină temporară cu un .mcp.json inițial (sau fără, dacă `mcp` e null). */
function radacinaNoua(mcp = { mcpServers: { altceva: { command: "x" }, "n8n-docs": { command: "npx" } } }) {
  const r = mkdtempSync(join(tmpdir(), "client-activ-"));
  if (mcp) writeFileSync(join(r, ".mcp.json"), JSON.stringify(mcp, null, 2));
  return r;
}

function puneChei(r, slug, text) {
  const d = join(r, "clienti", slug, "automatizari");
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, ".chei.env"), text);
}

const citesteMcp = (r) => JSON.parse(readFileSync(join(r, ".mcp.json"), "utf8"));

test("citește cheile", () => {
  const c = citesteChei("# n8n\nN8N_API_URL=https://cafe.app.n8n.cloud/\nN8N_API_KEY=abc\n");
  assert.deepEqual(c, { N8N_API_URL: "https://cafe.app.n8n.cloud", N8N_API_KEY: "abc" });
});

test("citește și tokenul MCP, cu terminații Windows", () => {
  const c = citesteChei("N8N_API_URL=https://a.app.n8n.cloud\r\nN8N_API_KEY=k\r\nN8N_MCP_ACCESS_TOKEN=t\r\n");
  assert.deepEqual(c, { N8N_API_URL: "https://a.app.n8n.cloud", N8N_API_KEY: "k", N8N_MCP_ACCESS_TOKEN: "t" });
});

test("refuză cheie lipsă", () => assert.throws(() => citesteChei("N8N_API_URL=https://a.app.n8n.cloud"), /N8N_API_KEY/));
test("refuză cheie goală", () =>
  assert.throws(() => citesteChei("N8N_API_URL=https://a.app.n8n.cloud\nN8N_API_KEY="), /N8N_API_KEY/));
test("refuză adresa fără https", () =>
  assert.throws(() => citesteChei("N8N_API_URL=http://a.app.n8n.cloud\nN8N_API_KEY=x"), /https/));

test("activează un singur client și păstrează celelalte servere", () => {
  const r = radacinaNoua();
  puneChei(r, "cafe", "N8N_API_URL=https://cafe.app.n8n.cloud\nN8N_API_KEY=abc\n");
  puneChei(r, "salon", "N8N_API_URL=https://salon.app.n8n.cloud\nN8N_API_KEY=def\n");

  assert.equal(activeaza({ radacina: r, slug: "cafe" }), "n8n-cafe");
  let m = citesteMcp(r);
  assert.deepEqual(Object.keys(m.mcpServers), ["altceva", "n8n-cafe"]);
  assert.equal(m.mcpServers["n8n-cafe"].env.N8N_API_KEY, "abc");
  assert.deepEqual(m.mcpServers.altceva, { command: "x" });

  activeaza({ radacina: r, slug: "salon" });
  m = citesteMcp(r);
  assert.deepEqual(Object.keys(m.mcpServers), ["altceva", "n8n-salon"]);
  assert.equal(m.mcpServers["n8n-salon"].env.N8N_API_URL, "https://salon.app.n8n.cloud");
});

test("fără fișier de chei: eroare, .mcp.json neatins", () => {
  const r = radacinaNoua();
  const inainte = readFileSync(join(r, ".mcp.json"), "utf8");
  assert.throws(() => activeaza({ radacina: r, slug: "lipsa" }), /\.chei\.env/);
  assert.equal(readFileSync(join(r, ".mcp.json"), "utf8"), inainte);
});

test("chei greșite: eroare, .mcp.json neatins", () => {
  const r = radacinaNoua();
  puneChei(r, "cafe", "N8N_API_URL=http://cafe.app.n8n.cloud\nN8N_API_KEY=abc\n");
  const inainte = readFileSync(join(r, ".mcp.json"), "utf8");
  assert.throws(() => activeaza({ radacina: r, slug: "cafe" }), /https/);
  assert.equal(readFileSync(join(r, ".mcp.json"), "utf8"), inainte);
});

test("refuză slug-ul greșit", () => {
  const r = radacinaNoua();
  assert.throws(() => activeaza({ radacina: r, slug: "../cafe" }), /Slug/);
});

test("dezactivează → doar n8n-docs, fără chei", () => {
  const r = radacinaNoua();
  puneChei(r, "cafe", "N8N_API_URL=https://cafe.app.n8n.cloud\nN8N_API_KEY=abc\nN8N_MCP_ACCESS_TOKEN=tok\n");
  activeaza({ radacina: r, slug: "cafe" });
  assert.equal(citesteMcp(r).mcpServers["n8n-cafe"].env.N8N_MCP_ACCESS_TOKEN, "tok");
  dezactiveaza({ radacina: r });
  const text = readFileSync(join(r, ".mcp.json"), "utf8");
  assert.deepEqual(Object.keys(JSON.parse(text).mcpServers), ["altceva", "n8n-docs"]);
  assert.doesNotMatch(text, /abc|tok/);
});

test("fără .mcp.json: îl creează", () => {
  const r = radacinaNoua(null);
  dezactiveaza({ radacina: r });
  assert.ok(existsSync(join(r, ".mcp.json")));
  const m = citesteMcp(r);
  assert.deepEqual(Object.keys(m.mcpServers), ["n8n-docs"]);
  assert.deepEqual(m.mcpServers["n8n-docs"].args, ["-y", "n8n-mcp"]);
});
