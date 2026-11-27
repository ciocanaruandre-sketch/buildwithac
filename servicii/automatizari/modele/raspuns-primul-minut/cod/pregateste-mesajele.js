// Răspuns în primul minut, pasul 3: citește răspunsul lui Claude (JSON) și face câte un mesaj pe canal.
// Un răspuns stricat aruncă o eroare: nodul are „On Error → ieșirea de eroare”, care duce la „Mesaj fix”.
const setari = $('Setări firmă').first().json;
const c = $('Verifică cererea').first().json;
const ai = $input.first().json || {};

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

// Textul răspunsului: câmpul unit („Include Merged Response”) sau bucățile de text.
const brut = typeof ai.merged_response === 'string' ? ai.merged_response
  : Array.isArray(ai.content) ? ai.content.filter((b) => b && b.type === 'text').map((b) => b.text).join('')
  : typeof ai.content === 'string' ? ai.content : '';
const json = (brut.match(/\{[\s\S]*\}/) || [''])[0];
let r;
try { r = JSON.parse(json); } catch (e) { throw new Error(`Răspunsul lui Claude nu e JSON: ${brut.slice(0, 200)}`); }

const link = setari.link_programare;
const canale = (c.canale || []).map((x) => x.canal);
let email = String(r.email || '').trim();
let sms = faraDiacritice(String(r.sms || '').trim());
if (!email) throw new Error('Claude n-a scris e-mailul');
if (email.length > 1600) throw new Error(`E-mailul are ${email.length} caractere`);
if (!email.includes(link)) email += `\n\n${link}`;
if (canale.includes('sms')) {
  if (!sms) throw new Error('Claude n-a scris SMS-ul');
  if (!sms.includes(link)) sms += ` ${link}`;
  if (sms.length > 300) throw new Error(`SMS-ul are ${sms.length} caractere`);
}
const subiect = String(r.subiect || '').trim().slice(0, 120)
  || (setari.ton === 'elegant' ? `Cererea dumneavoastră la ${setari.firma_nume}` : `Cererea ta la ${setari.firma_nume}`);

return (c.canale || []).map(({ canal, contact }) => ({ json: {
  trimite: true, tip: 'raspuns', varianta: 'ai', canal, contact,
  ...(canal === 'email' ? { subiect, text: email } : { text: sms }),
} }));
