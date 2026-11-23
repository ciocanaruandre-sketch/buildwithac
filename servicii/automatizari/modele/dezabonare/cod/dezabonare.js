// Dezabonarea: un SMS cu STOP (Twilio, POST) sau link-ul din e-mail (GET ?c=<adresa în base64url>).
// Întoarce { contact, sursa } pentru foaia „Nu trimite”, sau nimic dacă mesajul nu e o dezabonare.
const j = $input.first().json;

// Fără diacritice și litere mici, ca „Dezabonați” să fie prins la fel ca „dezabonati”.
const simplu = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Telefonul în forma +407…, oricum ar fi scris (0722…, 0040722…, +40 722-123-456).
const telefon = (t) => {
  let n = String(t || '').replace(/[^\d+]/g, '');
  if (n.startsWith('00')) n = '+' + n.slice(2);
  else if (n.startsWith('0')) n = '+40' + n.slice(1);
  else if (n.startsWith('40')) n = '+' + n;
  return n;
};

if (j.body && j.body.From) {
  const cuvinte = simplu(j.body.Body).split(/[^a-z]+/);
  const vreaAfara = cuvinte.some((c) => c === 'stop' || c === 'dezabonare' || c === 'dezabonez');
  return vreaAfara ? [{ json: { contact: telefon(j.body.From), sursa: 'sms' } }] : [];
}

const c = j.query && j.query.c;
if (!c) return [];
let email = '';
try { email = Buffer.from(String(c), 'base64url').toString('utf8').trim().toLowerCase(); } catch (e) { return []; }
return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? [{ json: { contact: email, sursa: 'email' } }] : [];
