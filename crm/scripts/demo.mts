// Spațiul demo: golește baza de TEST și o umple din nou (firma demo + datele de test), bună de filmat.
// Folosire (din crm/): npm run demo           — echipa întreagă (Mara, Vlad, Ioana, Radu)
//                      npm run demo -- --singur — totul e al lui Andrei (Admin), ca la început
// Refuză orice bază în afară de cea de test, înainte de orice scriere.
import { cereBazaDeTest, conturi, fise, golesteTot, leaduri, numara, program } from "./date/baza.mjs";
import { programDemo, scrieLeaduriDemo } from "./date/demo-scrie.mjs";

cereBazaDeTest();
const o = { acum: new Date(), singur: process.argv.includes("--singur") };
await golesteTot();
const ids = await conturi();
// firma demo întâi: leaduri() pune datele de test cu data de acum, deci acestea stau primele în listă
const demo = await scrieLeaduriDemo(o, ids);
await leaduri(ids);
await program(ids);
await programDemo(o, ids);
await fise(ids);
const n = await numara(ids);
console.log(`Gata: firma demo${o.singur ? " (singur)" : ""}, ${demo.length} lead-uri demo; în total ${n.leaduri} lead-uri, ${n.proiecte} proiecte, ${n.conturi} conturi.`);
process.exit(0); // pe Windows, fără asta Node se plânge la ieșire (libuv)
