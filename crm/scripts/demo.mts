// Spațiul demo: golește baza de TEST și o umple din nou (datele de test + firma demo), bună de filmat.
// Folosire (din crm/): npm run demo
// Refuză orice bază în afară de cea de test, înainte de orice scriere.
import { cereBazaDeTest, conturi, fise, golesteTot, leaduri, numara, program } from "./date/baza.mjs";

cereBazaDeTest();
await golesteTot();
const ids = await conturi();
// firma demo vine aici, ÎNAINTE de datele de test: leaduri() le pune pe acestea primele în listă
await leaduri(ids);
await program(ids);
await fise(ids);
const n = await numara(ids);
console.log(`Gata: firma demo e pe baza de test (${n.conturi} conturi, ${n.leaduri} lead-uri, ${n.proiecte} proiecte).`);
process.exit(0); // pe Windows, fără asta Node se plânge la ieșire (libuv)
