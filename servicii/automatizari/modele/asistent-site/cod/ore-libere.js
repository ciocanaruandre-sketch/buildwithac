// Asistentul de pe site, unealta „ore_libere”: orele libere dintr-o zi, la un om sau la oricine.
// Intrarea: „Ce cere asistentul” ({ zi: "YYYY-MM-DD", om: nume | "oricine", serviciu, de_la?: "HH:MM" }), „Setări firmă”
// și „Programările” (evenimentele din calendarele oamenilor în ziua cerută; omul = e.om sau organizer.email = calendar_id).
// Ieșirea: { ziua, program, serviciu, durata_min, ore: [{ ora: "HH:MM", om }], mai_sunt } (cel mult 6 ore, din jumătate în jumătate de oră)
// sau { ok: false, eroare, detalii }. Azi, nicio oră mai devreme de o oră de acum.
const setari = $('Setări firmă').first().json;
const cerere = $('Ce cere asistentul').first().json || {};
const acum = $now.toMillis();
const evenimente = $('Programările').all().map((i) => i.json).filter((e) => e && e.start);
const PAS_MIN = 30, CATE = 6, CEL_MAI_DEVREME_MIN = 60;

// ---------- comune (același text în toate fișierele cod/ care le au) ----------
// Fără diacritice și fără semnele care scumpesc SMS-ul (cu ele, un SMS costă dublu).
const faraDiacritice = (text) => String(text || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[„”“″]/g, '"').replace(/[‘’‚′]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...').replace(/ /g, ' ');

// Telefonul în forma +407…, oricum ar fi scris; null dacă nu e un număr bun pentru SMS.
const telefonRo = (text) => {
  let n = String(text || '').replace(/[^\d+]/g, '');
  if (n.startsWith('00')) n = '+' + n.slice(2);
  else if (n.startsWith('0')) n = '+40' + n.slice(1);
  else if (n.startsWith('40')) n = '+' + n;
  return /^\+407\d{8}$/.test(n) || /^\+(?!40)[1-9]\d{8,14}$/.test(n) ? n : null;
};

// Telefonul și e-mailul din descrierea programării (text simplu sau HTML, cum o salvează Google Calendar).
const citesteContact = (descriere) => {
  const text = String(descriere || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  const email = (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/) || [null])[0];
  let telefon = null;
  for (const rand of text.split('\n')) {
    const m = rand.match(/tel(?:efon)?\s*[:.]?\s*([+\d][\d\s.()\/-]{7,})/i);
    if (m && (telefon = telefonRo(m[1]))) break;
  }
  if (!telefon) {
    const m = text.match(/(?:\+40|0040|\b0)\s?7\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/);
    telefon = m ? telefonRo(m[0]) : null;
  }
  return { telefon, email: email ? email.toLowerCase() : null };
};

// Ziua și ora în ora României, oricum vin din Google (cu „Z” sau cu fus).
const oraRo = (iso) => {
  const d = new Date(iso);
  const p = (o) => new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', ...o }).format(d);
  return { zi: `${p({ weekday: 'long' })}, ${p({ day: 'numeric' })} ${p({ month: 'long' })}`, ora: p({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) };
};
// ---------- sfârșitul celor comune ----------
const egal = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
// Cu câte milisecunde e ora României înaintea UTC, la momentul dat.
const decalaj = (ms) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Bucharest', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
};
// „2026-11-27” + „11:00”, în ora României → milisecunde
const laOra = (zi, hhmm) => { const brut = Date.parse(`${zi}T${hhmm}:00Z`); return brut - decalaj(brut - decalaj(brut)); };
const ziDin = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date(ms));
const minute = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const omul = (e) => e.om || (setari.oameni.find((o) => o.calendar_id === (e.organizer && e.organizer.email)) || {}).nume || '';
// Ce are ocupat un om: [început, sfârșit) în ms. O zi întreagă (concediu, „închis”) ocupă toată ziua.
const ocupate = (nume) => evenimente.filter((e) => e.status !== 'cancelled' && egal(omul(e), nume)).map((e) => (e.start.dateTime
  ? [Date.parse(e.start.dateTime), Date.parse((e.end && e.end.dateTime) || e.start.dateTime)]
  : [laOra(e.start.date, '00:00'), laOra((e.end && e.end.date) || e.start.date, '00:00') + (e.end && e.end.date ? 0 : 86400000)]));
const liber = (nume, s, f) => !ocupate(nume).some(([a, b]) => s < b && a < f);
const eroare = (eroare, detalii) => [{ json: { ok: false, eroare, detalii } }];
const faceServiciul = (o, serviciu) => (o.servicii || []).some((x) => egal(x, serviciu.nume));

const serviciu = setari.servicii.find((s) => egal(s.nume, cerere.serviciu));
if (!serviciu) return eroare('serviciu necunoscut', `Serviciile firmei: ${setari.servicii.map((s) => s.nume).join(', ')}.`);
let oameni = setari.oameni.filter((o) => faceServiciul(o, serviciu));
if (cerere.om && !egal(cerere.om, 'oricine')) {
  const o = setari.oameni.find((x) => egal(x.nume, cerere.om));
  if (!o) return eroare('om necunoscut', `La firmă lucrează: ${setari.oameni.map((x) => x.nume).join(', ')}.`);
  if (!faceServiciul(o, serviciu)) return eroare('serviciu necunoscut', `${o.nume} nu face ${serviciu.nume}. Îl fac: ${oameni.map((x) => x.nume).join(', ') || 'nimeni'}.`);
  oameni = [o];
}
const zi = String(cerere.zi || '').trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(zi) || isNaN(Date.parse(`${zi}T12:00:00Z`))) return eroare('zi greșită', 'Ziua se scrie YYYY-MM-DD, de exemplu 2026-11-27.');
const ziua = oraRo(laOra(zi, '12:00')).zi;
const p = setari.program[new Date(`${zi}T12:00:00Z`).getUTCDay()];
if (!p) return [{ json: { ziua, program: 'închis', serviciu: serviciu.nume, durata_min: serviciu.durata_min, ore: [], mai_sunt: false } }];

const deLa = /^\d{1,2}:\d{2}$/.test(String(cerere.de_la || '').trim()) ? minute(cerere.de_la) : 0;
const devreme = acum + CEL_MAI_DEVREME_MIN * 60000;
const ore = [];
for (let m = minute(p[0]); m + serviciu.durata_min <= minute(p[1]) && ore.length <= CATE; m += PAS_MIN) {
  const s = laOra(zi, hhmm(m)), f = s + serviciu.durata_min * 60000;
  if (m < deLa || s < devreme) continue;
  const om = oameni.find((o) => liber(o.nume, s, f));
  if (om) ore.push({ ora: hhmm(m), om: om.nume });
}
return [{ json: { ziua, program: `${p[0]}–${p[1]}`, serviciu: serviciu.nume, durata_min: serviciu.durata_min, ore: ore.slice(0, CATE), mai_sunt: ore.length > CATE } }];
