// Confirmarea pe loc: când apare o programare nouă în calendarul unui om, clientul primește confirmarea.
// Intrarea: evenimentele din nodul „Programare nouă” (după declanșatoarele Google Calendar; între ele și cod vin citirile din tabel). Ieșirea: câte un mesaj de trimis (sau de sărit) pe canal.
const setari = $('Setări firmă').first().json;
const acum = $now.toMillis();

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

// Titlul programării: „<Serviciul> – <Numele clientului>”.
const desparteTitlul = (titlu) => {
  const [serviciu, ...rest] = String(titlu || '').split(/\s+[–—-]\s+/);
  const client = rest.join(' - ').trim();
  return { serviciu: serviciu.trim(), client, prenume: client.split(/\s+/)[0] || '' };
};
const randuri = (nume) => $(nume).all().map((i) => i.json).filter((r) => r && Object.keys(r).length);
const oraIso = (t) => { const d = new Date(t); return isNaN(d) ? String(t || '') : d.toISOString(); };
const cheie = (c) => telefonRo(c) || String(c || '').trim().toLowerCase();

const jurnal = randuri('Jurnal');
const nuTrimite = new Set(randuri('Nu trimite').map((r) => cheie(r.contact)));
const deja = (m) => jurnal.some((r) => r.eveniment_id === m.eveniment_id && oraIso(r.ora_programare) === m.ora_programare && r.tip === m.tip && (!r.contact || cheie(r.contact) === cheie(m.contact)));

// Pe ce canale pleacă: cele din setări; dacă clientul n-a lăsat contactul cerut, pe celălalt.
const tinte = ({ telefon, email }) => {
  const vrea = setari.canal === 'ambele' ? ['sms', 'email'] : [setari.canal];
  const are = { sms: telefon, email };
  const alese = vrea.filter((c) => are[c]);
  return (alese.length ? alese : ['sms', 'email'].filter((c) => are[c])).map((canal) => ({ canal, contact: are[canal] }));
};

const omul = (e) => e.om || (setari.oameni.find((o) => String(o.calendar_id || '').toLowerCase() === String((e.organizer && e.organizer.email) || '').toLowerCase()) || {}).nume || '';

const texte = (d) => {
  const elegant = setari.ton === 'elegant';
  const cu = d.om ? `, cu ${d.om}` : '';
  const sms = elegant
    ? `${d.client ? d.client + ', p' : 'P'}rogramarea la ${d.firma} este confirmata: ${d.zi}, ora ${d.ora}${cu}. Alta ora: ${d.link}`
    : `${d.prenume ? d.prenume + ', p' : 'P'}rogramarea ta la ${d.firma} e confirmata: ${d.zi}, ora ${d.ora}${cu}. Alta ora? ${d.link}`;
  const subiect = elegant ? `Programarea la ${d.firma}: ${d.zi}, ora ${d.ora}` : `Programarea ta la ${d.firma}: ${d.zi}, ora ${d.ora}`;
  const email = elegant
    ? `${d.client ? `Bună ziua, ${d.client},` : 'Bună ziua,'}\n\nProgramarea dumneavoastră este confirmată:\n${d.serviciu}${cu}\n${d.zi}, ora ${d.ora}\n${d.firma}, ${d.adresa}\n\nDacă doriți altă oră: ${d.link}\n\nVă așteptăm.\n${d.firma}, ${d.telefon}`
    : `${d.prenume ? `Salut, ${d.prenume}!` : 'Salut!'}\n\nProgramarea ta e confirmată:\n${d.serviciu}${cu}\n${d.zi}, ora ${d.ora}\n${d.firma}, ${d.adresa}\n\nDacă vrei altă oră: ${d.link}\n\nNe vedem!\n${d.firma}, ${d.telefon}`;
  return { sms: faraDiacritice(sms), subiect, email };
};

const iesire = [];
for (const { json: e } of $('Programare nouă').all()) {
  if (!e || e.status === 'cancelled' || !e.start || !e.start.dateTime) continue; // zi întreagă (concediu, „închis”) sau anulat
  const ora_programare = oraIso(e.start.dateTime);
  if (Date.parse(ora_programare) <= acum) continue;
  const baza = { eveniment_id: e.id, ora_programare, om: omul(e) };
  const lista = tinte(citesteContact(e.description));
  if (!lista.length) {
    const m = { ...baza, trimite: false, motiv: 'fara contact', tip: 'sarit', canal: '', contact: '' };
    if (!deja(m)) iesire.push(m);
    continue;
  }
  const t = texte({ ...desparteTitlul(e.summary), ...oraRo(ora_programare), om: baza.om, firma: setari.firma_nume, adresa: setari.firma_adresa, telefon: setari.firma_telefon, link: setari.link_programare });
  for (const { canal, contact } of lista) {
    if (nuTrimite.has(cheie(contact))) {
      const m = { ...baza, trimite: false, motiv: 'nu trimite', tip: 'sarit', canal, contact };
      if (!deja(m)) iesire.push(m);
      continue;
    }
    const m = { ...baza, trimite: true, tip: 'confirmare', canal, contact, ...(canal === 'email' ? { subiect: t.subiect, text: t.email } : { text: t.sms }) };
    if (!deja(m)) iesire.push(m);
  }
}
return iesire.map((json) => ({ json }));
