import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

export const FrontmatterGhid = z.object({
  titlu: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  cuvant: z.string().regex(/^[A-Z0-9]+$/),
  descriere: z.string(),
  ceGasesti: z.array(z.string()).min(1),
  durata: z.string(),
  nivel: z.enum(["începător", "mediu", "avansat"]),
  unelte: z.array(z.string()),
  actualizat: z.coerce.date(),
  publicat: z.coerce.date(),
  imagine: z.string(),
  clip: z.url().optional(),
  pdf: z.boolean().default(false),
  exemplu: z.boolean().default(false),
});

export type Pas = { id: string; titlu: string };
/** `dosar` = dosarul cu imagini din public/ghiduri (diferă de slug doar la copiile demo). */
export type Ghid = z.infer<typeof FrontmatterGhid> & { corp: string; pasi: Pas[]; dosar: string };
/** Ce primesc componentele din browser: ghidul fără textul MDX. */
export type GhidCard = Omit<Ghid, "corp">;
export const faraCorp = ({ corp: _, ...rest }: Ghid): GhidCard => rest;

export type MediuGhiduri = { productie: boolean; demo?: number };

const DOSAR = path.join(process.cwd(), "content", "ghiduri");

function mediuCurent(): MediuGhiduri {
  return {
    productie: process.env.VERCEL_ENV === "production",
    demo: Number(process.env.DEMO_GHIDURI) || undefined,
  };
}

function extragePasi(corp: string): Pas[] {
  return [...corp.matchAll(/<Pas\s+titlu="([^"]+)"/g)].map((m, i) => ({ id: `pas-${i + 1}`, titlu: m[1] }));
}

function citesteGhid(dosar: string, nume: string): Ghid {
  const fisier = path.join(dosar, nume, "index.mdx");
  const { data, content } = matter(fs.readFileSync(fisier, "utf8"));
  const rezultat = FrontmatterGhid.safeParse(data);
  if (!rezultat.success) {
    throw new Error(`Frontmatter invalid în ${path.join(nume, "index.mdx")}: ${z.prettifyError(rezultat.error)}`);
  }
  if (rezultat.data.slug !== nume) {
    throw new Error(`Slug-ul „${rezultat.data.slug}” nu se potrivește cu numele dosarului „${nume}”.`);
  }
  return { ...rezultat.data, corp: content, pasi: extragePasi(content), dosar: nume };
}

function verificaUnice(ghiduri: Ghid[]) {
  for (const camp of ["slug", "cuvant"] as const) {
    const vazute = new Set<string>();
    for (const g of ghiduri) {
      if (vazute.has(g[camp])) throw new Error(`${camp === "slug" ? "Slug" : "Cuvânt"} duplicat: ${g[camp]}`);
      vazute.add(g[camp]);
    }
  }
}

function completeazaDemo(ghiduri: Ghid[], total: number): Ghid[] {
  const rezultat = [...ghiduri];
  for (let i = 0; rezultat.length < total && ghiduri.length > 0; i++) {
    const sursa = ghiduri[i % ghiduri.length];
    const k = Math.floor(i / ghiduri.length) + 2;
    rezultat.push({ ...sursa, slug: `${sursa.slug}-${k}`, cuvant: `${sursa.cuvant}${k}` });
  }
  return rezultat;
}

export function incarcaGhiduri(dosar: string = DOSAR, mediu: MediuGhiduri = mediuCurent()): Ghid[] {
  if (!fs.existsSync(dosar)) return [];
  const nume = fs.readdirSync(dosar, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const toate = nume.map((n) => citesteGhid(dosar, n));
  verificaUnice(toate);
  let ghiduri = toate
    .filter((g) => !(mediu.productie && g.exemplu))
    .sort((a, b) => b.publicat.getTime() - a.publicat.getTime());
  if (!mediu.productie && mediu.demo && mediu.demo > ghiduri.length) ghiduri = completeazaDemo(ghiduri, mediu.demo);
  return ghiduri;
}

let cache: Ghid[] | undefined;

export function toateGhidurile(): Ghid[] {
  // în dezvoltare citim mereu din nou, ca ghidurile editate să apară fără repornire
  if (process.env.NODE_ENV !== "production") return incarcaGhiduri();
  return (cache ??= incarcaGhiduri());
}

export function ghidDupaSlug(slug: string): Ghid | undefined {
  return toateGhidurile().find((g) => g.slug === slug);
}

export function ghidulNou(): Ghid | undefined {
  return toateGhidurile()[0];
}
