// Răspuns în primul minut, pasul 1: verifică cererea venită din formularul de pe site.
// Intrarea: ce dă nodul Webhook „Cerere de pe site” ({ body: { nume, telefon, email, cerere, mesaj, website } }); între ele stă citirea foii Cereri.
// Ieșirea: un singur item, { ok, motiv?, data, nume, prenume, telefon, email, cerere, mesaj, canale }.
// „Nu trimite” nu se citește aici: mesajul e răspunsul la cererea omului, nu o reclamă.
const setari = $('Setări firmă').first().json;
const acum = $now.toMillis();
const intrare = $('Cerere de pe site').first().json || {};
const d = intrare.body && typeof intrare.body === 'object' ? intrare.body : intrare;

// ---------- comune (același text în toate fișierele cod/ care le au) ----------
// Fără diacritice și fără semnele care scumpesc SMS-ul (cu ele, un SMS costă dublu).
const faraDiacritice = (text) => String(text || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[„”“″]/g, '"').replace(/[‘’‚′]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...').replace(/ /g, ' ');

// Telefonul în forma +407…, oricum ar fi scris; null dacă nu e un număr bun pentru SMS.
const telefonRo = (text) => {
  let n = String(text || '').replace(/[^\d+]/g, '');
  n = n.replace(/^(\+|00)400/, '$140'); // „+40 (0) 722…”: zeroul dintre paranteze
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

const text = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const ziRo = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date(ms));
const emailBun = (e) => (/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(e) ? e.toLowerCase() : null);

const nume = text(d.nume, 100);
const telefon = telefonRo(d.telefon);
const email = emailBun(text(d.email, 120));
const cerere = text(d.cerere, 200);
const mesaj = String(d.mesaj == null ? '' : d.mesaj).trim().slice(0, 1000);
const baza = { data: new Date(acum).toISOString(), nume, prenume: nume.split(' ')[0] || '', telefon, email, cerere, mesaj };

// Pe ce canale pleacă: cele din setări; dacă omul n-a lăsat contactul cerut, pe celălalt.
const vrea = setari.canal === 'ambele' ? ['sms', 'email'] : [setari.canal];
const are = { sms: telefon, email };
const alese = vrea.filter((c) => are[c]);
const canale = (alese.length ? alese : ['sms', 'email'].filter((c) => are[c])).map((canal) => ({ canal, contact: are[canal] }));

// Cel mult o cerere pe zi (ora României) de pe același telefon sau e-mail și cel mult MAX_CERERI_ZI pentru toată firma
// (un robot cu adrese mereu noi nu face Gmail-ul firmei să scrie la străini toată ziua).
const MAX_CERERI_ZI = 40;
const azi = ziRo(acum);
const cereriAzi = $('Cereri').all().map((i) => i.json).filter((r) => r && r.data && !isNaN(Date.parse(r.data)) && ziRo(Date.parse(r.data)) === azi);
const aziDeja = cereriAzi.some((r) => (telefon && telefonRo(r.telefon) === telefon) || (email && emailBun(String(r.email || '').trim()) === email));

const motiv = String(d.website || '').trim() ? 'capcana'
  : !canale.length ? 'fara contact'
  : aziDeja ? 'limita'
  : cereriAzi.length >= MAX_CERERI_ZI ? 'limita zi'
  : null;
return [{ json: motiv ? { ok: false, motiv, ...baza, canale } : { ok: true, ...baza, canale } }];
