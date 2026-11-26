import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gasesteDateReale } from "./curata.mjs";

const MODELE = join(dirname(fileURLToPath(import.meta.url)), "modele");
const ASTEPTATE = [
  "imobiliare-lead-uri", "clinica-wf1-programari", "clinica-wf2-raspunsuri", "clinica-wf3-rechemari",
  "clinica-wf4-neprezentari", "carusele-instagram", "flux-erori",
  "setari-firma", "dezabonare", "programari", "raspuns-primul-minut", "asistent-site",
];

// toate fluxurile unui model: flux.json, flux-verificare.json, flux-confirmare.json…
export const fluxuriDin = (model) =>
  existsSync(join(MODELE, model)) && statSync(join(MODELE, model)).isDirectory()
    ? readdirSync(join(MODELE, model)).filter((f) => /^flux.*\.json$/.test(f))
        .map((fisier) => ({ fisier, flux: JSON.parse(readFileSync(join(MODELE, model, fisier), "utf8")) }))
    : [];

test("toate modelele există, cu README", () => {
  assert.ok(existsSync(join(MODELE, "README.md")), "modele/README.md");
  for (const m of ASTEPTATE) {
    assert.ok(fluxuriDin(m).length > 0, `${m}/flux*.json`);
    assert.ok(existsSync(join(MODELE, m, "README.md")), `${m}/README.md`);
  }
});

const modele = existsSync(MODELE) ? readdirSync(MODELE).filter((d) => fluxuriDin(d).length > 0) : [];
const fluxuri = modele.flatMap((m) => fluxuriDin(m).map((f) => ({ m, ...f })));
for (const { m, fisier, flux } of fluxuri) {
  test(`modelul ${m} (${fisier}) e curat`, () => {
    assert.equal(flux.active, false);
    for (const k of ["id", "versionId", "meta", "pinData", "staticData", "tags", "shared"]) assert.equal(flux[k], undefined, k);
    for (const n of flux.nodes) {
      assert.equal(n.webhookId, undefined, `webhookId în ${n.name}`);
      for (const c of Object.values(n.credentials || {})) assert.deepEqual(c, { id: "", name: "DE_CONECTAT" }, n.name);
    }
    assert.deepEqual(gasesteDateReale(flux), []);
    for (const n of flux.nodes.filter((n) => n.type === "n8n-nodes-base.googleSheets" && ["read", "get"].includes(n.parameters.operation))) {
      assert.notEqual(n.onError, "continueRegularOutput", `${n.name}: o eroare la citire trebuie să ajungă la fluxul de erori`);
    }
    const text = readFileSync(join(MODELE, m, fisier), "utf8") + readFileSync(join(MODELE, m, "README.md"), "utf8");
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

test("modelul clinicii WF4: confirmații prinși, limita de 10, ora României", () => {
  const flux = JSON.parse(readFileSync(join(MODELE, "clinica-wf4-neprezentari", "flux.json"), "utf8"));
  const cod = flux.nodes.filter((n) => n.type === "n8n-nodes-base.code").map((n) => n.parameters.jsCode).join("\n");
  assert.match(cod, /CONFIRMED/, "un pacient confirmat care n-a venit e tot neprezentare");
  assert.match(cod, /LIMITA = 10/, "peste 10 neprezentări într-o seară → niciun SMS");
  assert.match(cod, /Europe\/Bucharest/, "ziua de azi, după ora României");
  assert.ok(flux.nodes.some((n) => n.type === "n8n-nodes-base.if"), "protecția stă într-un nod IF, vizibil pe pânză");
});

const urmasiTwilio = (flux) => {
  const nume = new Set(flux.nodes.filter((n) => n.type === "n8n-nodes-base.twilio").map((n) => n.name));
  const urmasi = new Set();
  for (const [sursa, c] of Object.entries(flux.connections)) {
    if (nume.has(sursa)) for (const l of c.main.flat()) if (l) urmasi.add(l.node);
  }
  return flux.nodes.filter((n) => urmasi.has(n.name));
};

for (const { m, fisier, flux } of fluxuri) {
  test(`modelul ${m} (${fisier}): după SMS, datele pacientului nu se citesc din $json, scrierile nu ascund erorile`, () => {
    for (const n of urmasiTwilio(flux)) {
      // Twilio dă mai departe doar răspunsul lui (sid, status, error), nu rândul pacientului
      assert.doesNotMatch(JSON.stringify(n.parameters), /\$json\.(?!(sid|status|error)\b)/, `${n.name} citește $json după Twilio`);
    }
    for (const n of flux.nodes) {
      const scriere = n.type === "n8n-nodes-base.googleSheets" && ["append", "update", "appendOrUpdate"].includes(n.parameters.operation);
      const ai = /openAi|langchain/i.test(n.type);
      if (scriere || ai) assert.notEqual(n.onError, "continueRegularOutput", `${n.name}: eroarea trebuie să ajungă la fluxul de erori`);
      const jurnal = n.type === "n8n-nodes-base.googleSheets" && n.parameters.sheetName?.value === "Message_Log" && n.parameters.operation === "append";
      if (jurnal) assert.notEqual(n.parameters.columns?.value?.status, "sent", `${n.name}: starea din jurnal vine din răspunsul Twilio`);
    }
  });
}

test("modelul clinicii WF1: cererea de recenzie doar după COMPLETED (CONFIRMED nu înseamnă că a venit)", () => {
  const flux = JSON.parse(readFileSync(join(MODELE, "clinica-wf1-programari", "flux.json"), "utf8"));
  const iff = flux.nodes.find((n) => n.name === "IF A Venit");
  assert.doesNotMatch(JSON.stringify(iff.parameters), /CONFIRMED/);
});

const ruleaza = (cod, input, noduri = {}) =>
  new Function("$input", "$", cod)({ first: () => input[0], all: () => input }, (n) => ({ first: () => noduri[n][0], all: () => noduri[n] }));

test("modelul clinicii WF2: STOP câștigă în fața lui NU, iar 07… se potrivește cu +407…", () => {
  const flux = JSON.parse(readFileSync(join(MODELE, "clinica-wf2-raspunsuri", "flux.json"), "utf8"));
  const cod = (nume) => flux.nodes.find((n) => n.name === nume).parameters.jsCode;
  const parsat = ruleaza(cod("Parseaza Raspuns"), [{ json: { body: { Body: "Nu mai trimiteti, STOP", From: "+40712345678" } } }]);
  assert.equal(parsat[0].json.intent, "OPT_OUT");
  const gasit = ruleaza(cod("Gaseste Programare"),
    [{ json: { appointment_id: "A1", patient_id: "P1", name: "Ana", phone: "0712 345 678", status: "SCHEDULED", appointment_datetime: "2999-01-01T10:00:00" } }],
    { "Parseaza Raspuns": [{ json: { from: "+40712345678", intent: "CONFIRM" } }] });
  assert.equal(gasit[0].json.appointment_id, "A1");
});

test("fluxul de erori alertează și pe Telegram, fără să depindă de Google-ul clientului", () => {
  const flux = JSON.parse(readFileSync(join(MODELE, "flux-erori", "flux.json"), "utf8"));
  const tg = flux.nodes.find((n) => n.type === "n8n-nodes-base.telegram");
  assert.ok(tg, "lipsește nodul Telegram");
  assert.equal(tg.parameters.chatId, "CONFIG_TELEGRAM_CHAT_ID_ALERTE");
  assert.doesNotMatch(tg.parameters.text, /error/, "pe Telegram, fără mesajul erorii (poate conține date ale pacienților)");
  const dinTrigger = flux.connections["Error Trigger"].main[0].map((l) => l.node);
  for (const n of flux.nodes.filter((n) => n.type !== "n8n-nodes-base.errorTrigger")) {
    assert.ok(dinTrigger.includes(n.name), `${n.name} pornește direct din Error Trigger`);
    assert.equal(n.onError, "continueRegularOutput", `${n.name}: dacă un canal pică, celălalt pleacă oricum`);
  }
});

// ---------- programari (reamintirile, cererea de recenzie) ----------
const programari = fluxuriDin("programari");
const fluxProgramari = (fisier) => programari.find((f) => f.fisier === fisier)?.flux;
test("programari: fără AI (mesajele sunt fixe, din cod/)", { skip: !programari.length && "fluxurile nu sunt exportate încă" }, () => {
  for (const { flux } of programari) for (const n of flux.nodes) assert.doesNotMatch(n.type, /langchain|anthropic|openAi/i, n.name);
});
test("programari: flux-confirmare are câte un declanșator Calendar „eveniment creat”", { skip: !fluxProgramari("flux-confirmare.json") && "neexportat" }, () => {
  const d = fluxProgramari("flux-confirmare.json").nodes.filter((n) => n.type === "n8n-nodes-base.googleCalendarTrigger");
  assert.ok(d.length >= 1);
  for (const n of d) assert.equal(n.parameters.triggerOn, "eventCreated", n.name);
});
test("programari: citirea calendarelor desface programările recurente", { skip: !programari.length && "neexportat" }, () => {
  const citiri = programari.flatMap(({ flux }) => flux.nodes).filter((n) => n.type === "n8n-nodes-base.googleCalendar" && n.parameters.operation === "getAll");
  assert.ok(citiri.length >= 1, "niciun Google Calendar getAll");
  for (const n of citiri) assert.equal(n.parameters.options?.recurringEventHandling, "expand", n.name);
});
test("programari: Jurnal și Nu trimite se citesc o dată, iar o foaie goală nu oprește fluxul", { skip: !programari.length && "neexportat" }, () => {
  for (const { fisier, flux } of programari) {
    for (const nume of ["Jurnal", "Nu trimite"]) {
      const n = flux.nodes.find((x) => x.name === nume);
      assert.ok(n, `${fisier}: lipsește ${nume}`);
      assert.equal(n.executeOnce, true, `${fisier}: ${nume} executeOnce`);
      assert.equal(n.alwaysOutputData, true, `${fisier}: ${nume} alwaysOutputData (foaie goală = niciun item, codul n-ar rula)`);
    }
    assert.equal(flux.settings?.timezone, "Europe/Bucharest", fisier);
  }
});
