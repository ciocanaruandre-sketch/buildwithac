import "server-only";

// Apelurile către Google (OAuth 2.0 și Calendar API v3), cu fetch simplu și injectabil (testele dau unul fals).
// Adresele de bază se pot schimba din mediu, ca testele în browser să vorbească cu un Google fals.

/**
 * Drepturile cerute (verificate în documentația Google, 2026-11-16):
 * - calendar.events.owned: creează, schimbă și șterge evenimente doar în calendarele omului (cel principal e al lui);
 *   mai îngust decât calendar.events și acceptat de events.insert/patch/delete;
 * - calendar.freebusy: doar „ocupat/liber”, fără titlurile evenimentelor; acceptat de freeBusy.query.
 * openid + email: ca să știm ce cont Gmail s-a conectat.
 */
export const SCOPURI = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

const DREPTURI_CALENDAR = SCOPURI.filter((s) => s.includes("/auth/calendar"));

/** Drepturile de calendar pe care omul nu le-a bifat pe ecranul Google (`scope` din răspunsul la token). */
export function drepturiLipsa(scope: string): string[] {
  const date = new Set(scope.split(/\s+/));
  return DREPTURI_CALENDAR.filter((s) => !date.has(s));
}

/**
 * Id-ul evenimentului, ales de noi din id-ul discuției (Google primește litere a–v și cifre, 5–1024 caractere).
 * Așa, un al doilea POST pentru aceeași discuție (reîncercare, răspuns pierdut, două servere) primește 409, nu face dublură.
 */
export function idEveniment(discutieId: string): string {
  return discutieId.replace(/-/g, "").toLowerCase();
}

/** Google a refuzat cheia (omul a scos accesul, și-a schimbat parola): trebuie conectat din nou. */
export class GoogleCazut extends Error {}
/** Orice altă problemă cu Google (pică, tace, răspuns ciudat): se reîncearcă. */
export class GoogleEroare extends Error {}

const api = () => process.env.GOOGLE_API_URL ?? "https://www.googleapis.com";
const urlToken = () => process.env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token";
const urlRevocare = () => process.env.GOOGLE_REVOKE_URL ?? "https://oauth2.googleapis.com/revoke";
const evenimente = () => `${api()}/calendar/v3/calendars/primary/events`;

export type Interval = { de: Date; pana: Date };

export function urlConectare(o: { redirect: string; stare: string }): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: o.redirect,
    response_type: "code",
    scope: SCOPURI.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: o.stare,
  }).toString();
  return u.toString();
}

async function cerereToken(parametri: Record<string, string>, f: typeof fetch) {
  let r: Response;
  try {
    r = await f(urlToken(), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        ...parametri,
      }).toString(),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    throw new GoogleEroare(`Google nu răspunde: ${(e as Error).message}`);
  }
  const date = (await r.json().catch(() => ({}))) as Record<string, string | undefined>;
  if (!r.ok) {
    if (date.error === "invalid_grant") throw new GoogleCazut("Google a refuzat cheia (invalid_grant).");
    throw new GoogleEroare(`Google a răspuns ${r.status}${date.error ? ` (${date.error})` : ""}.`);
  }
  return date;
}

/** Codul primit la întoarcere → cheia de lungă durată, adresa contului și drepturile bifate. */
export async function schimbaCod(cod: string, redirect: string, f: typeof fetch = fetch): Promise<{ refresh: string; email: string; scope: string }> {
  const d = await cerereToken({ grant_type: "authorization_code", code: cod, redirect_uri: redirect }, f);
  // id_token vine direct de la Google, prin TLS: partea din mijloc se citește fără verificarea semnăturii
  let email: unknown;
  try {
    email = JSON.parse(Buffer.from((d.id_token ?? "").split(".")[1] ?? "", "base64url").toString("utf8")).email;
  } catch {
    email = undefined;
  }
  if (!d.refresh_token || typeof email !== "string") throw new GoogleEroare("Google n-a dat cheia sau adresa contului.");
  return { refresh: d.refresh_token, email, scope: d.scope ?? "" };
}

export async function tokenAcces(refresh: string, f: typeof fetch = fetch): Promise<string> {
  const d = await cerereToken({ grant_type: "refresh_token", refresh_token: refresh }, f);
  if (!d.access_token) throw new GoogleEroare("Google n-a dat cheia de acces.");
  return d.access_token;
}

async function cerereApi(url: string, acces: string, init: RequestInit, f: typeof fetch, timp = 10_000): Promise<Response> {
  let r: Response;
  try {
    r = await f(url, {
      ...init,
      headers: { authorization: `Bearer ${acces}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(timp),
    });
  } catch (e) {
    throw new GoogleEroare(`Google nu răspunde: ${(e as Error).message}`);
  }
  if (r.status === 401) throw new GoogleCazut("Google a refuzat cheia de acces (401).");
  return r;
}

/** Schimbă evenimentul și îl confirmă (dacă fusese șters din calendar, revine). `null` dacă nu există deloc. */
async function patch(acces: string, corp: object, eventId: string, f: typeof fetch): Promise<string | null> {
  const r = await cerereApi(`${evenimente()}/${encodeURIComponent(eventId)}`, acces, { method: "PATCH", body: JSON.stringify({ ...corp, status: "confirmed" }) }, f);
  if (r.ok) return ((await r.json()) as { id: string }).id;
  if (r.status === 404 || r.status === 410) return null;
  throw new GoogleEroare(`Google a răspuns ${r.status} la schimbarea evenimentului.`);
}

/**
 * Creează evenimentul (fără `eventId`) sau îl schimbă (cu `eventId`). Dacă nu mai e în calendar, îl creează din nou.
 * Cu `idNou`, crearea folosește id-ul ăsta: dacă există deja (409), îl schimbă în loc să facă unul al doilea.
 */
export async function scrieEveniment(acces: string, corp: object, eventId: string | null, f: typeof fetch = fetch, idNou?: string): Promise<string> {
  if (eventId) {
    const id = await patch(acces, corp, eventId, f);
    if (id) return id;
  }
  const r = await cerereApi(evenimente(), acces, { method: "POST", body: JSON.stringify(idNou ? { ...corp, id: idNou } : corp) }, f);
  if (r.status === 409 && idNou) {
    const id = await patch(acces, corp, idNou, f);
    if (id) return id;
  }
  if (!r.ok) throw new GoogleEroare(`Google a răspuns ${r.status} la crearea evenimentului.`);
  const { id } = (await r.json()) as { id?: string };
  if (!id) throw new GoogleEroare("Google n-a dat id-ul evenimentului.");
  return id;
}

export async function stergeEveniment(acces: string, eventId: string, f: typeof fetch = fetch): Promise<void> {
  const r = await cerereApi(`${evenimente()}/${encodeURIComponent(eventId)}`, acces, { method: "DELETE" }, f);
  if (r.ok || r.status === 404 || r.status === 410) return;
  throw new GoogleEroare(`Google a răspuns ${r.status} la ștergerea evenimentului.`);
}

/** Orele ocupate din calendarul principal. Doar „ocupat”, fără titluri. Cel mult 3 secunde. */
export async function ocupat(acces: string, de: Date, pana: Date, f: typeof fetch = fetch): Promise<Interval[]> {
  const r = await cerereApi(
    `${api()}/calendar/v3/freeBusy`,
    acces,
    { method: "POST", body: JSON.stringify({ timeMin: de.toISOString(), timeMax: pana.toISOString(), items: [{ id: "primary" }] }) },
    f,
    3_000,
  );
  if (!r.ok) throw new GoogleEroare(`Google a răspuns ${r.status} la ocupat/liber.`);
  const d = (await r.json()) as { calendars?: { primary?: { busy?: { start: string; end: string }[]; errors?: unknown[] } } };
  const p = d.calendars?.primary;
  if (!p || p.errors?.length) throw new GoogleEroare("Google n-a putut citi calendarul principal.");
  return (p.busy ?? []).map((b) => ({ de: new Date(b.start), pana: new Date(b.end) }));
}

/** Retrage cheia la Google. Nu aruncă: deconectarea se face oricum. */
export async function revoca(refresh: string, f: typeof fetch = fetch): Promise<void> {
  try {
    await f(`${urlRevocare()}?token=${encodeURIComponent(refresh)}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // nimic: cheia e oricum ștearsă din CRM
  }
}
