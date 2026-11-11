// Datele de test: conturile pe fiecare rol și lead-uri pe fiecare serviciu și sursă.
// Rulează DOAR pe proiectul de test (CRM_MEDIU=test și ref-ul de test). Rulat de mai multe ori, nu dublează nimic.
// Folosire (din crm/): npm run seed
import { cereBazaDeTest, conturi, curataUrme, fise, leaduri, numara, program } from "./date/baza.mjs";

cereBazaDeTest();
await curataUrme();
const ids = await conturi();
await leaduri(ids);
await program(ids);
await fise(ids);
const n = await numara(ids);
console.log(`Gata: ${n.conturi} conturi de test, ${n.leaduri} lead-uri, ${n.proiecte} proiecte.`);
process.exit(0); // pe Windows, fără asta Node se plânge la ieșire (libuv)
