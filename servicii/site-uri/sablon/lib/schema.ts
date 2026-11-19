import { z } from "zod";

/**
 * Forma conținutului unui site. O a doua limbă = un al doilea fișier de conținut cu aceeași schemă.
 * Dacă vine panoul de administrare, conținutul se mută într-un loc editabil, dar schema rămâne.
 */
export const SchemaContinut = z.object({
  titlu: z.string().min(1),
  /** textul care apare în Google sub titlu */
  descriere: z.string().min(1).max(160),
  program: z.array(z.object({ zile: z.string().min(1), ore: z.string().min(1) })),
  servicii: z.array(
    z.object({
      nume: z.string().min(1),
      /** în lei; null = fără preț afișat („la cerere”) */
      pret: z.number().nonnegative().nullable(),
      descriere: z.string().optional(),
    }),
  ),
  poze: z.array(
    z.object({
      /** calea din public/, de exemplu „/poze/sala.jpg” */
      fisier: z.string().startsWith("/"),
      /** ce se vede în poză, pentru cine nu o vede */
      alt: z.string().min(1),
    }),
  ),
});

export type Continut = z.infer<typeof SchemaContinut>;
