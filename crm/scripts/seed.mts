// Datele de test: conturile pe fiecare rol și lead-uri pe fiecare serviciu și sursă.
// Rulează DOAR pe proiectul de test (CRM_MEDIU=test). Rulat de mai multe ori, nu dublează nimic.
// Folosire (din crm/): npm run seed
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/baza.types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (process.env.CRM_MEDIU !== "test") {
  console.error("Seed-ul rulează doar pe proiectul de test (CRM_MEDIU=test). Oprit.");
  process.exit(1);
}
const parola = process.env.CRM_PAROLA_TEST;
if (!parola) throw new Error("Lipsește CRM_PAROLA_TEST din .env.local");

type Rol = Database["public"]["Enums"]["rol"];
type LeadNou = Database["public"]["Tables"]["lead_uri"]["Insert"];

const db = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CONTURI: { cont: string; nume: string; rol: Rol }[] = [
  { cont: "admin", nume: "Andrei Ciocănaru", rol: "admin" },
  { cont: "caller", nume: "Mara Ionescu", rol: "caller" },
  { cont: "caller2", nume: "Vlad Petrescu", rol: "caller" },
  { cont: "closer", nume: "Ioana Dumitru", rol: "closer" },
  { cont: "constructor", nume: "Radu Stan", rol: "constructor" },
];

async function conturi(): Promise<Record<string, string>> {
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const ids: Record<string, string> = {};
  for (const c of CONTURI) {
    const email = `${c.cont}@test.buildwithac.ro`;
    let id = data.users.find((u) => u.email === email)?.id;
    if (!id) {
      const r = await db.auth.admin.createUser({ email, password: parola, email_confirm: true });
      if (r.error) throw r.error;
      id = r.data.user.id;
    } else {
      // parola se poate schimba în .env.local: o aliniem
      await db.auth.admin.updateUserById(id, { password: parola, ban_duration: "none" });
    }
    const p = await db.from("profiluri").upsert({ id, nume: c.nume, email, rol: c.rol, activ: true });
    if (p.error) throw p.error;
    ids[c.cont] = id;
  }
  return ids;
}

const tel = (n: number) => `0700 000 0${String(n).padStart(2, "0")}`;
const norm = (n: number) => `407000000${String(n).padStart(2, "0")}`;
const peste = (ore: number) => new Date(Date.now() + ore * 3_600_000).toISOString();

async function leaduri(ids: Record<string, string>) {
  const L: (LeadNou & { nr: number; descriere?: string })[] = [
    { nr: 1, nume: "Elena Marin · Cafeneaua Boabe", serviciu: "site", sursa: "formular_site", descriere: "Vreau un site simplu pentru cafenea, cu meniul și programul." },
    { nr: 2, nume: "Cristian Popa · Salon Aura", serviciu: "automatizari", sursa: "reclama_tiktok", stare: "fara_raspuns", incercari: 2, caller_id: ids.caller },
    { nr: 3, nume: "Diana Georgescu · Clinica Zâmbet", serviciu: "site", sursa: "reclama_meta", stare: "callback", caller_id: ids.caller, callback_la: peste(20) },
    { nr: 4, nume: "Bogdan Niculescu", serviciu: "1la1", sursa: "reclama_meta", stare: "a_raspuns", caller_id: ids.caller },
    { nr: 5, nume: "Alina Stoica · Imobiliare Nord", serviciu: "automatizari", sursa: "formular_site", stare: "programat", caller_id: ids.caller, closer_id: ids.closer },
    { nr: 6, nume: "Mihai Radu · Pizzeria Forno", serviciu: "site", sursa: "cold_calling", stare: "oferta_trimisa", caller_id: ids.caller2, closer_id: ids.closer, creat_de: ids.caller2 },
    { nr: 7, nume: "Ana Toma", serviciu: "altceva", sursa: "recomandare", caller_id: ids.caller2, creat_de: ids.caller2 },
    { nr: 8, nume: "George Ilie · Service Auto GI", serviciu: "automatizari", sursa: "dm_instagram", stare: "pierdut", motiv: "A ales pe altcineva, mai ieftin.", caller_id: ids.caller, closer_id: ids.closer, creat_de: ids.admin },
    { nr: 9, nume: "Ioana Matei", serviciu: "1la1", sursa: "dm_tiktok", stare: "descalificat", motiv: "Număr greșit.", caller_id: ids.caller2, creat_de: ids.admin },
    { nr: 10, nume: "Florin Dobre · Florăria Lalea", serviciu: "site", sursa: "altceva", creat_de: ids.admin },
    { nr: 11, nume: "Raluca Enache · Studio Pilates", serviciu: "site", sursa: "reclama_meta" },
    { nr: 12, nume: "Sorin Vasile · Brutăria de Colț", serviciu: "automatizari", sursa: "reclama_tiktok", stare: "callback", caller_id: ids.caller, callback_la: peste(-3) },
    { nr: 13, nume: "Teodora Lungu · Cabinet Vet", serviciu: "site", sursa: "formular_site", stare: "programat", caller_id: ids.caller, closer_id: ids.closer },
  ];

  for (const { nr, descriere, ...l } of L) {
    const telefon_norm = norm(nr);
    const gasit = await db.from("lead_uri").select("id").eq("telefon_norm", telefon_norm).maybeSingle();
    if (gasit.data) {
      // reîmprospătează doar data, ca jobul zilnic să nu le șteargă
      await db.from("lead_uri").update({ intrat_la: new Date().toISOString() }).eq("id", gasit.data.id);
      continue;
    }
    const ins = await db.from("lead_uri").insert({ ...l, telefon: tel(nr), telefon_norm }).select("id").single();
    if (ins.error) throw ins.error;
    const id = ins.data.id;
    if (!["cold_calling", "recomandare", "dm_instagram", "dm_tiktok", "altceva"].includes(l.sursa)) {
      const raspunsuri =
        l.sursa === "formular_site"
          ? [{ intrebare: "Descriere", raspuns: descriere ?? "" }]
          : [
              { intrebare: "Ce afacere ai?", raspuns: l.nume.split(" · ")[1] ?? "Încă nu am una" },
              { intrebare: "Ce vrei să rezolvi?", raspuns: "Să nu mai pierd programările de pe Instagram." },
              { intrebare: "Buget aproximativ", raspuns: "1.000–2.000 €" },
            ];
      await db.from("cereri").insert({ lead_id: id, sursa: l.sursa, raspunsuri, utm: nr === 5 ? { utm_source: "meta", utm_campaign: "automatizari-nov" } : {} });
    }
  }

  // un client: trecut prin update, ca trigger-ul să-l pună în clienti
  const client = await db.from("lead_uri").select("id, stare").eq("telefon_norm", norm(14)).maybeSingle();
  if (!client.data) {
    const ins = await db
      .from("lead_uri")
      .insert({ nume: "Laura Ene · Atelier Ceramică", telefon: tel(14), telefon_norm: norm(14), serviciu: "site", sursa: "formular_site", stare: "programat", caller_id: ids.caller, closer_id: ids.closer })
      .select("id")
      .single();
    if (ins.error) throw ins.error;
    await db.from("lead_uri").update({ stare: "client" }).eq("id", ins.data.id);
  } else {
    await db.from("lead_uri").update({ intrat_la: new Date().toISOString() }).eq("id", client.data.id);
  }
}

async function program(ids: Record<string, string>) {
  // closerul de test: luni–vineri, 10:00–18:00, discuții de 30 de minute
  await db.from("program_closer").delete().eq("closer_id", ids.closer);
  const zile = [1, 2, 3, 4, 5].map((zi) => ({ closer_id: ids.closer, zi, de_la: "10:00", pana_la: "18:00" }));
  const p = await db.from("program_closer").insert(zile);
  if (p.error) throw p.error;
  await db.from("profiluri").update({ durata_discutie_min: 30 }).eq("id", ids.closer);

  // o discuție viitoare pentru lead-ul 5 (programat), peste 3 zile la 14:00 ora României (12:00 UTC iarna)
  const l5 = await db.from("lead_uri").select("id").eq("telefon_norm", norm(5)).single();
  const are = await db.from("discutii").select("id").eq("lead_id", l5.data!.id).gt("incepe_la", new Date().toISOString());
  if (!are.data?.length) {
    const z = new Date(Date.now() + 3 * 86_400_000);
    z.setUTCHours(12, 0, 0, 0);
    const d = await db.from("discutii").insert({ lead_id: l5.data!.id, closer_id: ids.closer, incepe_la: z.toISOString(), sfarseste_la: new Date(z.getTime() + 30 * 60_000).toISOString() });
    if (d.error && d.error.code !== "23P01") throw d.error;
  }
}

// ce au lăsat în urmă testele care au picat la jumătate
for (const prefix of ["E2E %", "Test RLS%", "Test Intrare%", "Din site%", "Revine%"]) await db.from("lead_uri").delete().like("nume", prefix);

const ids = await conturi();
await leaduri(ids);
await program(ids);
const { count } = await db.from("lead_uri").select("id", { count: "exact", head: true });
console.log(`Gata: ${Object.keys(ids).length} conturi de test, ${count} lead-uri.`);
process.exit(0); // pe Windows, fără asta Node se plânge la ieșire (libuv)
