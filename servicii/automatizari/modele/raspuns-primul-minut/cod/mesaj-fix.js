// Răspuns în primul minut, rezerva: mesajul fix, când Claude nu răspunde (cheie greșită, limită, eroare).
// Intrarea: ieșirea de eroare a nodului AI. Datele vin din „Verifică cererea” și „Setări firmă”.
// Ieșirea: câte un mesaj de trimis pe fiecare canal, cu varianta „fix”.
const setari = $('Setări firmă').first().json;
const c = $('Verifică cererea').first().json;

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

const scurt = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);
const elegant = setari.ton === 'elegant';
const firma = setari.firma_nume, link = setari.link_programare, tel = setari.firma_telefon;
const cerere = c.cerere ? ` (${c.cerere})` : '';
const cerereSms = c.cerere ? ` (${scurt(c.cerere, 60)})` : '';

const prenume = scurt(c.prenume || '', 30);
const subiect = elegant ? `Cererea dumneavoastră la ${firma}` : `Cererea ta la ${firma}`;
const email = elegant
  ? `${c.nume ? `Bună ziua, ${c.nume},` : 'Bună ziua,'}\n\nAm primit cererea dumneavoastră${cerere} și revenim în curând cu o propunere.\n\nDacă doriți să alegeți deja ziua și ora: ${link}\n\nCu stimă,\n${firma}, ${tel}`
  : `${prenume ? `Salut, ${prenume}!` : 'Salut!'}\n\nAm primit cererea ta${cerere} și revenim în curând cu o propunere.\n\nDacă vrei să alegi deja ziua și ora: ${link}\n\n${firma}, ${tel}`;
const sms = faraDiacritice(`${prenume ? prenume + ', a' : 'A'}m primit cererea ${elegant ? 'dumneavoastra' : 'ta'}${cerereSms}. Revenim in curand cu o propunere. Programari: ${link} - ${scurt(firma, 40)}`);

return (c.canale || []).map(({ canal, contact }) => ({ json: {
  trimite: true, tip: 'raspuns', varianta: 'fix', canal, contact,
  ...(canal === 'email' ? { subiect, text: email } : { text: sms }),
} }));
