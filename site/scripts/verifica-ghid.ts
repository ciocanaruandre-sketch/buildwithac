// npm run verifica -- <slug> [--ciorna]   (fără slug: toate ghidurile care nu sunt de exemplu)
// --ciorna: înainte de previzualizare, capturile și coperta care lipsesc sunt doar avertismente
import path from "node:path";
import { incarcaGhiduri } from "@/lib/ghiduri";
import { verificaGhid } from "@/lib/verificare";

const argumente = process.argv.slice(2);
const ciorna = argumente.includes("--ciorna");
const slug = argumente.find((a) => !a.startsWith("--"));
let toate;
try {
  toate = incarcaGhiduri(undefined, { productie: false });
} catch (e) {
  console.error(`✗ Ghidurile nu se pot încărca: ${(e as Error).message}`);
  process.exit(1);
}
const alese = slug ? toate.filter((g) => g.slug === slug) : toate.filter((g) => !g.exemplu);
if (slug && !alese.length) {
  console.error(`✗ Nu există ghidul „${slug}” în content/ghiduri/.`);
  process.exit(1);
}
if (!alese.length) console.log("Niciun ghid adevărat de verificat.");

let cuErori = false;
for (const g of alese) {
  const probleme = verificaGhid(g, { dosarPublic: path.join(process.cwd(), "public"), ciorna });
  const erori = probleme.filter((p) => p.nivel === "eroare");
  const avertismente = probleme.filter((p) => p.nivel === "avertisment");
  console.log(`\n${g.slug}: ${erori.length} erori, ${avertismente.length} avertismente`);
  for (const p of erori) console.log(`  ✗ ${p.mesaj}`);
  for (const p of avertismente) console.log(`  ! ${p.mesaj}`);
  if (erori.length) cuErori = true;
}
process.exit(cuErori ? 1 : 0);
