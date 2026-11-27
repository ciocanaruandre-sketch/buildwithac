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

// ---------- programari: confirmare + verificare ----------
const ACUM = "2026-11-25T10:00:00+02:00";
const MS = Date.parse(ACUM);
const peste = (min) => new Date(MS + min * 60000).toISOString();
const ev = (o = {}) => ({
  id: "ev1", status: "confirmed", summary: "Tuns + barbă – Mihai Ionescu", description: "Telefon: 0722 123 456",
  start: { dateTime: "2026-11-27T12:30:00Z" }, end: { dateTime: "2026-11-27T13:20:00Z" },
  created: "2026-11-25T07:00:00Z", organizer: { email: "vlad@group.calendar.google.com" }, ...o,
});
const randuri = (lista) => (lista.length ? lista : [{}]).map((json) => ({ json }));
const noduriProgramari = ({ setari = {}, jurnal = [], nuTrimite = [] } = {}) => ({
  "Setări firmă": [{ json: { ...structuredClone(SETARI_DEMO), ...setari } }],
  Jurnal: randuri(jurnal),
  "Nu trimite": randuri(nuTrimite),
});
const confirmare = (evenimente, o = {}, acum = ACUM) =>
  ruleaza(cod("programari", "confirmare"), [{ json: {} }], { ...noduriProgramari(o), "Programare nouă": evenimente.map((json) => ({ json })) }, acum).map((i) => i.json);
const verificare = (evenimente, o = {}, acum = ACUM) =>
  ruleaza(cod("programari", "verificare"), evenimente.map((json) => ({ json })), noduriProgramari(o), acum).map((i) => i.json);
const DIACRITICE_SAU_SCUMPE = /[șțăîâȘȚĂÎÂşţŞŢ„”“’–—…]/;

test("confirmare: SMS fără diacritice, cu prenumele, ziua și ora României și link-ul, într-un singur SMS (adresa e doar pe e-mail)", () => {
  const r = confirmare([ev()], { setari: { canal: "sms" } });
  assert.equal(r.length, 1);
  const m = r[0];
  assert.equal(m.trimite, true);
  assert.equal(m.tip, "confirmare");
  assert.equal(m.canal, "sms");
  assert.equal(m.contact, "+40722123456");
  assert.equal(m.eveniment_id, "ev1");
  assert.equal(m.ora_programare, "2026-11-27T12:30:00.000Z");
  for (const bucata of ["Mihai", "vineri, 27 noiembrie", "14:30", "https://exemplu.ro/programare"]) assert.ok(m.text.includes(bucata), `lipsește „${bucata}”: ${m.text}`);
  assert.ok(!DIACRITICE_SAU_SCUMPE.test(m.text), `SMS cu caractere care costă dublu: ${m.text}`);
  assert.ok(!m.text.includes("Str. Exemplu"), "decizia lui Andrei (2026-11-26): fără adresă în SMS-ul de confirmare, ca să fie un singur SMS");
  assert.ok(m.text.length <= 160, `${m.text.length} caractere: mai mult de un SMS`);
});

test("confirmare: canal „ambele” → SMS și e-mail; e-mailul are subiect și nu are link de dezabonare", () => {
  const r = confirmare([ev({ description: "Telefon: 0722 123 456\nEmail: Mihai@Exemplu.ro" })]);
  assert.deepEqual(r.map((m) => m.canal).sort(), ["email", "sms"]);
  const e = r.find((m) => m.canal === "email");
  assert.equal(e.contact, "mihai@exemplu.ro");
  assert.ok(e.subiect && e.subiect.length > 5);
  assert.ok(e.text.includes("Mihai") && e.text.includes("14:30"));
  assert.ok(e.text.includes("Str. Exemplu 12"), "adresa e pe e-mail");
  assert.ok(!e.text.includes("dezabonare"), "confirmarea e despre programare: fără link de dezabonare");
});

test("confirmare: telefonul scris oricum în descriere", () => {
  for (const descriere of ["tel: +40 722-123-456", "TELEFON:0040722123456", "Client fidel\n0722.123.456"]) {
    assert.equal(confirmare([ev({ description: descriere })], { setari: { canal: "sms" } })[0].contact, "+40722123456", descriere);
  }
});

test("confirmare: descrierea scrisă în Google Calendar ca HTML", () => {
  const descriere = 'Telefon: 0722 123 456<br>Email: <a href="mailto:mihai@exemplu.ro" target="_blank">mihai@exemplu.ro</a>';
  assert.deepEqual(confirmare([ev({ description: descriere })]).map((m) => m.contact).sort(), ["+40722123456", "mihai@exemplu.ro"]);
});

test("confirmare: după schimbarea orei (29 martie 2027), ora rămâne a României", () => {
  const r = confirmare([ev({ start: { dateTime: "2027-03-29T07:00:00Z" } })], { setari: { canal: "sms" } }, "2027-03-28T10:00:00+02:00");
  assert.ok(r[0].text.includes("10:00"), r[0].text);
  assert.ok(r[0].text.includes("luni, 29 martie"), r[0].text);
});

test("confirmare: fără telefon și e-mail → sărit, cu motivul", () => {
  const r = confirmare([ev({ description: "pauza de masa" })]);
  assert.equal(r.length, 1);
  assert.equal(r[0].trimite, false);
  assert.equal(r[0].motiv, "fara contact");
  assert.equal(r[0].tip, "sarit");
});

test("confirmare: contactul din „Nu trimite” e sărit", () => {
  const r = confirmare([ev()], { setari: { canal: "sms" }, nuTrimite: [{ contact: "+40722123456", data: "2026-11-01", sursa: "sms" }] });
  assert.equal(r.length, 1);
  assert.equal(r[0].trimite, false);
  assert.equal(r[0].motiv, "nu trimite");
});

test("confirmare: programarea din trecut, cea de o zi întreagă și cea deja confirmată nu primesc nimic", () => {
  assert.deepEqual(confirmare([ev({ start: { dateTime: "2026-11-20T12:30:00Z" } })]), []);
  assert.deepEqual(confirmare([ev({ start: { date: "2026-11-27" }, end: { date: "2026-11-28" } })]), []);
  const jurnal = [{ data: "2026-11-25 09:00", model: "programari", tip: "confirmare", eveniment_id: "ev1", ora_programare: "2026-11-27T12:30:00.000Z", contact: "+40722123456", canal: "sms", stare: "trimis" }];
  assert.deepEqual(confirmare([ev()], { setari: { canal: "sms" }, jurnal }), []);
});

const evVerif = (startMin, createdMin, o = {}) => ev({ start: { dateTime: peste(startMin) }, end: { dateTime: peste(startMin + 50) }, created: peste(createdMin), om: "Vlad", ...o });
const randJurnal = (tip, ora, o = {}) => ({ data: "x", model: "programari", tip, eveniment_id: "ev1", ora_programare: ora, contact: "+40722123456", canal: "sms", stare: "trimis", ...o });

test("verificare: cu o zi înainte → reamintire_1, o singură dată", () => {
  const e = evVerif(23 * 60, -3 * 1440);
  const r = verificare([e], { setari: { canal: "sms" } });
  assert.equal(r.length, 1);
  assert.equal(r[0].tip, "reamintire_1");
  assert.equal(r[0].contact, "+40722123456");
  assert.ok(!DIACRITICE_SAU_SCUMPE.test(r[0].text), r[0].text);
  assert.ok(!r[0].text.includes("Str. Exemplu") && r[0].text.length <= 160, `un singur SMS, fără adresă (${r[0].text.length}): ${r[0].text}`);
  assert.deepEqual(verificare([e], { setari: { canal: "sms" }, jurnal: [randJurnal("reamintire_1", e.start.dateTime)] }), []);
});

test("verificare: cu 90 de minute înainte → reamintire_2", () => {
  const e = evVerif(90, -3 * 1440);
  const r = verificare([e], { setari: { canal: "sms" }, jurnal: [randJurnal("reamintire_1", e.start.dateTime)] });
  assert.equal(r.length, 1);
  assert.equal(r[0].tip, "reamintire_2");
  assert.ok(r[0].text.includes(new Date(e.start.dateTime).toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })), r[0].text);
});

test("verificare: programarea făcută cu puțin înainte nu primește reamintiri (are confirmarea)", () => {
  assert.deepEqual(verificare([evVerif(20 * 60, -60)], { setari: { canal: "sms" } }), []);
  assert.deepEqual(verificare([evVerif(100, -10)], { setari: { canal: "sms" } }), []);
});

test("verificare: programarea mutată → anunțul cu ora nouă, o singură dată", () => {
  const e = evVerif(30 * 60, -3 * 1440);
  const jurnal = [randJurnal("confirmare", "2026-11-26T09:00:00.000Z")];
  const r = verificare([e], { setari: { canal: "sms" }, jurnal });
  assert.equal(r.length, 1);
  assert.equal(r[0].tip, "mutata");
  const { zi, ora } = { zi: "joi, 26 noiembrie", ora: "16:00" };
  assert.ok(r[0].text.includes(zi) && r[0].text.includes(ora), r[0].text);
  assert.deepEqual(verificare([e], { setari: { canal: "sms" }, jurnal: [...jurnal, randJurnal("mutata", e.start.dateTime)] }), []);
});

test("verificare: evenimentul de o zi întreagă și cel anulat sunt ignorate, fără eroare", () => {
  assert.deepEqual(verificare([ev({ start: { date: "2026-11-26" }, end: { date: "2026-11-27" }, summary: "Concediu" })]), []);
  assert.deepEqual(verificare([evVerif(23 * 60, -3 * 1440, { status: "cancelled" })]), []);
});

test("verificare: „reamintiri: nu” oprește reamintirile și anunțul de mutare", () => {
  const jurnal = [randJurnal("confirmare", "2026-11-26T09:00:00.000Z")];
  assert.deepEqual(verificare([evVerif(23 * 60, -3 * 1440), evVerif(30 * 60, -3 * 1440, { id: "ev2" })], { setari: { reamintiri: "nu", canal: "sms" }, jurnal }), []);
});

test("verificare: fără contact → un singur rând „sarit”, nu la fiecare rulare", () => {
  const e = evVerif(23 * 60, -3 * 1440, { description: "" });
  const r = verificare([e], { setari: { canal: "sms" } });
  assert.equal(r.length, 1);
  assert.equal(r[0].trimite, false);
  assert.equal(r[0].motiv, "fara contact");
  assert.deepEqual(verificare([e], { setari: { canal: "sms" }, jurnal: [randJurnal("sarit", e.start.dateTime, { contact: "" })] }), []);
});

test("verificare: omul se află din calendar, când nu vine scris pe eveniment", () => {
  const e = evVerif(23 * 60, -3 * 1440, { om: undefined, organizer: { email: "radu@group.calendar.google.com" } });
  assert.equal(verificare([e], { setari: { canal: "sms" } })[0].om, "Radu");
});

test("funcțiile comune (telefonRo, citesteContact, faraDiacritice, oraRo) au același text în toate fișierele cod/", () => {
  const INCEPUT = "// ---------- comune", SFARSIT = "// ---------- sfârșitul celor comune";
  const blocuri = cuCod.flatMap((m) => readdirSync(join(MODELE, m, "cod")).filter((f) => f.endsWith(".js"))
    .map((f) => ({ f: `${m}/cod/${f}`, t: readFileSync(join(MODELE, m, "cod", f), "utf8").replace(/\r\n/g, "\n") }))
    .filter(({ t }) => t.includes(INCEPUT)).map(({ f, t }) => ({ f, b: t.slice(t.indexOf(INCEPUT), t.indexOf(SFARSIT)) })));
  assert.ok(blocuri.length >= 2, "măcar două fișiere au funcțiile comune");
  for (const nume of ["telefonRo", "citesteContact", "faraDiacritice", "oraRo"]) assert.ok(blocuri[0].b.includes(`const ${nume} =`), nume);
  for (const { f, b } of blocuri.slice(1)) assert.equal(b, blocuri[0].b, `${f} are alt text la funcțiile comune decât ${blocuri[0].f}`);
});

test("SMS-urile de confirmare, reamintire_1 și mutare încap într-un SMS și cu datele demo (nume, link și zi lungi), în ambele tonuri", () => {
  const lung = { firma_nume: "Conu' Leonida", link_programare: "https://buildwithac.ro/concepte/frizerie/", canal: "sms" };
  const e = ev({ summary: "Tuns și barbă – Mihai Ionescu", start: { dateTime: "2026-11-28T08:30:00Z" }, created: "2026-11-20T08:00:00Z", om: "Vlad" });
  for (const ton of ["prietenos", "elegant"]) {
    const setari = { ...lung, ton };
    const sms = [
      ...confirmare([e], { setari }, "2026-11-20T10:00:00+02:00"),
      ...verificare([e], { setari }, "2026-11-27T11:00:00+02:00"),
      ...verificare([{ ...e, start: { dateTime: "2026-11-29T10:00:00Z" } }], { setari, jurnal: [randJurnal("confirmare", "2026-11-28T08:30:00.000Z")] }, "2026-11-27T10:00:00+02:00"),
    ];
    assert.deepEqual(sms.map((m) => m.tip), ["confirmare", "reamintire_1", "mutata"], ton);
    for (const m of sms) assert.ok(m.text.length <= 160, `${ton}, ${m.tip}: ${m.text.length} caractere: ${m.text}`);
  }
});

// ---------- programari, partea 2: cererea de recenzie (în verificare.js) ----------
// o programare de 30 de minute care s-a terminat acum `minute` minute
const evTrecut = (minute, o = {}) => ev({ start: { dateTime: peste(-minute - 30) }, end: { dateTime: peste(-minute) }, created: peste(-minute - 5 * 1440), om: "Vlad", ...o });
const CU_EMAIL = { description: "Telefon: 0722 123 456\nEmail: Mihai@Exemplu.ro" };

test("recenzie: la 2 ore după programare → cererea, pe SMS (fără diacritice, cu STOP) și pe e-mail (cu link de dezabonare)", () => {
  const r = verificare([evTrecut(150, CU_EMAIL)]);
  assert.deepEqual(r.map((m) => `${m.tip}/${m.canal}`).sort(), ["recenzie/email", "recenzie/sms"]);
  const sms = r.find((m) => m.canal === "sms"), email = r.find((m) => m.canal === "email");
  assert.equal(sms.trimite, true);
  assert.ok(sms.text.includes("https://g.page/r/exemplu/review"), sms.text);
  assert.ok(/STOP/.test(sms.text), sms.text);
  assert.ok(!DIACRITICE_SAU_SCUMPE.test(sms.text), sms.text);
  assert.ok(email.subiect && email.text.includes("https://g.page/r/exemplu/review"), email.text);
  assert.ok(email.text.includes("https://exemplu.app.n8n.cloud/webhook/dezabonare?c=" + b64("mihai@exemplu.ro")), email.text);
});

test("recenzie: prea devreme (acum o oră) sau prea târziu (acum 26 de ore) → nimic", () => {
  assert.deepEqual(verificare([evTrecut(60)]), []);
  assert.deepEqual(verificare([evTrecut(26 * 60)]), []);
});

test("recenzie: cine n-a venit (marcat cu roșu sau cu „NU A VENIT” în titlu) nu primește cererea", () => {
  assert.deepEqual(verificare([evTrecut(150, { colorId: "11" })]), []);
  assert.deepEqual(verificare([evTrecut(150, { summary: "NU A VENIT – Tuns – Mihai" })]), []);
  assert.deepEqual(verificare([evTrecut(150, { summary: "nu a venit tuns mihai" })]), []);
  assert.equal(verificare([evTrecut(150, { colorId: "5" })]).length, 1, "altă culoare nu înseamnă neprezentare");
});

test("recenzie: același client o primește cel mult o dată la 90 de zile", () => {
  const alta = (zile) => randJurnal("recenzie", peste(-zile * 1440), { eveniment_id: "ev-vechi" });
  assert.deepEqual(verificare([evTrecut(150)], { jurnal: [alta(30)] }), []);
  assert.deepEqual(verificare([evTrecut(150)], { jurnal: [alta(100)] }).map((m) => m.tip), ["recenzie"]);
});

test("recenzie: o singură dată pe programare", () => {
  const e = evTrecut(150);
  assert.deepEqual(verificare([e], { jurnal: [randJurnal("recenzie", e.start.dateTime)] }), []);
});

test("recenzie: a doua cerere, doar dacă e pornită (recenzie_a_doua_zile), la N zile după prima", () => {
  const e = evTrecut(3 * 1440 + 120 + 60);
  const jurnal = [randJurnal("recenzie", e.start.dateTime)];
  assert.deepEqual(verificare([e], { setari: { recenzie_a_doua_zile: 3 }, jurnal }).map((m) => m.tip), ["recenzie_2"]);
  assert.deepEqual(verificare([e], { setari: { recenzie_a_doua_zile: 0 }, jurnal }), []);
  assert.deepEqual(verificare([e], { setari: { recenzie_a_doua_zile: 3 }, jurnal: [...jurnal, randJurnal("recenzie_2", e.start.dateTime)] }), []);
  assert.deepEqual(verificare([e], { setari: { recenzie_a_doua_zile: 3 } }), [], "fără prima cerere, nici a doua");
});

test("recenzie: „recenzie: nu” o oprește; „reamintiri: nu” n-o oprește", () => {
  assert.deepEqual(verificare([evTrecut(150)], { setari: { recenzie: "nu" } }), []);
  assert.deepEqual(verificare([evTrecut(150)], { setari: { reamintiri: "nu" } }).map((m) => m.tip), ["recenzie"]);
});

test("recenzie: contactul din „Nu trimite” e sărit", () => {
  const r = verificare([evTrecut(150)], { nuTrimite: [{ contact: "0722123456", data: "x", sursa: "sms" }] });
  assert.equal(r.length, 1);
  assert.equal(r[0].trimite, false);
  assert.equal(r[0].motiv, "nu trimite");
});

test("recenzie: SMS-ul încape într-un SMS cu un link Google adevărat, în ambele tonuri", () => {
  for (const ton of ["prietenos", "elegant"]) {
    const setari = { ton, firma_nume: "Conu' Leonida", link_recenzie: "https://g.page/r/CQx7aBcDeFgHiJkLmNoPq12EAE/review", recenzie_a_doua_zile: 3 };
    const e = evTrecut(3 * 1440 + 180, { summary: "Tuns și barbă – Mihai Ionescu" });
    const unu = verificare([evTrecut(150, { summary: "Tuns și barbă – Mihai Ionescu" })], { setari })[0];
    const doi = verificare([e], { setari, jurnal: [randJurnal("recenzie", e.start.dateTime)] })[0];
    for (const m of [unu, doi]) assert.ok(m.text.length <= 160, `${ton}, ${m.tip}: ${m.text.length} caractere: ${m.text}`);
  }
});

// ---------- raspuns-primul-minut: verifică cererea + mesajul fix ----------
// Intrarea e ce dă nodul Webhook: { body: { nume, telefon, email, cerere, mesaj, website } }.
const CERERE = { nume: "Mihai Ionescu", telefon: "0722 123 456", email: "Mihai@Exemplu.ro", cerere: "Mire și cavaleri de onoare", mesaj: "Suntem 5, sâmbătă dimineață.", website: "" };
const verificaCererea = (body, { setari = {}, cereri = [] } = {}, acum = ACUM) =>
  ruleaza(cod("raspuns-primul-minut", "verifica-cererea"), [{ json: { headers: {}, body } }], {
    "Setări firmă": [{ json: { ...structuredClone(SETARI_DEMO), ...setari } }],
    Cereri: randuri(cereri),
  }, acum).map((i) => i.json);

test("cerere: completă → ok, telefonul +407…, e-mailul mic, canalele după setări, data de acum", () => {
  const r = verificaCererea(CERERE);
  assert.equal(r.length, 1);
  const c = r[0];
  assert.equal(c.ok, true);
  assert.equal(c.telefon, "+40722123456");
  assert.equal(c.email, "mihai@exemplu.ro");
  assert.equal(c.nume, "Mihai Ionescu");
  assert.equal(c.prenume, "Mihai");
  assert.equal(c.cerere, "Mire și cavaleri de onoare");
  assert.equal(c.data, new Date(MS).toISOString());
  assert.deepEqual(c.canale, [{ canal: "sms", contact: "+40722123456" }, { canal: "email", contact: "mihai@exemplu.ro" }]);
  assert.deepEqual(verificaCererea(CERERE, { setari: { canal: "email" } })[0].canale, [{ canal: "email", contact: "mihai@exemplu.ro" }]);
  assert.deepEqual(verificaCererea({ ...CERERE, email: "" }, { setari: { canal: "email" } })[0].canale, [{ canal: "sms", contact: "+40722123456" }], "fără canalul cerut → celălalt");
});

test("cerere: merge și cu corpul direct (fără „body”)", () => {
  const r = ruleaza(cod("raspuns-primul-minut", "verifica-cererea"), [{ json: CERERE }], { "Setări firmă": [{ json: structuredClone(SETARI_DEMO) }], Cereri: randuri([]) }, ACUM);
  assert.equal(r[0].json.ok, true);
});

test("cerere: capcana completată → ok: false, motiv capcana", () => {
  const c = verificaCererea({ ...CERERE, website: "https://spam.ro" })[0];
  assert.equal(c.ok, false);
  assert.equal(c.motiv, "capcana");
});

test("cerere: fără telefon bun și fără e-mail bun → ok: false, motiv fara contact", () => {
  for (const body of [{ ...CERERE, telefon: "", email: "" }, { ...CERERE, telefon: "123", email: "nu-e-email" }]) {
    const c = verificaCererea(body)[0];
    assert.equal(c.ok, false);
    assert.equal(c.motiv, "fara contact");
  }
});

test("cerere: același telefon sau e-mail are deja o cerere azi (ora României) → limita; ieri → ok", () => {
  const azi = { data: "2026-11-25T06:00:00.000Z", nume: "X", telefon: "+40722123456", email: "", cerere: "x", stare: "trimis" }; // 08:00 în România
  assert.equal(verificaCererea(CERERE, { cereri: [azi] })[0].motiv, "limita");
  assert.equal(verificaCererea(CERERE, { cereri: [{ ...azi, telefon: "", email: "MIHAI@exemplu.ro" }] })[0].motiv, "limita");
  // 21:30Z pe 24 = 23:30 pe 24 în România → ieri.
  const ieri = { ...azi, data: "2026-11-24T21:30:00.000Z" };
  assert.equal(verificaCererea(CERERE, { cereri: [ieri] })[0].ok, true);
  // 00:30 azi în România = 22:30Z ieri în UTC → tot „azi”.
  const dupaMiezulNoptii = { ...azi, data: "2026-11-24T22:30:00.000Z" };
  assert.equal(verificaCererea(CERERE, { cereri: [dupaMiezulNoptii] })[0].motiv, "limita");
});

test("cerere: textele lungi se taie (mesaj 1.000, cerere 200, nume 100)", () => {
  const c = verificaCererea({ ...CERERE, mesaj: "a".repeat(5000), cerere: "b".repeat(500), nume: "c".repeat(300) })[0];
  assert.equal(c.ok, true);
  assert.equal(c.mesaj.length, 1000);
  assert.equal(c.cerere.length, 200);
  assert.equal(c.nume.length, 100);
});

test("cerere: contactul din „Nu trimite” primește tot răspunsul (e răspunsul la cererea lui)", () => {
  const src = cod("raspuns-primul-minut", "verifica-cererea");
  assert.ok(!/\$\(\s*['"]Nu trimite/.test(src), "verifica-cererea nu citește „Nu trimite”");
  assert.equal(verificaCererea(CERERE)[0].ok, true);
});

const mesajFix = (cerere, setari = {}) =>
  ruleaza(cod("raspuns-primul-minut", "mesaj-fix"), [{ json: { error: "AI căzut" } }], {
    "Setări firmă": [{ json: { ...structuredClone(SETARI_DEMO), ...setari } }],
    "Verifică cererea": [{ json: verificaCererea(cerere, { setari })[0] }],
  }, ACUM).map((i) => i.json);

test("mesaj fix: câte un mesaj pe canal, cu numele, cererea, link-ul de programare și firma, varianta fix", () => {
  for (const ton of ["prietenos", "elegant"]) {
    const r = mesajFix(CERERE, { ton });
    assert.deepEqual(r.map((m) => m.canal), ["sms", "email"]);
    for (const m of r) {
      assert.equal(m.trimite, true);
      assert.equal(m.varianta, "fix");
      for (const bucata of ["Mihai", "https://exemplu.ro/programare", "Conu' Leonida"]) assert.ok(m.text.includes(bucata), `${ton}/${m.canal}: lipsește „${bucata}”: ${m.text}`);
    }
    const e = r.find((m) => m.canal === "email");
    assert.ok(e.text.includes("Mire și cavaleri de onoare"), e.text);
    assert.ok(e.subiect && e.subiect.includes("Conu' Leonida"), e.subiect);
    assert.equal(e.contact, "mihai@exemplu.ro");
    const s = r.find((m) => m.canal === "sms");
    assert.ok(s.text.includes("Mire si cavaleri de onoare"), s.text);
    assert.equal(s.contact, "+40722123456");
  }
});

test("mesaj fix: SMS-ul fără diacritice și sub 300 de caractere, chiar cu cerere de 200 și nume lung", () => {
  for (const ton of ["prietenos", "elegant"]) {
    const s = mesajFix({ ...CERERE, cerere: "ș".repeat(200), nume: "Ștefan-Cătălin Țărănescu-Bălănescu" }, { ton, canal: "sms" })[0];
    assert.ok(!DIACRITICE_SAU_SCUMPE.test(s.text), s.text);
    assert.ok(s.text.length < 300, `${ton}: ${s.text.length} caractere`);
  }
});
