#!/usr/bin/env node
// Curăță un flux n8n exportat, ca să devină model: fără ID-uri de cont, fără conturi conectate, fără date reale.
//   node servicii/automatizari/curata.mjs <sursă.json> <model>
// Scrie modele/<model>/flux.json și afișează ce date reale au rămas (de înlocuit de mână cu CONFIG_… sau @example.com).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { valideazaSlug } from "../site-uri/porneste.mjs";

const CHEI_SCOASE = ["id", "versionId", "meta", "pinData", "staticData", "tags", "shared"];

/** O copie a fluxului, fără ce leagă exportul de un cont n8n anume. */
export function curataFlux(flux) {
  const c = structuredClone(flux);
  for (const k of CHEI_SCOASE) delete c[k];
  c.active = false;
  for (const nod of c.nodes || []) {
    delete nod.webhookId;
    if (nod.credentials) {
      for (const tip of Object.keys(nod.credentials)) nod.credentials[tip] = { id: "", name: "DE_CONECTAT" };
    }
  }
  return c;
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const TELEFON = /(?:\+40|0040|\b0)[\s.]?7\d{2}[\s.]?\d{3}[\s.]?\d{3}\b/g;
const NGROK = /[\w.-]*ngrok[\w.-]*/g;
const TOKEN_IN_ADRESA = /[?&](?:token|api_key|apikey|key|access_token)=(?!\{\{)[^&\s"'{}]{6,}/gi;
const CHEIE_SK = /\bsk-[A-Za-z0-9_-]{16,}/g;
const CHEI_GOOGLE = /^(documentId|sheetId|folderId|fileId|parentId|driveId|calendar)$/i;
const ID_GOOGLE = /[a-zA-Z0-9_-]{25,}/;
const PERMISE = /@example\.(com|org|net)$/i;

/** Datele care par reale și au rămas în flux: e-mailuri, telefoane, ID-uri de tabele, adrese ngrok, chei, chat-uri. */
export function gasesteDateReale(flux) {
  const gasite = [];
  const vezi = (valoare, cheie, cale) => {
    if (typeof valoare === "string") {
      const inainte = gasite.length;
      for (const m of valoare.match(EMAIL) || []) if (!PERMISE.test(m)) gasite.push(`${cale}: e-mail ${m}`);
      for (const m of valoare.match(TELEFON) || []) gasite.push(`${cale}: telefon ${m}`);
      for (const m of valoare.match(NGROK) || []) gasite.push(`${cale}: adresă ngrok ${m}`);
      for (const m of valoare.match(TOKEN_IN_ADRESA) || []) gasite.push(`${cale}: token în adresă ${m}`);
      for (const m of valoare.match(CHEIE_SK) || []) gasite.push(`${cale}: cheie ${m.slice(0, 8)}…`);
      if (CHEI_GOOGLE.test(cheie) && !valoare.startsWith("=") && ID_GOOGLE.test(valoare) && !valoare.startsWith("CONFIG_")) {
        gasite.push(`${cale}: ID Google ${valoare}`);
      }
      if (/^chatId$/i.test(cheie) && /^-?\d{5,}$/.test(valoare.trim())) gasite.push(`${cale}: chat Telegram ${valoare}`);
      // un ID numeric lung scris liber (o notiță, un text): chat Telegram, cont, telefon fără prefix
      if (gasite.length === inainte) for (const m of valoare.match(/(?<![\w.$-])-?\d{9,}(?![\w.-])/g) || []) gasite.push(`${cale}: număr lung ${m}`);
    } else if (Array.isArray(valoare)) {
      valoare.forEach((v, i) => vezi(v, cheie, `${cale}[${i}]`));
    } else if (valoare && typeof valoare === "object") {
      // {__rl: true, value: "…"} ține valoarea sub cheia părintelui (documentId, sheetId…)
      for (const [k, v] of Object.entries(valoare)) vezi(v, valoare.__rl && k === "value" ? cheie : k, `${cale}.${k}`);
    }
  };
  vezi(flux, "", "flux");
  return gasite;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [sursa, model, tinta] = process.argv.slice(2);
  try {
    // copia pentru Drive: exportul unui client, fără date fixate, ID-uri și conturi (clauza GDPR, X.6)
    if (model === "--catre") {
      if (!sursa || !tinta) throw new Error("Folosire: node servicii/automatizari/curata.mjs <export.json> --catre <copie.json>");
      writeFileSync(tinta, JSON.stringify(curataFlux(JSON.parse(readFileSync(sursa, "utf8"))), null, 2) + "\n");
      console.log(`Scris: ${tinta} (fără date fixate; ID-urile de tabele și adresele clientului rămân)`);
      process.exit(0);
    }
    if (!sursa || !model) throw new Error("Folosire: node servicii/automatizari/curata.mjs <sursă.json> <model>  |  <export.json> --catre <copie.json>");
    const greseala = valideazaSlug(model);
    if (greseala) throw new Error(greseala.replace("Slug-ul", "Numele modelului"));
    const curat = curataFlux(JSON.parse(readFileSync(sursa, "utf8")));
    const dosar = join(dirname(fileURLToPath(import.meta.url)), "modele", model);
    mkdirSync(dosar, { recursive: true });
    writeFileSync(join(dosar, "flux.json"), JSON.stringify(curat, null, 2) + "\n");
    const gasite = gasesteDateReale(curat);
    console.log(`Scris: modele/${model}/flux.json`);
    console.log(gasite.length ? `De înlocuit de mână (${gasite.length}):\n  ${gasite.join("\n  ")}` : "Nicio dată reală găsită.");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
