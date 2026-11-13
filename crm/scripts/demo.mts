// Spațiul demo: golește baza de TEST și o umple din nou (firma demo + datele de test), bună de filmat.
// Folosire (din crm/): npm run demo           — echipa întreagă (Mara, Vlad, Ioana, Radu)
//                      npm run demo -- --singur — totul e al lui Andrei (Admin), ca la început
// Refuză orice bază în afară de cea de test, înainte de orice scriere.
import { cereBazaDeTest, conturi, fise, golesteTot, leaduri, numara, program, stergeConturiTemporare } from "./date/baza.mjs";
import { programDemo, scrieClientiDemo, scrieLeaduriDemo, scrieProcenteBaza } from "./date/demo-scrie.mjs";

cereBazaDeTest();
const o = { acum: new Date(), singur: process.argv.includes("--singur") };
await golesteTot();
await stergeConturiTemporare();
const ids = await conturi();
// firma demo întâi: leaduri() pune datele de test cu data de acum, deci acestea stau primele în listă
// procentele de bază înaintea lead-urilor: clienții (și proiectele lor) se nasc din lead-urile „client”
await scrieProcenteBaza();
const demo = await scrieLeaduriDemo(o, ids);
const proiecteDemo = await scrieClientiDemo(o, ids);
// datele de test (pentru e2e) sunt împărțite pe echipă: cu --singur nu se pun, ca echipa să nu apară nicăieri
if (!o.singur) {
  await leaduri(ids);
  await program(ids);
}
await programDemo(o, ids);
if (!o.singur) await fise(ids);
const n = await numara(ids);
console.log(`Gata: firma demo${o.singur ? " (singur)" : ""}, ${demo.length} lead-uri demo, ${proiecteDemo} proiecte demo; în total ${n.leaduri} lead-uri, ${n.proiecte} proiecte, ${n.conturi} conturi.`);
process.exit(0); // pe Windows, fără asta Node se plânge la ieșire (libuv)
