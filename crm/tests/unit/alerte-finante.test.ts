import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { construiesteAlerta, trimiteAlerteIntarziere, type TransaIntarziata } from "@/lib/alerte-finante";
import { CRM } from "@/lib/config";
import { construiesteCopia, TABELE } from "@/lib/retentie";

const t1: TransaIntarziata = { transaId: "t1", clientId: "c1", proiectId: "p1", client: "Cafeneaua <Boabe>", eticheta: "Rata 3 din 4", suma_lei: 1500, scadenta: "2026-11-10" };
const t2: TransaIntarziata = { transaId: "t2", clientId: "c2", proiectId: "p2", client: "Salon Lumi", eticheta: "Restul", suma_lei: 1200, scadenta: "2026-11-01" };

describe("construiesteAlerta", () => {
  it("două tranșe: subiectul, linkurile și zilele", () => {
    const e = construiesteAlerta([t1, t2], "2026-11-13");
    expect(e.subiect).toBe("Întârzie 2 tranșe");
    expect(e.text).toContain(`${CRM.url}/clienti/c1?proiect=p1`);
    expect(e.text).toContain(`${CRM.url}/clienti/c2?proiect=p2`);
    expect(e.text).toContain("3 zile");
    expect(e.text).toContain("12 zile");
    expect(e.text).toContain("1.500 lei");
    expect(e.html).toContain("Cafeneaua &lt;Boabe&gt;");
  });
  it("o singură tranșă", () => {
    expect(construiesteAlerta([t1], "2026-11-13").subiect).toBe("Întârzie o tranșă");
  });
});

/** O bază falsă: `select` dă rândurile, iar `update` ține minte ce s-a marcat. */
function dbFals() {
  const marcate: string[][] = [];
  const rand = { id: "t1", proiect_id: "p1", eticheta: "Avans", suma_lei: 900, scadenta: "2026-11-10", proiecte: { client_id: "c1", clienti: { nume: "Ana" } } };
  const lant = (rez: unknown, laIn?: (a: string[]) => void): unknown =>
    new Proxy(
      {},
      {
        get: (_, k) =>
          k === "then"
            ? (gata: (r: unknown) => void) => gata(rez)
            : (...a: unknown[]) => {
                if (k === "in" && laIn) laIn(a[1] as string[]);
                return lant(rez, laIn);
              },
      },
    );
  const db = {
    from: () => ({
      select: () => lant({ data: [rand], error: null }),
      update: () => lant({ data: null, error: null }, (iduri) => marcate.push(iduri)),
    }),
  };
  return { db: db as never, marcate };
}

describe("trimiteAlerteIntarziere", () => {
  const cheie = process.env.RESEND_API_KEY;
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test";
  });
  afterEach(() => {
    process.env.RESEND_API_KEY = cheie;
  });

  it("dacă e-mailul pică, nu marchează nimic", async () => {
    const { db, marcate } = dbFals();
    const pica = (async () => new Response("", { status: 500 })) as typeof fetch;
    expect(await trimiteAlerteIntarziere(db, pica, new Date("2026-11-13T05:00:00Z"))).toBe(0);
    expect(marcate).toEqual([]);
  });
  it("dacă e-mailul pleacă, marchează tranșele trimise", async () => {
    const { db, marcate } = dbFals();
    const merge = (async () => new Response("{}", { status: 200 })) as typeof fetch;
    expect(await trimiteAlerteIntarziere(db, merge, new Date("2026-11-13T05:00:00Z"))).toBe(1);
    expect(marcate).toEqual([["t1"]]);
  });
});

describe("copia de luni și finanțele", () => {
  it("are lista tranșelor întârziate", () => {
    const e = construiesteCopia({}, new Date("2026-11-16T04:00:00Z"), 0, [], [], [t1]);
    expect(e.text).toContain("Tranșe întârziate (1):");
    expect(e.text).toContain(`${CRM.url}/clienti/c1?proiect=p1`);
    expect(e.html).toContain("Tranșe întârziate (1):");
    expect(construiesteCopia({}, new Date("2026-11-16T04:00:00Z"), 0).text).not.toContain("Tranșe întârziate");
  });
  it("TABELE conține tabelele finanțelor", () => {
    for (const t of ["procente_baza", "proiect_vanzari", "transe", "comisioane", "abonamente", "abonament_oameni"]) expect(TABELE).toContain(t);
  });
});
