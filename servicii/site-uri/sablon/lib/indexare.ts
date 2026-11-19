/**
 * Doar site-ul public se lasă în Google. Previzualizările și serverul local nu.
 * Vercel spune producția prin VERCEL_ENV, Netlify prin CONTEXT. Pe altă găzduire pui de mână INDEXARE=da.
 */
export function seIndexeaza(env: Record<string, string | undefined>): boolean {
  return env.VERCEL_ENV === "production" || env.CONTEXT === "production" || env.INDEXARE === "da";
}
