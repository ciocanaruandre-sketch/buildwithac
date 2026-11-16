import { describe, expect, it } from "vitest";
import {
  GoogleCazut,
  GoogleEroare,
  SCOPURI,
  ocupat,
  revoca,
  schimbaCod,
  scrieEveniment,
  stergeEveniment,
  tokenAcces,
  urlConectare,
} from "@/lib/calendar/google";

type Cerere = { url: string; metoda: string; corp: string; antete: Record<string, string> };

/** Un fetch fals: răspunde din listă, în ordine, și ține minte cererile. */
function fals(...raspunsuri: (Response | Error)[]) {
  const cereri: Cerere[] = [];
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    cereri.push({
      url: String(input),
      metoda: init?.method ?? "GET",
      corp: typeof init?.body === "string" ? init.body : init?.body ? String(init.body) : "",
      antete: Object.fromEntries(new Headers(init?.headers).entries()),
    });
    const r = raspunsuri.shift();
    if (!r) throw new Error("fetch fals: niciun răspuns pregătit");
    if (r instanceof Error) throw r;
    return r;
  }) as typeof fetch;
  return { f, cereri };
}
const json = (date: unknown, status = 200) => new Response(JSON.stringify(date), { status, headers: { "content-type": "application/json" } });
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

describe("clientul Google", () => {
  it("urlConectare cere acces offline, consimțământ și toate scope-urile", () => {
    process.env.GOOGLE_CLIENT_ID = "id-test";
    const u = new URL(urlConectare({ redirect: "http://localhost:3000/api/google/intoarcere", stare: "s123" }));
    expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(u.searchParams.get("access_type")).toBe("offline");
    expect(u.searchParams.get("prompt")).toBe("consent");
    expect(u.searchParams.get("response_type")).toBe("code");
    expect(u.searchParams.get("include_granted_scopes")).toBe("true");
    expect(u.searchParams.get("state")).toBe("s123");
    expect(u.searchParams.get("client_id")).toBe("id-test");
    expect(u.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/google/intoarcere");
    expect(u.searchParams.get("scope")!.split(" ")).toEqual(SCOPURI);
  });

  it("scope-urile: doar evenimente și ocupat/liber", () => {
    expect(SCOPURI).toContain("https://www.googleapis.com/auth/calendar.freebusy");
    expect(SCOPURI).toContain("https://www.googleapis.com/auth/calendar.events.owned");
    expect(SCOPURI).not.toContain("https://www.googleapis.com/auth/calendar");
  });

  it("schimbaCod întoarce cheia și e-mailul din id_token", async () => {
    const { f, cereri } = fals(json({ access_token: "a", refresh_token: "r1", id_token: `x.${b64({ email: "andrei@gmail.com" })}.y` }));
    expect(await schimbaCod("cod1", "http://localhost:3000/cb", f)).toEqual({ refresh: "r1", email: "andrei@gmail.com" });
    const corp = new URLSearchParams(cereri[0].corp);
    expect(cereri[0].metoda).toBe("POST");
    expect(corp.get("grant_type")).toBe("authorization_code");
    expect(corp.get("code")).toBe("cod1");
    expect(corp.get("redirect_uri")).toBe("http://localhost:3000/cb");
  });

  it("schimbaCod fără refresh_token aruncă", async () => {
    const { f } = fals(json({ access_token: "a", id_token: `x.${b64({ email: "a@b.ro" })}.y` }));
    await expect(schimbaCod("c", "r", f)).rejects.toBeInstanceOf(GoogleEroare);
  });

  it("tokenAcces: invalid_grant înseamnă legătură căzută", async () => {
    const { f } = fals(json({ error: "invalid_grant" }, 400));
    await expect(tokenAcces("r1", f)).rejects.toBeInstanceOf(GoogleCazut);
  });

  it("tokenAcces: 500 e o eroare obișnuită", async () => {
    const { f } = fals(new Response("x", { status: 500 }));
    const e = await tokenAcces("r1", f).catch((x) => x);
    expect(e).toBeInstanceOf(GoogleEroare);
    expect(e).not.toBeInstanceOf(GoogleCazut);
  });

  it("tokenAcces întoarce access_token", async () => {
    const { f, cereri } = fals(json({ access_token: "a1" }));
    expect(await tokenAcces("r1", f)).toBe("a1");
    expect(new URLSearchParams(cereri[0].corp).get("grant_type")).toBe("refresh_token");
  });

  it("scrieEveniment fără id face POST în calendarul principal", async () => {
    const { f, cereri } = fals(json({ id: "ev9" }));
    expect(await scrieEveniment("a1", { summary: "x" }, null, f)).toBe("ev9");
    expect(cereri[0].metoda).toBe("POST");
    expect(cereri[0].url).toBe("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    expect(cereri[0].antete.authorization).toBe("Bearer a1");
  });

  it("scrieEveniment cu id face PATCH, iar 404 face POST", async () => {
    const { f, cereri } = fals(json({ id: "ev1" }));
    expect(await scrieEveniment("a1", { summary: "x" }, "ev1", f)).toBe("ev1");
    expect(cereri[0].metoda).toBe("PATCH");
    expect(cereri[0].url).toBe("https://www.googleapis.com/calendar/v3/calendars/primary/events/ev1");

    const b = fals(new Response("", { status: 404 }), json({ id: "ev2" }));
    expect(await scrieEveniment("a1", { summary: "x" }, "ev1", b.f)).toBe("ev2");
    expect(b.cereri.map((c) => c.metoda)).toEqual(["PATCH", "POST"]);
  });

  it("scrieEveniment cu 500 aruncă GoogleEroare", async () => {
    const { f } = fals(new Response("", { status: 500 }));
    await expect(scrieEveniment("a1", {}, null, f)).rejects.toBeInstanceOf(GoogleEroare);
  });

  it("scrieEveniment cu 401 înseamnă legătură căzută", async () => {
    const { f } = fals(new Response("", { status: 401 }));
    await expect(scrieEveniment("a1", {}, null, f)).rejects.toBeInstanceOf(GoogleCazut);
  });

  it("stergeEveniment: 410 și 404 înseamnă gata", async () => {
    const { f, cereri } = fals(new Response(null, { status: 410 }), new Response(null, { status: 404 }), new Response(null, { status: 204 }));
    await stergeEveniment("a1", "ev1", f);
    await stergeEveniment("a1", "ev1", f);
    await stergeEveniment("a1", "ev1", f);
    expect(cereri[0].metoda).toBe("DELETE");
    expect(cereri[0].url).toBe("https://www.googleapis.com/calendar/v3/calendars/primary/events/ev1");
  });

  it("stergeEveniment cu 500 aruncă", async () => {
    const { f } = fals(new Response(null, { status: 500 }));
    await expect(stergeEveniment("a1", "ev1", f)).rejects.toBeInstanceOf(GoogleEroare);
  });

  it("ocupat transformă busy în intervale", async () => {
    const { f, cereri } = fals(json({ calendars: { primary: { busy: [{ start: "2026-12-01T10:00:00Z", end: "2026-12-01T11:00:00Z" }] } } }));
    const de = new Date("2026-12-01T00:00:00Z");
    const pana = new Date("2026-12-15T00:00:00Z");
    expect(await ocupat("a1", de, pana, f)).toEqual([{ de: new Date("2026-12-01T10:00:00Z"), pana: new Date("2026-12-01T11:00:00Z") }]);
    expect(cereri[0].url).toBe("https://www.googleapis.com/calendar/v3/freeBusy");
    expect(JSON.parse(cereri[0].corp)).toEqual({ timeMin: de.toISOString(), timeMax: pana.toISOString(), items: [{ id: "primary" }] });
  });

  it("ocupat cu eroare pe calendar aruncă", async () => {
    const { f } = fals(json({ calendars: { primary: { errors: [{ reason: "notFound" }], busy: [] } } }));
    await expect(ocupat("a1", new Date(), new Date(), f)).rejects.toBeInstanceOf(GoogleEroare);
  });

  it("ocupat se oprește după 3 secunde", async () => {
    let semnal: AbortSignal | undefined;
    const f = ((_: RequestInfo | URL, init?: RequestInit) => {
      semnal = init?.signal ?? undefined;
      return new Promise<Response>((_r, nu) => semnal?.addEventListener("abort", () => nu(semnal!.reason)));
    }) as typeof fetch;
    const inceput = Date.now();
    await expect(ocupat("a1", new Date(), new Date(), f)).rejects.toThrow();
    expect(Date.now() - inceput).toBeGreaterThanOrEqual(2900);
    expect(Date.now() - inceput).toBeLessThan(5000);
  }, 8000);

  it("revoca nu aruncă", async () => {
    const { f, cereri } = fals(new Error("rețea"));
    await expect(revoca("r1", f)).resolves.toBeUndefined();
    expect(cereri[0].url).toContain("https://oauth2.googleapis.com/revoke");
  });
});
