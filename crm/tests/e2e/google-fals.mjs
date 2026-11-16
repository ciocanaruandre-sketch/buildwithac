// Un Google fals pentru testele în browser (portul 3199): token, evenimente, ocupat/liber, revocare.
// POST /__pica {"pica": true} face ca toate răspunsurile următoare să fie 503, până la {"pica": false}.
import { createServer } from "node:http";

const PORT = Number(process.env.PORT_GOOGLE_FALS ?? 3199);
let pica = false;
let n = 0;
const create = new Set();
const SCOPE = "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.events.owned https://www.googleapis.com/auth/calendar.freebusy";

/** 12:00 în România, ca moment UTC, pentru ziua dată („2026-12-01”). */
function amiazaRomaniei(zi) {
  const [a, l, z] = zi.split("-").map(Number);
  const ghici = Date.UTC(a, l - 1, z, 12);
  const ora = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hourCycle: "h23" }).format(new Date(ghici)));
  return ghici - (ora - 12) * 3_600_000;
}

function ocupat(de, pana) {
  const zi = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" });
  const busy = [];
  for (let t = de.getTime() - 86_400_000; t <= pana.getTime() + 86_400_000; t += 86_400_000) {
    const start = amiazaRomaniei(zi.format(new Date(t)));
    if (busy.some((b) => b.start === new Date(start).toISOString())) continue;
    busy.push({ start: new Date(start).toISOString(), end: new Date(start + 3_600_000).toISOString() });
  }
  return busy;
}

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

createServer(async (req, res) => {
  let corp = "";
  for await (const bucata of req) corp += bucata;
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const trimite = (status, date) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(date === undefined ? "" : JSON.stringify(date));
  };

  if (url.pathname === "/__pica") {
    pica = Boolean(JSON.parse(corp || "{}").pica);
    return trimite(200, { pica });
  }
  if (url.pathname === "/__sanatate") return trimite(200, { ok: true });
  if (pica) return trimite(503, { error: "indisponibil" });

  if (url.pathname === "/token") {
    return trimite(200, { access_token: "fals", id_token: `x.${b64({ email: "test@exemplu.ro" })}.y`, refresh_token: "r", scope: SCOPE });
  }
  if (url.pathname === "/revoke") return trimite(200, {});
  if (url.pathname === "/calendar/v3/freeBusy") {
    const { timeMin, timeMax } = JSON.parse(corp || "{}");
    return trimite(200, { calendars: { primary: { busy: ocupat(new Date(timeMin), new Date(timeMax)) } } });
  }
  if (url.pathname.startsWith("/calendar/v3/calendars/primary/events")) {
    const id = url.pathname.split("/events/")[1];
    if (req.method === "POST") {
      // ca Google: un id ales de noi care există deja → 409
      const ales = JSON.parse(corp || "{}").id ?? `ev-${++n}`;
      if (create.has(ales)) return trimite(409, { error: { code: 409, message: "duplicate" } });
      create.add(ales);
      return trimite(200, { id: ales });
    }
    if (req.method === "PATCH") return trimite(200, { id });
    if (req.method === "DELETE") return trimite(204);
  }
  trimite(404, { error: "necunoscut" });
}).listen(PORT, () => console.log(`Google fals pe ${PORT}`));
