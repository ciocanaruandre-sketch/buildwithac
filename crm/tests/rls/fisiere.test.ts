import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { admin, clientDeTest, conecteazaCa, idDe, stergeClient } from "./ajutor";

const lead_uri: string[] = [];
const fisiere: string[] = [];
afterAll(async () => {
  if (fisiere.length) await admin().storage.from("materiale").remove(fisiere);
  for (const id of lead_uri) await stergeClient(id);
});

async function proiect(cuConstructorul: boolean) {
  const c = await clientDeTest();
  lead_uri.push(c.lead.id);
  if (cuConstructorul) {
    const { error } = await admin().from("proiect_oameni").insert({ proiect_id: c.proiectId, om_id: await idDe("constructor") });
    if (error) throw error;
  }
  return c.proiectId;
}

const cale = (proiectId: string, nume = "test.txt") => {
  const c = `${proiectId}/${randomUUID()}/${nume}`;
  fisiere.push(c);
  return c;
};

/** Un fișier pus cu cheia de serviciu într-un proiect. */
async function fisierIn(proiectId: string) {
  const c = cale(proiectId);
  const { error } = await admin().storage.from("materiale").upload(c, Buffer.from("secret"), { contentType: "text/plain" });
  if (error) throw error;
  return c;
}

describe("fișierele din Storage", () => {
  it("bucketul e privat și are limita de 25 MB", async () => {
    const { data, error } = await admin().storage.getBucket("materiale");
    expect(error).toBeNull();
    expect(data?.public).toBe(false);
    expect(data?.file_size_limit).toBe(25 * 1024 * 1024);
  });

  it("constructorul de pe proiect urcă un fișier, îl vede, îl descarcă și îl șterge", async () => {
    const p = await proiect(true);
    const c = await conecteazaCa("constructor");
    const al = cale(p);
    const urcat = await c.storage.from("materiale").upload(al, Buffer.from("salut"), { contentType: "text/plain" });
    expect(urcat.error).toBeNull();

    const dosar = al.split("/").slice(0, 2).join("/");
    const lista = await c.storage.from("materiale").list(dosar);
    expect((lista.data ?? []).map((f) => f.name)).toEqual(["test.txt"]);
    const jos = await c.storage.from("materiale").download(al);
    expect(jos.error).toBeNull();
    expect(await jos.data!.text()).toBe("salut");

    const sters = await c.storage.from("materiale").remove([al]);
    expect(sters.error).toBeNull();
    expect(sters.data).toHaveLength(1);
  });

  it("constructorul de pe proiect primește un link semnat de urcare, iar fișierul urcat cu el ajunge în bucket", async () => {
    const p = await proiect(true);
    const c = await conecteazaCa("constructor");
    const al = cale(p, "prin-link.txt");
    const semnat = await c.storage.from("materiale").createSignedUploadUrl(al);
    expect(semnat.error).toBeNull();
    // browserul urcă fără sesiune, doar cu tokenul
    const anonim = await import("@supabase/supabase-js").then((m) =>
      m.createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } }),
    );
    const urcat = await anonim.storage.from("materiale").uploadToSignedUrl(al, semnat.data!.token, Buffer.from("prin link"), { contentType: "text/plain" });
    expect(urcat.error).toBeNull();
    const jos = await admin().storage.from("materiale").download(al);
    expect(await jos.data!.text()).toBe("prin link");
  });

  it.each(["constructor", "caller"] as const)("%s din afara proiectului: nu vede, nu descarcă, nu urcă, nu șterge", async (cont) => {
    const p = await proiect(false);
    const alAltuia = await fisierIn(p);
    const c = await conecteazaCa(cont);

    const lista = await c.storage.from("materiale").list(alAltuia.split("/").slice(0, 2).join("/"));
    expect(lista.data ?? []).toEqual([]);
    const jos = await c.storage.from("materiale").download(alAltuia);
    expect(jos.error).not.toBeNull();
    const semnatCitire = await c.storage.from("materiale").createSignedUrl(alAltuia, 60);
    expect(semnatCitire.error).not.toBeNull();
    const semnat = await c.storage.from("materiale").createSignedUploadUrl(cale(p, "intrus.txt"));
    expect(semnat.error).not.toBeNull();
    const urcat = await c.storage.from("materiale").upload(cale(p, "intrus2.txt"), Buffer.from("x"), { contentType: "text/plain" });
    expect(urcat.error).not.toBeNull();
    const sters = await c.storage.from("materiale").remove([alAltuia]);
    expect(sters.data ?? []).toEqual([]);

    // fișierul e încă acolo
    const inca = await admin().storage.from("materiale").download(alAltuia);
    expect(await inca.data!.text()).toBe("secret");
  });

  it("nimeni nu urcă în afara dosarului unui proiect", async () => {
    const c = await conecteazaCa("constructor");
    const aiurea = `aiurea/${randomUUID()}/x.txt`;
    fisiere.push(aiurea);
    const urcat = await c.storage.from("materiale").upload(aiurea, Buffer.from("x"), { contentType: "text/plain" });
    expect(urcat.error).not.toBeNull();
  });
});
