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

const peste_zile = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

function verifica(...r: { error: unknown }[]) {
  for (const x of r) if (x.error) throw x.error;
}

/** Clientul făcut dintr-un lead (lead-ul trece prin update în „client”, ca trigger-ul să facă și primul proiect). */
async function client(telefonNorm: string, lead: LeadNou): Promise<{ clientId: string; proiectId: string }> {
  let l = (await db.from("lead_uri").select("id, stare").eq("telefon_norm", telefonNorm).maybeSingle()).data;
  if (!l) {
    const ins = await db.from("lead_uri").insert({ ...lead, telefon_norm: telefonNorm, stare: "programat" }).select("id, stare").single();
    if (ins.error) throw ins.error;
    l = ins.data;
  }
  if (l.stare !== "client") verifica(await db.from("lead_uri").update({ stare: "client" }).eq("id", l.id));
  const c = await db.from("clienti").select("id").eq("lead_id", l.id).single();
  if (c.error) throw c.error;
  const p = await db.from("proiecte").select("id").eq("client_id", c.data.id).order("creat_la").limit(1).single();
  if (p.error) throw p.error;
  return { clientId: c.data.id, proiectId: p.data.id };
}

/** Fișele de client, pline, ca în prototip. Se umplu o singură dată (dacă proiectul n-are încă task-uri). */
async function fise(ids: Record<string, string>) {
  // „constructor” e și numele unei proprietăți a oricărui obiect: îl citim ca pe o cheie oarecare
  const radu = ids["constructor" as string];
  // 1. Laura Ene: un site în construcție, cu de toate
  const laura = await client(norm(14), { nume: "Laura Ene · Atelier Ceramică", telefon: tel(14), serviciu: "site", sursa: "formular_site", caller_id: ids.caller, closer_id: ids.closer });
  const p = laura.proiectId;
  // notițele se scriu ultimele: dacă lipsesc, fișa nu e (complet) umplută și o luăm de la capăt
  const { count: eUmpluta } = await db.from("notite_proiect").select("id", { count: "exact", head: true }).eq("proiect_id", p);
  if (!eUmpluta) {
    for (const tabel of ["taskuri", "materiale", "conturi", "livrari"] as const) verifica(await db.from(tabel).delete().eq("proiect_id", p));
    verifica(await db.from("evenimente_proiect").delete().eq("proiect_id", p).in("tip", ["livrat", "livrare_stare"]));
    verifica(
      await db.from("proiecte").update({ titlu: "Site de la zero", stadiu: "constructie", pret_lei: 2400, incasat_lei: 1200, termen: peste_zile(18) }).eq("id", p),
      await db.from("proiect_oameni").upsert({ proiect_id: p, om_id: radu, procent: 30 }),
      await db.from("taskuri").insert([
        { proiect_id: p, titlu: "Discuția de pornire și formularul completat", om_id: ids.admin, termen: peste_zile(-14), gata: true },
        { proiect_id: p, titlu: "Domeniu cumpărat (atelierceramica.ro)", om_id: ids.admin, termen: peste_zile(-12), gata: true },
        { proiect_id: p, titlu: "Schița paginii principale, aprobată de client", om_id: ids.admin, termen: peste_zile(-7), gata: true },
        { proiect_id: p, titlu: "Pagina de produse: pozele de la client", om_id: radu, termen: peste_zile(3), gata: false },
        { proiect_id: p, titlu: "Comenzi prin WhatsApp pe pagina de contact", om_id: ids.admin, termen: peste_zile(7), gata: false },
        { proiect_id: p, titlu: "Google Business: legat de site", om_id: ids.admin, termen: peste_zile(-3), gata: false },
      ]),
      await db.from("materiale").insert([
        { proiect_id: p, titlu: "Logo și culori", nota: "de la client, pe Drive", url: "https://drive.google.com/drive/folders/exemplu-logo", adaugat_de: ids.admin },
        { proiect_id: p, titlu: "Poze produse (24)", nota: null, url: "https://drive.google.com/drive/folders/exemplu-poze", adaugat_de: radu },
        { proiect_id: p, titlu: "Răspunsurile din formular", nota: null, url: "https://tally.so/r/exemplu", adaugat_de: ids.admin },
      ]),
      await db.from("conturi").insert([
        { proiect_id: p, serviciu: "Vercel (site-ul)", cont: "atelier-ceramica", al_cui: "client", unde_parola: "la_client", adaugat_de: ids.admin },
        { proiect_id: p, serviciu: "Domeniu (ROTLD)", cont: "atelierceramica.ro", al_cui: "client", unde_parola: "la_client", adaugat_de: ids.admin },
        { proiect_id: p, serviciu: "GitHub", cont: "buildwithac/atelier-ceramica", al_cui: "firma", unde_parola: "la_firma", adaugat_de: ids.admin },
        { proiect_id: p, serviciu: "Google Business", cont: "acces de editor", al_cui: "client", unde_parola: "nu_e_cazul", adaugat_de: ids.admin },
      ]),
      await db.from("livrari").insert([
        { proiect_id: p, titlu: "Schița paginii principale (v2)", link: "https://exemplu.ro/schita-v2", nota: "aprobată: „e super, mergem așa”", stare: "aprobat", adaugat_de: ids.admin },
        { proiect_id: p, titlu: "Previzualizare site (în lucru)", link: "https://exemplu.ro/previzualizare", nota: null, stare: "trimis", adaugat_de: ids.admin },
      ]),
      await db.from("notite_proiect").insert([
        { proiect_id: p, autor_id: ids.admin, text: "Vrea produsele pe categorii, nu o listă lungă. Prețurile le schimbă des: să le poată edita singură." },
        { proiect_id: p, autor_id: radu, text: "Pozele vechi sunt mici. Am cerut altele, făcute cu telefonul, la lumina zilei." },
      ]),
    );
  }

  // 2. Andreea Pop: un site predat, în mentenanță, și o automatizare abia începută
  const andreea = await client(norm(15), { nume: "Andreea Pop · Florăria Iris", telefon: tel(15), serviciu: "site", sursa: "recomandare", caller_id: ids.caller2, closer_id: ids.closer, creat_de: ids.caller2 });
  const { count: proiecteleEi } = await db.from("proiecte").select("id", { count: "exact", head: true }).eq("client_id", andreea.clientId);
  if (proiecteleEi === 1) {
    verifica(
      await db.from("proiecte").update({ titlu: "Site", stadiu: "mentenanta", pret_lei: 1800, incasat_lei: 1800, termen: peste_zile(-30) }).eq("id", andreea.proiectId),
      await db.from("taskuri").insert([
        { proiect_id: andreea.proiectId, titlu: "Site-ul publicat pe domeniul ei", om_id: ids.admin, termen: peste_zile(-32), gata: true },
        { proiect_id: andreea.proiectId, titlu: "I-am arătat cum schimbă prețurile", om_id: ids.admin, termen: peste_zile(-30), gata: true },
      ]),
      await db.from("proiecte").insert({ client_id: andreea.clientId, titlu: "Automatizare comenzi", serviciu: "automatizari", creat_de: ids.admin }),
    );
  }
}

// ce au lăsat în urmă testele care au picat la jumătate
// clientul făcut dintr-un lead rămâne după ștergerea lead-ului (lead_id devine null), deci îl ștergem întâi
for (const prefix of ["E2E %", "Test RLS%", "Test Intrare%", "Din site%", "Revine%"]) {
  await db.from("clienti").delete().like("nume", prefix);
  await db.from("lead_uri").delete().like("nume", prefix);
}

const ids = await conturi();
await leaduri(ids);
await program(ids);
await fise(ids);
const { count } = await db.from("lead_uri").select("id", { count: "exact", head: true });
const { count: proiecte } = await db.from("proiecte").select("id", { count: "exact", head: true });
console.log(`Gata: ${Object.keys(ids).length} conturi de test, ${count} lead-uri, ${proiecte} proiecte.`);
process.exit(0); // pe Windows, fără asta Node se plânge la ieșire (libuv)
