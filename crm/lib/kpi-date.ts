import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { intervale, sectiuniPentru, type OmTabel, type Perioada, type Sectiune } from "@/lib/kpi";
import type { Rol } from "@/lib/tipuri";

type Db = SupabaseClient<Database>;

// Tipurile generate nu știu că valorile pot lipsi (null = „—”): le spunem aici.
export type KpiApeluri = {
  om_id: string | null; luate: number; apeluri: number; au_raspuns: number; programate: number;
  minute_primul_apel: number | null; nesunate_24h: number; incercari_pana_raspunde: number | null;
  /** Dintre cei care au răspuns în perioadă, câți s-au programat (și după perioadă). */
  programate_din_raspuns: number;
};
export type KpiInchideri = {
  om_id: string | null; programate: number; au_venit: number; clienti: number;
  vandut_lei: number | null; fara_pret: number | null; zile_pana_la_client: number | null;
  /** Dintre discuțiile ținute în perioadă, câte lead-uri s-au făcut clienți (și după perioadă). */
  clienti_din_discutii: number;
};
export type KpiPalnie = { intrari: number; sunate: number; au_raspuns: number; programate: number; au_venit: number; oferta: number; clienti: number };
export type KpiPierderi = { stare: "pierdut" | "descalificat"; categorie: string; nr: number };
export type KpiSurse = { sursa: string; intrari: number; clienti: number };
export type KpiProiecte = {
  om_id: string | null; livrate: number; zile_durata: number | null; livrari_trimise: number; livrari_refacute: number;
  taskuri_cu_termen: number; taskuri_la_termen: number;
};
export type KpiBani = { incasat_lei: number; valoare_medie_lei: number | null; mentenanta_lei: number; transe_intarziate: number; intarziat_lei: number };
export type KpiLuni = { luna: string; clienti_noi: number; incasat_lei: number };

export type Seturi = {
  apeluri: KpiApeluri[];
  inchideri: KpiInchideri[];
  palnie: KpiPalnie | null;
  pierderi: KpiPierderi[];
  surse: KpiSurse[];
  proiecte: KpiProiecte[];
  bani: KpiBani | null;
};
export type OmKpi = { id: string; nume: string; rol: Rol };
/** `oameni`: cardurile echipei (doar activii). `toti`: și cei plecați, pentru tabelele „Pe oameni”. */
export type DateKpi = { acum: Seturi; ant: Seturi; luni: KpiLuni[] | null; oameni: OmKpi[]; toti: OmTabel[] };

/** Ce funcții cheamă fiecare secțiune. Cardurile echipei folosesc aceleași rânduri. */
const FUNCTII: Record<Sectiune, (keyof Seturi)[]> = {
  palnie: ["palnie"],
  apeluri: ["apeluri"],
  inchideri: ["inchideri"],
  pierderi: ["pierderi", "surse"],
  proiecte: ["proiecte"],
  bani: ["bani"],
};

async function rpc<T>(db: Db, fn: string, de: Date, pana: Date): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.rpc(fn as any, { de: de.toISOString(), pana: pana.toISOString() } as any);
  if (error) throw error;
  // Postgres întoarce numeric/bigint uneori ca text: le facem numere
  return ((data ?? []) as Record<string, unknown>[]).map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) && k !== "om_id" ? Number(v) : v])),
  ) as T[];
}

async function seturi(db: Db, rol: Rol, de: Date, pana: Date): Promise<Seturi> {
  const vrem = new Set(sectiuniPentru(rol).flatMap((s) => FUNCTII[s]));
  // „De unde vin” e doar a Adminului; closerul are din „Pierderi și surse” doar „De ce pierd”
  if (rol !== "admin") vrem.delete("surse");
  const ia = <T,>(k: keyof Seturi, fn: string) => (vrem.has(k) ? rpc<T>(db, fn, de, pana) : Promise.resolve([] as T[]));
  const [apeluri, inchideri, palnie, pierderi, surse, proiecte, bani] = await Promise.all([
    ia<KpiApeluri>("apeluri", "kpi_apeluri"),
    ia<KpiInchideri>("inchideri", "kpi_inchideri"),
    ia<KpiPalnie>("palnie", "kpi_palnie"),
    ia<KpiPierderi>("pierderi", "kpi_pierderi"),
    ia<KpiSurse>("surse", "kpi_surse"),
    ia<KpiProiecte>("proiecte", "kpi_proiecte"),
    ia<KpiBani>("bani", "kpi_bani"),
  ]);
  return { apeluri, inchideri, palnie: palnie[0] ?? null, pierderi, surse, proiecte, bani: bani[0] ?? null };
}

/** Cifrele perioadei alese și ale celei de dinainte, toate în paralel, doar pentru secțiunile rolului. */
export async function citesteKpi(db: Db, rol: Rol, eu: OmKpi, p: Perioada, acum: Date): Promise<DateKpi> {
  const i = intervale(p, acum);
  const admin = rol === "admin";
  const [a, b, luni, toti] = await Promise.all([
    seturi(db, rol, i.de, i.pana),
    seturi(db, rol, i.deAnt, i.panaAnt),
    admin
      ? db.rpc("kpi_luni", { luni: 6 }).then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []).map((r) => ({ luna: r.luna, clienti_noi: Number(r.clienti_noi), incasat_lei: Number(r.incasat_lei) }));
        })
      : Promise.resolve(null),
    admin
      ? db
          .from("profiluri")
          .select("id, nume, rol, activ")
          .order("nume")
          .then(({ data, error }) => {
            if (error) throw error;
            return data as OmTabel[];
          })
      : Promise.resolve([{ ...eu, activ: true }]),
  ]);
  return { acum: a, ant: b, luni, oameni: toti.filter((o) => o.activ).map(({ id, nume, rol }) => ({ id, nume, rol })), toti };
}
