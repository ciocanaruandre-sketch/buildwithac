/**
 * Doar site-ul public, pe domeniul firmei, se lasă în Google. Previzualizările, serverul local
 * și adresa …vercel.app de dinainte de lansare (cu textele de exemplu) nu.
 * Vercel: producție și domeniul de producție al proiectului e al firmei (VERCEL_PROJECT_PRODUCTION_URL;
 * după ce adaugi domeniul, mai publici o dată, ca robots.txt să se refacă).
 * Netlify: CONTEXT=production. Pe altă găzduire: INDEXARE=da, pusă înainte de build.
 */
export function seIndexeaza(env: Record<string, string | undefined>, domeniu: string): boolean {
  const deProductie = env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^www\./, "");
  return (
    (env.VERCEL_ENV === "production" && deProductie === domeniu) ||
    env.CONTEXT === "production" ||
    env.INDEXARE === "da"
  );
}
